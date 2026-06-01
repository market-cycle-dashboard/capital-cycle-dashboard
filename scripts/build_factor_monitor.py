#!/usr/bin/env python3
"""Build a static factor monitoring dataset from the SQL Server factor panel."""

from __future__ import annotations

import argparse
import json
import math
import os
import time
import warnings
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import pymssql

warnings.filterwarnings("ignore", message="pandas only supports SQLAlchemy connectable")
warnings.filterwarnings("ignore", category=FutureWarning, message="DataFrameGroupBy.apply operated on the grouping columns")


@dataclass(frozen=True)
class FactorSpec:
    name: str
    label: str
    group: str
    direction: int
    description: str


FACTOR_SPECS = [
    FactorSpec("s_dq_mv", "市值", "规模流动性", -1, "总市值，小市值方向取正。"),
    FactorSpec("s_dq_turn", "换手率", "规模流动性", -1, "换手率，低换手方向取正。"),
    FactorSpec("s_dq_freeturnover", "自由换手率", "规模流动性", -1, "自由流通换手率，低换手方向取正。"),
    FactorSpec("s_val_pb_new", "PB", "估值", -1, "市净率，低估值方向取正。"),
    FactorSpec("s_val_pe_ttm", "PE TTM", "估值", -1, "滚动市盈率，低估值方向取正。"),
    FactorSpec("s_val_ps_ttm", "PS TTM", "估值", -1, "滚动市销率，低估值方向取正。"),
    FactorSpec("s_fa_roe", "ROE", "盈利质量", 1, "净资产收益率，高盈利方向取正。"),
    FactorSpec("s_fa_roa", "ROA", "盈利质量", 1, "总资产收益率，高盈利方向取正。"),
    FactorSpec("s_fa_roic", "ROIC", "盈利质量", 1, "投入资本回报率，高盈利方向取正。"),
    FactorSpec("s_fa_grossprofitmargin", "毛利率", "盈利质量", 1, "销售毛利率，高毛利方向取正。"),
    FactorSpec("s_qfa_yoygr", "单季收入同比", "成长", 1, "单季度营业总收入同比增长率。"),
    FactorSpec("s_fa_yoynetprofit", "净利润同比", "成长", 1, "净利润同比增长率。"),
    FactorSpec("est_eps_YOY", "预期 EPS 同比", "成长", 1, "分析师预期 EPS 同比。"),
    FactorSpec("s_fa_debttoassets", "资产负债率", "杠杆安全", -1, "资产负债率，低杠杆方向取正。"),
    FactorSpec("s_fa_current", "流动比率", "杠杆安全", 1, "流动比率，高偿债能力方向取正。"),
    FactorSpec("mom", "MOM", "动量反转", 1, "价格动量。"),
    FactorSpec("roc", "ROC", "动量反转", 1, "价格变化率。"),
    FactorSpec("rsi", "RSI", "动量反转", 1, "相对强弱指标。"),
    FactorSpec("macd", "MACD", "动量反转", 1, "MACD 趋势指标。"),
    FactorSpec("natr", "NATR", "波动交易", -1, "标准化真实波幅，低波方向取正。"),
    FactorSpec("trange", "TRANGE", "波动交易", -1, "真实波幅，低波方向取正。"),
    FactorSpec("factorzoo_fm_all_m_8", "Zoo 基本面 8", "Zoo 基本面", 1, "管理费用-毛利相对市值变化。"),
    FactorSpec("factorzoo_fm_all_m_10", "Zoo 基本面 10", "Zoo 基本面", 1, "扣非利润、权益趋势、营运资金复合信号。"),
    FactorSpec("factorzoo_pv_all_mtd_0", "Zoo 量价 0", "Zoo 量价", 1, "量价活跃/波动复合信号。"),
    FactorSpec("factorzoo_pv_all_mtd_1", "Zoo 量价 1", "Zoo 量价", 1, "价格水平相关复合信号。"),
    FactorSpec("factorzoo_pv_all_mtd_4", "Zoo 量价 4", "Zoo 量价", 1, "低波/规模稳定相关复合信号。"),
    FactorSpec("factorzoo_pv_all_mtd_6", "Zoo 量价 6", "Zoo 量价", 1, "活跃度/动量混合信号。"),
]

CONTROL_COLS = ["s_dq_close_today", "s_dq_mv", "s_val_pb_new", "s_val_pe_ttm", "s_dq_turn", "s_dq_freeturnover"]


