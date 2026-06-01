#!/usr/bin/env python3
"""Explore the SQL Server factor database without storing credentials."""

from __future__ import annotations

import argparse
import os
import time
import warnings
from datetime import date
from typing import Any

import pandas as pd
import pymssql

warnings.filterwarnings("ignore", message="pandas only supports SQLAlchemy connectable")


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
                timeout=120,
                charset="utf8",
            )
        except pymssql.OperationalError as exc:
            last_error = exc
            if attempt == 2:
                break
            time.sleep(2)
    raise RuntimeError("Could not connect to factor database after 3 attempts") from last_error


def read_sql(conn: pymssql.Connection, sql: str, params: tuple[Any, ...] = ()) -> pd.DataFrame:
    return pd.read_sql(sql, conn, params=params)


def list_tables(conn: pymssql.Connection) -> pd.DataFrame:
    return read_sql(
        conn,
        """
        select s.name as schema_name, t.name as table_name, sum(p.rows) as row_count
        from sys.tables t
        join sys.schemas s on t.schema_id = s.schema_id
        left join sys.partitions p on t.object_id = p.object_id and p.index_id in (0, 1)
        where t.name in ('WIND_DICT', 'factor_zoo_fundmental_dict')
           or t.name like 'factor_zoo_%'
        group by s.name, t.name
        order by
            case
                when t.name = 'WIND_DICT' then -2
                when t.name = 'factor_zoo_fundmental_dict' then -1
                when t.name like 'factor_zoo_[0-9]%' then try_convert(int, replace(t.name, 'factor_zoo_', ''))
                else 999
            end
        """,
    )


def list_columns(conn: pymssql.Connection, table: str, schema: str = "dbo") -> pd.DataFrame:
    return read_sql(
        conn,
        """
        select c.column_id, c.name as column_name, ty.name as data_type,
               c.max_length, c.precision, c.scale, c.is_nullable
        from sys.columns c
        join sys.types ty on c.user_type_id = ty.user_type_id
        join sys.tables t on c.object_id = t.object_id
        join sys.schemas s on t.schema_id = s.schema_id
        where s.name = %s and t.name = %s
        order by c.column_id
        """,
        (schema, table),
    )


def get_factor_dict(conn: pymssql.Connection) -> pd.DataFrame:
    return read_sql(
        conn,
        """
        select factor_id, factor_name
        from dbo.factor_zoo_fundmental_dict
        order by try_convert(int, replace(factor_id, 'factor_zoo_', ''))
        """,
    )


def get_factor_values(
    conn: pymssql.Connection,
    factor_id: str,
    start: str | date,
    end: str | date,
    codes: list[str] | None = None,
) -> pd.DataFrame:
    if not factor_id.startswith("factor_zoo_"):
        raise ValueError("factor_id must look like factor_zoo_0")

    params: list[Any] = [start, end]
    code_filter = ""
    if codes:
        placeholders = ",".join(["%s"] * len(codes))
        code_filter = f"and s_info_windcode in ({placeholders})"
        params.extend(codes)

    sql = f"""
        select s_info_windcode, ann_dt, factor_value
        from dbo.[{factor_id}]
        where ann_dt >= %s and ann_dt <= %s
          {code_filter}
        order by ann_dt, s_info_windcode
    """
    return read_sql(conn, sql, tuple(params))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--factor", default="factor_zoo_0")
    parser.add_argument("--start", default="2026-05-01")
    parser.add_argument("--end", default="2026-05-10")
    parser.add_argument("--codes", nargs="*", default=["600262.SH"])
    args = parser.parse_args()

    with connect() as conn:
        print("Tables:")
        print(list_tables(conn).to_string(index=False))
        print("\nFactor dictionary:")
        print(get_factor_dict(conn).to_string(index=False))
        print(f"\nColumns for {args.factor}:")
        print(list_columns(conn, args.factor).to_string(index=False))
        print(f"\nSample values for {args.factor}:")
        print(get_factor_values(conn, args.factor, args.start, args.end, args.codes).head(20).to_string(index=False))


if __name__ == "__main__":
    main()
