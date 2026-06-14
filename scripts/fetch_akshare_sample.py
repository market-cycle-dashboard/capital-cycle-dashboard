#!/usr/bin/env python3
"""Fetch AKShare financial-indicator samples.

This script is a focused provider test for AKShare. In the current network
environment, AKShare's market quote endpoints can time out, while the financial
analysis indicator endpoint is usable. We therefore start by wiring the
financial indicator path into raw/clean/model outputs.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Iterable

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
RAW_API_DIR = ROOT / "data" / "raw" / "api"
CLEAN_DIR = ROOT / "data" / "clean"
MODEL_DIR = ROOT / "data" / "model"


@dataclass(frozen=True)
class StockSample:
    symbol: str
    ak_symbol: str
    name: str
    market: str


STOCK_SAMPLES = [
    StockSample(symbol="600519.SH", ak_symbol="600519", name="贵州茅台", market="A股"),
    StockSample(symbol="300750.SZ", ak_symbol="300750", name="宁德时代", market="A股"),
    StockSample(symbol="000001.SZ", ak_symbol="000001", name="平安银行", market="A股"),
]


CLEAN_COLUMNS = {
    "日期": "report_date",
    "净资产收益率(%)": "roe",
    "加权净资产收益率(%)": "roe_weighted",
    "营业利润率(%)": "operating_margin",
    "销售毛利率(%)": "gross_margin",
    "资产负债率(%)": "debt_to_assets",
    "经营现金净流量与净利润的比率(%)": "operating_cashflow_to_net_profit",
    "经营现金净流量对销售收入比率(%)": "operating_cashflow_to_revenue",
    "总资产增长率(%)": "asset_growth",
    "净利润增长率(%)": "net_profit_growth",
    "主营业务收入增长率(%)": "revenue_growth",
    "总资产(元)": "total_assets",
}


def ensure_dirs() -> None:
    for path in [RAW_API_DIR, CLEAN_DIR, MODEL_DIR]:
        path.mkdir(parents=True, exist_ok=True)


def log(message: str) -> None:
    print(message, file=sys.stderr, flush=True)


def fetch_indicator_in_subprocess(sample: StockSample, start_year: str, timeout: int) -> pd.DataFrame:
    code = f"""
import akshare as ak
df = ak.stock_financial_analysis_indicator(symbol={sample.ak_symbol!r}, start_year={start_year!r})
print(df.to_json(orient='records', force_ascii=False, date_format='iso'))
"""
    result = subprocess.run(
        ["python3", "-c", code],
        capture_output=True,
        text=True,
        timeout=timeout,
        check=True,
    )
    records = json.loads(result.stdout)
    return pd.DataFrame(records)


def write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def clean_indicator_frame(sample: StockSample, raw_df: pd.DataFrame) -> pd.DataFrame:
    available = [column for column in CLEAN_COLUMNS if column in raw_df.columns]
    clean = raw_df[available].rename(columns=CLEAN_COLUMNS).copy()
    clean.insert(0, "market", sample.market)
    clean.insert(1, "symbol", sample.symbol)
    clean.insert(2, "name", sample.name)
    clean["report_date"] = pd.to_datetime(clean["report_date"], errors="coerce").dt.date.astype("string")
    for column in clean.columns:
        if column not in {"market", "symbol", "name", "report_date"}:
            clean[column] = pd.to_numeric(clean[column], errors="coerce")
    return clean.sort_values("report_date")


def concat_frames(frames: Iterable[pd.DataFrame]) -> pd.DataFrame:
    valid = [frame for frame in frames if not frame.empty]
    return pd.concat(valid, ignore_index=True) if valid else pd.DataFrame()


def build_financial_snapshot(clean: pd.DataFrame, start_year: str) -> dict:
    latest_rows = []
    for symbol, group in clean.dropna(subset=["report_date"]).sort_values("report_date").groupby("symbol"):
        latest = group.iloc[-1]
        latest_rows.append(
            {
                "symbol": symbol,
                "name": latest["name"],
                "market": latest["market"],
                "latest_report_date": latest["report_date"],
                "roe": None if pd.isna(latest.get("roe")) else round(float(latest["roe"]), 4),
                "debt_to_assets": None if pd.isna(latest.get("debt_to_assets")) else round(float(latest["debt_to_assets"]), 4),
                "operating_cashflow_to_net_profit": (
                    None
                    if pd.isna(latest.get("operating_cashflow_to_net_profit"))
                    else round(float(latest["operating_cashflow_to_net_profit"]), 4)
                ),
                "revenue_growth": None if pd.isna(latest.get("revenue_growth")) else round(float(latest["revenue_growth"]), 4),
                "net_profit_growth": None if pd.isna(latest.get("net_profit_growth")) else round(float(latest["net_profit_growth"]), 4),
            }
        )
    return {
        "generated_at": date.today().isoformat(),
        "provider": "akshare",
        "source_function": "stock_financial_analysis_indicator",
        "start_year": start_year,
        "stocks": latest_rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch AKShare financial indicator samples.")
    parser.add_argument("--start-year", default="2024")
    parser.add_argument("--timeout", type=int, default=45)
    args = parser.parse_args()

    ensure_dirs()
    clean_frames = []

    for sample in STOCK_SAMPLES:
        log(f"fetch AKShare financial indicators {sample.symbol}")
        raw_df = fetch_indicator_in_subprocess(sample, args.start_year, args.timeout)
        raw_payload = {
            "provider": "akshare",
            "source_function": "stock_financial_analysis_indicator",
            "fetched_at": date.today().isoformat(),
            "sample": sample.__dict__,
            "columns": list(raw_df.columns),
            "records": raw_df.to_dict(orient="records"),
        }
        raw_path = RAW_API_DIR / f"akshare_financial_indicator_{sample.symbol}_{args.start_year}.json"
        write_json(raw_path, raw_payload)
        clean_frames.append(clean_indicator_frame(sample, raw_df))

    clean = concat_frames(clean_frames)
    clean_path = CLEAN_DIR / "akshare_sample_financial_indicators.csv"
    clean.to_csv(clean_path, index=False)

    snapshot = build_financial_snapshot(clean, args.start_year)
    snapshot_path = MODEL_DIR / "akshare_sample_financial_snapshot.json"
    write_json(snapshot_path, snapshot)

    print(
        json.dumps(
            {
                "status": "ok",
                "provider": "akshare",
                "raw_files": len(STOCK_SAMPLES),
                "clean_rows": len(clean),
                "outputs": [str(clean_path), str(snapshot_path)],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()