def env(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if value is None or value == "":
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def connect() -> pymssql.Connection:
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            return pymssql.connect(
                server=env("FACTOR_DB_HOST"),
                port=int(env("FACTOR_DB_PORT", "1433")),
                user=env("FACTOR_DB_USER"),
                password=env("FACTOR_DB_PASSWORD"),
                database=env("FACTOR_DB_NAME"),
                login_timeout=10,
                timeout=180,
                charset="utf8",
            )
        except pymssql.OperationalError as exc:
            last_error = exc
            if attempt < 2:
                time.sleep(2)
    raise RuntimeError("Could not connect to factor database after 3 attempts") from last_error


def finite_or_none(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (float, np.floating)):
        return float(value) if math.isfinite(float(value)) else None
    if isinstance(value, (int, np.integer)):
        return int(value)
    if isinstance(value, pd.Timestamp):
        return value.date().isoformat()
    return value


def corr(g: pd.DataFrame, factor_col: str, method: str) -> float:
    gg = g[[factor_col, "next_ret"]].replace([np.inf, -np.inf], np.nan).dropna()
    if len(gg) < 30 or gg[factor_col].nunique() < 3 or gg["next_ret"].nunique() < 3:
        return np.nan
    return float(gg[factor_col].corr(gg["next_ret"], method=method))


def summarize_series(s: pd.Series) -> dict[str, Any]:
    s = s.replace([np.inf, -np.inf], np.nan).dropna()
    if s.empty:
        return {"mean": None, "std": None, "ir": None, "positive_rate": None, "n": 0}
    std = float(s.std(ddof=1)) if len(s) > 1 else np.nan
    mean = float(s.mean())
    return {
        "mean": finite_or_none(mean),
        "std": finite_or_none(std),
        "ir": finite_or_none(mean / std if std and math.isfinite(std) else np.nan),
        "positive_rate": finite_or_none(float((s > 0).mean())),
        "n": int(len(s)),
    }


def fetch_panel(months_back: int, source_table: str, factor_specs: list[FactorSpec]) -> pd.DataFrame:
    factor_cols = [spec.name for spec in factor_specs]
    cols = ["end_date", "stock_code"] + sorted(set(CONTROL_COLS + factor_cols))
    sql = f"""
        select {",".join(f"[{col}]" for col in cols)}
        from dbo.[{source_table}]
        where end_date >= dateadd(month, -{int(months_back)}, (select max(end_date) from dbo.[{source_table}]))
        order by stock_code, end_date
    """
    with connect() as conn:
        df = pd.read_sql(sql, conn)
    return df


def load_industry_map(path: str | None) -> pd.DataFrame | None:
    if not path:
        return None
    industry_path = Path(path)
    if not industry_path.exists():
        raise FileNotFoundError(f"Industry map not found: {industry_path}")
    df = pd.read_csv(industry_path)
    required = {"stock_code", "industry"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Industry map must contain columns: {sorted(required)}; missing: {sorted(missing)}")
    return df[["stock_code", "industry"]].dropna().drop_duplicates("stock_code")


def add_size_residuals(g: pd.DataFrame) -> pd.DataFrame:
    g = g.copy()
    g["factor_size_resid"] = np.nan
    ok = g[["factor", "s_dq_mv"]].replace([np.inf, -np.inf], np.nan).dropna()
    ok = ok[ok["s_dq_mv"] > 0]
    if len(ok) >= 30 and ok["factor"].nunique() >= 3 and ok["s_dq_mv"].nunique() >= 3:
        x = np.log(ok["s_dq_mv"].to_numpy(dtype=float))
        y = ok["factor"].to_numpy(dtype=float)
        design = np.vstack([np.ones(len(x)), x]).T
        beta = np.linalg.lstsq(design, y, rcond=None)[0]
        g.loc[ok.index, "factor_size_resid"] = y - design @ beta
    return g


def add_industry_residuals(g: pd.DataFrame) -> pd.DataFrame:
    g = g.copy()
    g["factor_industry_resid"] = np.nan
    ok = g[["factor", "industry"]].replace([np.inf, -np.inf], np.nan).dropna()
    industry_counts = ok["industry"].value_counts()
    valid_industries = industry_counts[industry_counts >= 5].index
    ok = ok[ok["industry"].isin(valid_industries)]
    if len(ok) >= 30 and ok["industry"].nunique() >= 2 and ok["factor"].nunique() >= 3:
        g.loc[ok.index, "factor_industry_resid"] = ok["factor"] - ok.groupby("industry")["factor"].transform("mean")
    return g


def build_monitor(
    df: pd.DataFrame,
    factor_specs: list[FactorSpec],
    frequency: str,
    source_table: str,
    gap_range: tuple[int, int],
    industry_map: pd.DataFrame | None = None,
) -> dict[str, Any]:
    df = df.copy()
    has_industry_map = industry_map is not None and not industry_map.empty
    if has_industry_map:
        df = df.merge(industry_map, on="stock_code", how="left")
    else:
        df["industry"] = np.nan
    df["end_date"] = pd.to_datetime(df["end_date"])
    df = df.sort_values(["stock_code", "end_date"])
    df["next_close"] = df.groupby("stock_code")["s_dq_close_today"].shift(-1)
    df["next_date"] = df.groupby("stock_code")["end_date"].shift(-1)
    df["next_ret"] = df["next_close"] / df["s_dq_close_today"] - 1
    df["gap_days"] = (df["next_date"] - df["end_date"]).dt.days
    base = df[df["next_ret"].notna() & df["gap_days"].between(gap_range[0], gap_range[1])].copy()

    latest_complete = base["end_date"].max()
    latest_panel = df["end_date"].max()
    latest_snapshot = df[df["end_date"] == latest_panel].copy()
    factor_cards: list[dict[str, Any]] = []
    factor_details: dict[str, Any] = {}

    for spec in factor_specs:
        x_cols = list(dict.fromkeys(["end_date", "stock_code", "industry", "next_ret", "s_dq_mv", "s_val_pb_new", "s_val_pe_ttm", "s_dq_turn", "s_dq_freeturnover", spec.name]))
        x = base[x_cols].copy()
        x["raw_factor"] = base[spec.name]
        x["factor"] = spec.direction * x["raw_factor"]
        x = x.replace([np.inf, -np.inf], np.nan).dropna(subset=["factor", "next_ret"])
        if x.empty:
            continue
        x = x.groupby("end_date", group_keys=False).apply(add_size_residuals)
        if has_industry_map:
            x = x.groupby("end_date", group_keys=False).apply(add_industry_residuals)
        else:
            x["factor_industry_resid"] = np.nan

        ic = x.groupby("end_date").apply(
            lambda g: pd.Series(
                {
                    "ic": corr(g, "factor", "pearson"),
                    "rank_ic": corr(g, "factor", "spearman"),
                    "size_neutral_rank_ic": corr(g, "factor_size_resid", "spearman"),
                    "industry_neutral_rank_ic": corr(g, "factor_industry_resid", "spearman"),
                    "n": len(g),
                    "industry_n": g["industry"].nunique(),
                    "mv_rank_corr": g["factor"].corr(g["s_dq_mv"], method="spearman") if g["s_dq_mv"].notna().sum() > 30 else np.nan,
                    "turn_rank_corr": g["factor"].corr(g["s_dq_turn"], method="spearman") if g["s_dq_turn"].notna().sum() > 30 else np.nan,
                }
            )
        ).reset_index()

        x["q"] = x.groupby("end_date")["factor"].transform(
            lambda s: pd.qcut(s.rank(method="first"), 5, labels=False) + 1 if s.notna().sum() >= 5 else np.nan
        )
        grouped = x.dropna(subset=["q"]).groupby(["end_date", "q"])
        qret = grouped.agg(
            next_ret=("next_ret", "mean"),
            n=("stock_code", "count"),
            pb=("s_val_pb_new", "median"),
            pe=("s_val_pe_ttm", "median"),
            mv=("s_dq_mv", "median"),
            turn=("s_dq_turn", "median"),
            free_turn=("s_dq_freeturnover", "median"),
        ).reset_index()
        qwide = qret.pivot(index="end_date", columns="q", values="next_ret")
        long_short = qwide[5] - qwide[1] if 1 in qwide and 5 in qwide else pd.Series(dtype=float)
        qmetric = qret.pivot(index="end_date", columns="q", values=["pb", "pe", "mv", "turn", "free_turn"])
        crowding_trend = pd.DataFrame(index=qwide.index)
        if (1 in qwide and 5 in qwide) and not qmetric.empty:
            crowding_trend["pb_spread"] = qmetric[("pb", 5)] - qmetric[("pb", 1)]
            crowding_trend["pe_spread"] = qmetric[("pe", 5)] - qmetric[("pe", 1)]
            crowding_trend["mv_ratio"] = qmetric[("mv", 5)] / qmetric[("mv", 1)]
            crowding_trend["turn_spread"] = qmetric[("turn", 5)] - qmetric[("turn", 1)]
            crowding_trend["free_turn_spread"] = qmetric[("free_turn", 5)] - qmetric[("free_turn", 1)]

        latest_q = qret[qret["end_date"] == latest_complete]
        q1 = latest_q[latest_q["q"] == 1]
        q5 = latest_q[latest_q["q"] == 5]
        crowding = {}
        if not q1.empty and not q5.empty:
            crowding = {
                "pb_spread": finite_or_none(float(q5["pb"].iloc[0] - q1["pb"].iloc[0])),
                "pe_spread": finite_or_none(float(q5["pe"].iloc[0] - q1["pe"].iloc[0])),
                "mv_ratio": finite_or_none(float(q5["mv"].iloc[0] / q1["mv"].iloc[0])) if q1["mv"].iloc[0] else None,
                "turn_spread": finite_or_none(float(q5["turn"].iloc[0] - q1["turn"].iloc[0])),
                "free_turn_spread": finite_or_none(float(q5["free_turn"].iloc[0] - q1["free_turn"].iloc[0])),
            }

        top_snapshot_cols = list(dict.fromkeys(["stock_code", "industry", "s_dq_mv", "s_val_pb_new", "s_val_pe_ttm", "s_dq_turn", "s_dq_freeturnover", spec.name]))
        latest_factor = latest_snapshot[top_snapshot_cols].copy()
        latest_factor["raw_factor"] = latest_snapshot[spec.name]
        latest_factor["factor"] = spec.direction * latest_factor["raw_factor"]
        latest_factor = latest_factor.replace([np.inf, -np.inf], np.nan).dropna(subset=["factor"])
        top_stocks = latest_factor.sort_values("factor", ascending=False).head(20)
        top_stock_rows = [
            {
                "stock_code": row["stock_code"],
                "industry": finite_or_none(row.get("industry")),
                "raw_factor": finite_or_none(row["raw_factor"]),
                "score_factor": finite_or_none(row["factor"]),
                "mv": finite_or_none(row.get("s_dq_mv")),
                "pb": finite_or_none(row.get("s_val_pb_new")),
                "pe": finite_or_none(row.get("s_val_pe_ttm")),
                "turn": finite_or_none(row.get("s_dq_turn")),
                "free_turn": finite_or_none(row.get("s_dq_freeturnover")),
            }
            for row in top_stocks.to_dict(orient="records")
        ]
        industry_exposure = []
        if has_industry_map and not top_stocks.empty and top_stocks["industry"].notna().any():
            industry_exposure = [
                {"industry": idx, "count": int(count)}
                for idx, count in top_stocks["industry"].fillna("未知").value_counts().head(8).items()
            ]

        rank_ic_summary = summarize_series(ic["rank_ic"])
        neutral_rank_ic_summary = summarize_series(ic["size_neutral_rank_ic"])
        industry_rank_ic_summary = summarize_series(ic["industry_neutral_rank_ic"])
        ls_summary = summarize_series(long_short)
        recent_window = 3 if frequency == "monthly" else 6
        recent_ic = ic.tail(recent_window)["rank_ic"].mean()
        recent_neutral_ic = ic.tail(recent_window)["size_neutral_rank_ic"].mean()
        recent_industry_ic = ic.tail(recent_window)["industry_neutral_rank_ic"].mean()
        latest_ls = long_short.tail(recent_window).mean() if not long_short.empty else np.nan
        score = 0.0
        if rank_ic_summary["mean"] is not None:
            score += 100 * rank_ic_summary["mean"]
        if rank_ic_summary["ir"] is not None:
            score += 8 * rank_ic_summary["ir"]
        if ls_summary["mean"] is not None:
            score += 80 * ls_summary["mean"]
        crowding_score = 0
        if abs(float(ic["mv_rank_corr"].tail(3).mean())) > 0.35:
            crowding_score += 1
        if crowding.get("turn_spread") is not None and abs(crowding["turn_spread"]) > 0.5:
            crowding_score += 1
        if crowding.get("pb_spread") is not None and abs(crowding["pb_spread"]) > 1:
            crowding_score += 1

        card = {
            "name": spec.name,
            "label": spec.label,
            "group": spec.group,
            "direction": spec.direction,
            "description": spec.description,
            "coverage_rows": int(len(x)),
            "avg_cross_section_n": finite_or_none(float(ic["n"].mean())),
            "rank_ic_mean": rank_ic_summary["mean"],
            "rank_ic_ir": rank_ic_summary["ir"],
            "rank_ic_positive_rate": rank_ic_summary["positive_rate"],
            "size_neutral_rank_ic_mean": neutral_rank_ic_summary["mean"],
            "size_neutral_rank_ic_ir": neutral_rank_ic_summary["ir"],
            "industry_neutral_rank_ic_mean": industry_rank_ic_summary["mean"],
            "industry_neutral_rank_ic_ir": industry_rank_ic_summary["ir"],
            "recent_3m_rank_ic": finite_or_none(float(recent_ic)),
            "recent_size_neutral_rank_ic": finite_or_none(float(recent_neutral_ic)),
            "recent_industry_neutral_rank_ic": finite_or_none(float(recent_industry_ic)),
            "long_short_mean": ls_summary["mean"],
            "long_short_positive_rate": ls_summary["positive_rate"],
            "recent_3m_long_short": finite_or_none(float(latest_ls)),
            "mv_rank_corr_recent": finite_or_none(float(ic["mv_rank_corr"].tail(3).mean())),
            "turn_rank_corr_recent": finite_or_none(float(ic["turn_rank_corr"].tail(3).mean())),
            "crowding": crowding,
            "crowding_score": crowding_score,
            "score": finite_or_none(score),
        }
        factor_cards.append(card)
        factor_details[spec.name] = {
            "top_stocks": top_stock_rows,
            "top_industry_exposure": industry_exposure,
            "ic_by_month": [
                {k: finite_or_none(v) for k, v in row.items()}
                for row in ic.to_dict(orient="records")
            ],
            "long_short_by_month": [
                {"end_date": finite_or_none(idx), "q5_minus_q1": finite_or_none(val)}
                for idx, val in long_short.items()
            ],
            "crowding_by_period": [
                {"end_date": finite_or_none(idx), **{k: finite_or_none(v) for k, v in row.items()}}
                for idx, row in crowding_trend.iterrows()
            ],
            "quintile_summary": [
                {k: finite_or_none(v) for k, v in row.items()}
                for row in qret.groupby("q").agg(
                    avg_next_ret=("next_ret", "mean"),
                    avg_n=("n", "mean"),
                    median_pb=("pb", "mean"),
                    median_pe=("pe", "mean"),
                    median_mv=("mv", "mean"),
                    median_turn=("turn", "mean"),
                ).reset_index().to_dict(orient="records")
            ],
        }

    factor_cards.sort(key=lambda row: (row["score"] is not None, row["score"]), reverse=True)
    period_name = "下月" if frequency == "monthly" else "下周"
    monitor_name = "Monthly Monitor" if frequency == "monthly" else "Weekly Monitor"
    return {
        "generated_at": pd.Timestamp.now().isoformat(timespec="seconds"),
        "frequency": frequency,
        "monitor_name": monitor_name,
        "source_table": f"dbo.{source_table}",
        "industry_map_loaded": bool(has_industry_map),
        "industry_map_count": int(industry_map["stock_code"].nunique()) if has_industry_map else 0,
        "latest_panel_date": latest_panel.date().isoformat(),
        "latest_complete_signal_date": latest_complete.date().isoformat(),
        "recent_window": recent_window,
        "period_name": period_name,
        "factor_count": len(factor_cards),
        "notes": [
            "因子方向已按常见投资含义统一为高值偏多。",
            f"收益用 s_dq_close_today 计算{period_name}收益。",
            "当前是近期监控口径，尚未做行业中性、停牌涨跌停过滤和交易成本。",
            "市值中性 RankIC 为每期截面内对 log(市值) 线性残差化后计算的 RankIC。",
            "行业中性 RankIC 需要传入 stock_code,industry 两列的行业映射 CSV；当前数据库未发现股票行业映射表。",
            "优秀个股展示为最新面板日按统一方向排序的前 20 只股票，仅用于观察，不构成推荐。",
        ],
        "factors": factor_cards,
        "details": factor_details,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--frequency", choices=["monthly", "weekly"], default="monthly")
    parser.add_argument("--months-back", type=int, default=18)
    parser.add_argument("--industry-map", default=None, help="Optional CSV with stock_code,industry columns.")
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    source_table = "factor_monthly_ret" if args.frequency == "monthly" else "factor_weekly_ret"
    gap_range = (20, 45) if args.frequency == "monthly" else (5, 10)
    default_output = "outputs/factor_monitor_data.json" if args.frequency == "monthly" else "outputs/factor_monitor_weekly.json"

    factor_specs = FACTOR_SPECS
    df = fetch_panel(args.months_back, source_table, factor_specs)
    industry_map = load_industry_map(args.industry_map)
    data = build_monitor(df, factor_specs, args.frequency, source_table, gap_range, industry_map)
    output = Path(args.output or default_output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {output} with {data['factor_count']} factors")


if __name__ == "__main__":
    main()
