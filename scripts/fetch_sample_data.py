#!/usr/bin/env python3
"""Fetch a tiny public-data sample to validate the data pipeline.

This is intentionally small: it proves that API -> raw -> clean -> model works
before we build a larger capital-cycle or liquidity pipeline.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import subprocess
import sys
from urllib.parse import urlencode
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Iterable

import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


ROOT = Path(__file__).resolve().parents[1]
RAW_API_DIR = ROOT / "data" / "raw" / "api"
CLEAN_DIR = ROOT / "data" / "clean"
MODEL_DIR = ROOT / "data" / "model"


@dataclass(frozen=True)
class StockSample:
    symbol: str
    secid: str
    yahoo_symbol: str
    tencent_symbol: str
    name: str
    market: str


STOCK_SAMPLES = [
    StockSample(symbol="600519.SH", secid="1.600519", yahoo_symbol="600519.SS", tencent_symbol="sh600519", name="贵州茅台", market="A股"),
    StockSample(symbol="300750.SZ", secid="0.300750", yahoo_symbol="300750.SZ", tencent_symbol="sz300750", name="宁德时代", market="A股"),
    StockSample(symbol="000001.SZ", secid="0.000001", yahoo_symbol="000001.SZ", tencent_symbol="sz000001", name="平安银行", market="A股"),
]


FRED_SAMPLES = {
    "DGS10": "US 10Y Treasury Yield",
    "BAMLH0A0HYM2": "US High Yield OAS",
}


def make_session() -> requests.Session:
    session = requests.Session()
    session.headers.update(
        {
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/126.0 Safari/537.36"
            )
        }
    )
    retry = Retry(
        total=1,
        connect=1,
        read=1,
        backoff_factor=1.2,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET",),
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def log(message: str) -> None:
    print(message, file=sys.stderr, flush=True)


def ensure_dirs() -> None:
    for path in [RAW_API_DIR, CLEAN_DIR, MODEL_DIR]:
        path.mkdir(parents=True, exist_ok=True)


def trading_date_compact(value: str) -> str:
    return value.replace("-", "")


def unix_ts(value: str) -> int:
    return int(datetime.fromisoformat(value).replace(tzinfo=timezone.utc).timestamp())


def fetch_yahoo_chart(session: requests.Session, sample: StockSample, start: str, end: str) -> dict:
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{sample.yahoo_symbol}"
    params = {
        "period1": unix_ts(start),
        "period2": unix_ts(end),
        "interval": "1d",
        "events": "history",
    }
    response = session.get(url, params=params, timeout=30)
    response.raise_for_status()
    payload = response.json()
    result = payload.get("chart", {}).get("result")
    if not result:
        raise RuntimeError(f"Yahoo returned no data for {sample.symbol}: {payload}")
    return {
        "provider": "yahoo_chart",
        "source_url": response.url,
        "fetched_at": date.today().isoformat(),
        "sample": sample.__dict__,
        "payload": payload,
    }


def parse_yahoo_chart(raw: dict) -> pd.DataFrame:
    sample = raw["sample"]
    result = raw["payload"]["chart"]["result"][0]
    timestamps = result.get("timestamp", [])
    quote = result.get("indicators", {}).get("quote", [{}])[0]
    rows = []
    for i, ts in enumerate(timestamps):
        close = quote.get("close", [None] * len(timestamps))[i]
        if close is None:
            continue
        rows.append(
            {
                "date": datetime.fromtimestamp(ts, tz=timezone.utc).date().isoformat(),
                "market": sample["market"],
                "symbol": sample["symbol"],
                "name": sample["name"],
                "open": quote.get("open", [None] * len(timestamps))[i],
                "close": close,
                "high": quote.get("high", [None] * len(timestamps))[i],
                "low": quote.get("low", [None] * len(timestamps))[i],
                "volume": quote.get("volume", [None] * len(timestamps))[i],
                "amount": None,
                "pct_chg": None,
            }
        )
    return pd.DataFrame(rows)


def fetch_tencent_kline(session: requests.Session, sample: StockSample, start: str, end: str) -> dict:
    url = "https://web.ifzq.gtimg.cn/appstock/app/fqkline/get"
    params = {
        "param": f"{sample.tencent_symbol},day,{start},{end},640,qfq",
    }
    response = session.get(url, params=params, timeout=30)
    response.raise_for_status()
    payload = response.json()
    rows = payload.get("data", {}).get(sample.tencent_symbol, {}).get("qfqday")
    if not rows:
        raise RuntimeError(f"Tencent returned no qfqday data for {sample.symbol}: {payload}")
    return {
        "provider": "tencent_fqkline",
        "source_url": response.url,
        "fetched_at": date.today().isoformat(),
        "sample": sample.__dict__,
        "payload": payload,
    }


def parse_tencent_kline(raw: dict) -> pd.DataFrame:
    sample = raw["sample"]
    rows = []
    data_rows = raw["payload"]["data"][sample["tencent_symbol"]]["qfqday"]
    for item in data_rows:
        # Tencent qfqday: date, open, close, high, low, volume
        rows.append(
            {
                "date": item[0],
                "market": sample["market"],
                "symbol": sample["symbol"],
                "name": sample["name"],
                "open": float(item[1]),
                "close": float(item[2]),
                "high": float(item[3]),
                "low": float(item[4]),
                "volume": float(item[5]),
                "amount": None,
                "pct_chg": None,
            }
        )
    return pd.DataFrame(rows)


def fetch_eastmoney_kline(session: requests.Session, sample: StockSample, start: str, end: str) -> dict:
    url = "https://push2his.eastmoney.com/api/qt/stock/kline/get"
    params = {
        "secid": sample.secid,
        "fields1": "f1,f2,f3,f4,f5,f6",
        "fields2": "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61",
        "klt": "101",
        "fqt": "1",
        "beg": trading_date_compact(start),
        "end": trading_date_compact(end),
    }
    response = session.get(url, params=params, timeout=30)
    response.raise_for_status()
    payload = response.json()
    if payload.get("rc") != 0 or not payload.get("data"):
        raise RuntimeError(f"Eastmoney returned no data for {sample.symbol}: {payload}")
    return {
        "provider": "eastmoney",
        "source_url": response.url,
        "fetched_at": date.today().isoformat(),
        "sample": sample.__dict__,
        "payload": payload,
    }


def parse_eastmoney_kline(raw: dict) -> pd.DataFrame:
    sample = raw["sample"]
    rows = []
    for line in raw["payload"]["data"].get("klines", []):
        fields = next(csv.reader([line]))
        rows.append(
            {
                "date": fields[0],
                "market": sample["market"],
                "symbol": sample["symbol"],
                "name": raw["payload"]["data"].get("name") or sample["name"],
                "open": float(fields[1]),
                "close": float(fields[2]),
                "high": float(fields[3]),
                "low": float(fields[4]),
                "volume": float(fields[5]),
                "amount": float(fields[6]),
                "pct_chg": float(fields[8]),
            }
        )
    return pd.DataFrame(rows)


def fetch_fred_csv(series_id: str, start: str, end: str) -> dict:
    base_url = "https://fred.stlouisfed.org/graph/fredgraph.csv"
    params = {"id": series_id, "cosd": start, "coed": end}
    url = f"{base_url}?{urlencode(params)}"
    # On the system Python bundled with macOS, requests/urllib3 can hang on this
    # endpoint because of the LibreSSL transport. curl is stable here, so the
    # smoke-test provider uses it directly.
    result = subprocess.run(
        ["curl", "-L", "--fail", "--silent", "--show-error", "--max-time", "30", url],
        check=True,
        capture_output=True,
        text=True,
    )
    return {
        "provider": "fred",
        "source_url": url,
        "fetched_at": date.today().isoformat(),
        "series_id": series_id,
        "series_name": FRED_SAMPLES[series_id],
        "csv": result.stdout,
    }


def parse_fred_csv(raw: dict) -> pd.DataFrame:
    df = pd.read_csv(io.StringIO(raw["csv"]))
    value_col = raw["series_id"]
    df = df.rename(columns={"observation_date": "date", value_col: "value"})
    df["series_id"] = raw["series_id"]
    df["series_name"] = raw["series_name"]
    df["provider"] = raw["provider"]
    df["value"] = pd.to_numeric(df["value"].replace(".", pd.NA), errors="coerce")
    return df[["date", "series_id", "series_name", "provider", "value"]]


def write_json(path: Path, data: object) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def build_snapshot(prices: pd.DataFrame, macro: pd.DataFrame, start: str, end: str, stock_provider: str) -> dict:
    price_rows = []
    for symbol, group in prices.sort_values("date").groupby("symbol"):
        first = group.iloc[0]
        last = group.iloc[-1]
        price_rows.append(
            {
                "symbol": symbol,
                "name": last["name"],
                "market": last["market"],
                "start_date": first["date"],
                "end_date": last["date"],
                "start_close": round(float(first["close"]), 4),
                "end_close": round(float(last["close"]), 4),
                "period_return_pct": round((float(last["close"]) / float(first["close"]) - 1) * 100, 4),
                "latest_amount": None if pd.isna(last["amount"]) else round(float(last["amount"]), 2),
            }
        )

    macro_rows = []
    for series_id, group in macro.dropna(subset=["value"]).sort_values("date").groupby("series_id"):
        last = group.iloc[-1]
        macro_rows.append(
            {
                "series_id": series_id,
                "series_name": last["series_name"],
                "latest_date": last["date"],
                "latest_value": round(float(last["value"]), 4),
            }
        )

    return {
        "generated_at": date.today().isoformat(),
        "window": {"start": start, "end": end},
        "providers": [stock_provider, "fred"],
        "stocks": price_rows,
        "macro": macro_rows,
    }


def concat_frames(frames: Iterable[pd.DataFrame]) -> pd.DataFrame:
    valid = [frame for frame in frames if not frame.empty]
    return pd.concat(valid, ignore_index=True) if valid else pd.DataFrame()


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch small public market-data samples.")
    parser.add_argument("--start", default="2025-01-01")
    parser.add_argument("--end", default=date.today().isoformat())
    parser.add_argument("--stock-provider", choices=["tencent", "yahoo", "eastmoney"], default="tencent")
    args = parser.parse_args()

    ensure_dirs()
    session = make_session()

    price_frames = []
    for sample in STOCK_SAMPLES:
        log(f"fetch stock {sample.symbol} via {args.stock_provider}")
        if args.stock_provider == "eastmoney":
            raw = fetch_eastmoney_kline(session, sample, args.start, args.end)
            frame = parse_eastmoney_kline(raw)
        elif args.stock_provider == "yahoo":
            raw = fetch_yahoo_chart(session, sample, args.start, args.end)
            frame = parse_yahoo_chart(raw)
        else:
            raw = fetch_tencent_kline(session, sample, args.start, args.end)
            frame = parse_tencent_kline(raw)
        raw_path = RAW_API_DIR / f"{raw['provider']}_{sample.symbol}_{args.start}_{args.end}.json"
        write_json(raw_path, raw)
        price_frames.append(frame)

    macro_frames = []
    for series_id in FRED_SAMPLES:
        log(f"fetch macro {series_id} via fred")
        raw = fetch_fred_csv(series_id, args.start, args.end)
        raw_path = RAW_API_DIR / f"fred_{series_id}_{args.start}_{args.end}.json"
        write_json(raw_path, raw)
        macro_frames.append(parse_fred_csv(raw))

    prices = concat_frames(price_frames)
    macro = concat_frames(macro_frames)

    prices_path = CLEAN_DIR / "sample_prices.csv"
    macro_path = CLEAN_DIR / "sample_macro.csv"
    prices.to_csv(prices_path, index=False)
    macro.to_csv(macro_path, index=False)

    snapshot = build_snapshot(prices, macro, args.start, args.end, args.stock_provider)
    snapshot_path = MODEL_DIR / "sample_market_snapshot.json"
    write_json(snapshot_path, snapshot)

    print(json.dumps(
        {
            "status": "ok",
            "raw_files": len(STOCK_SAMPLES) + len(FRED_SAMPLES),
            "price_rows": len(prices),
            "macro_rows": len(macro),
            "outputs": [str(prices_path), str(macro_path), str(snapshot_path)],
        },
        ensure_ascii=False,
        indent=2,
    ))


if __name__ == "__main__":
    main()
