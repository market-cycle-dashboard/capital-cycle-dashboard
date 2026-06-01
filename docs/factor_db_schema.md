# SQL Server 因子库结构摘要

连接已验证成功，数据库为 SQL Server 2016。出于安全考虑，远端仓库不记录数据库地址、库名、账号或密码。

## 核心表

| 表名 | 行数 | 说明 |
| --- | ---: | --- |
| `dbo.WIND_DICT` | 555 | Wind 字段字典 |
| `dbo.factor_zoo_fundmental_dict` | 12 | 因子 ID 到因子表达式的映射 |
| `dbo.factor_zoo_0` 到 `dbo.factor_zoo_11` | 约 814 万到 1,146 万/表 | 因子日频截面值 |

注意：实际表名前缀是 `factor_zoo_`，不是 `facotr_zoo_`。

## 字段结构

`WIND_DICT`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `字段中文名` | `varchar(50)` | Wind 字段中文名 |
| `字段名` | `varchar(50)` | Wind 字段英文名 |
| `来源` | `varchar(50)` | Wind 来源表或来源域 |
| `释义` | `varchar(400)` | 字段释义 |

`factor_zoo_fundmental_dict`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `factor_id` | `varchar(50)` | 因子表 ID，例如 `factor_zoo_0` |
| `factor_name` | `varchar(500)` | 因子表达式 |

所有 `factor_zoo_*` 表字段一致：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `s_info_windcode` | `varchar(50)` | Wind 股票代码 |
| `ann_dt` | `datetime` | 日期 |
| `factor_value` | `float` | 因子值 |

## 覆盖范围

| 因子表 | 起始日期 | 最新日期 | 行数 | 股票数 | 空值数 |
| --- | --- | --- | ---: | ---: | ---: |
| `factor_zoo_0` | 2014-04-22 | 2026-05-29 | 11,075,492 | 5,175 | 0 |
| `factor_zoo_1` | 2014-01-21 | 2026-05-29 | 11,461,810 | 5,177 | 0 |
| `factor_zoo_2` | 2016-04-20 | 2026-05-29 | 8,140,957 | 4,725 | 0 |
| `factor_zoo_3` | 2014-09-17 | 2026-05-29 | 10,025,650 | 5,172 | 0 |
| `factor_zoo_4` | 2014-02-25 | 2026-05-29 | 10,793,704 | 5,222 | 0 |
| `factor_zoo_5` | 2014-01-29 | 2026-05-29 | 11,040,891 | 5,156 | 0 |
| `factor_zoo_6` | 2015-08-14 | 2026-05-29 | 8,372,252 | 5,107 | 0 |
| `factor_zoo_7` | 2014-01-21 | 2026-05-29 | 11,210,548 | 5,177 | 0 |
| `factor_zoo_8` | 2014-03-25 | 2026-05-29 | 11,244,326 | 5,176 | 0 |
| `factor_zoo_9` | 2014-08-04 | 2026-05-29 | 9,838,597 | 5,266 | 0 |
| `factor_zoo_10` | 2014-05-13 | 2026-05-29 | 10,209,631 | 5,172 | 0 |
| `factor_zoo_11` | 2014-10-27 | 2026-05-29 | 11,123,167 | 5,274 | 0 |

## 索引

每张 `factor_zoo_*` 表都有：

| 索引 | 类型 | 字段 |
| --- | --- | --- |
| `ann_dt_IDX` | nonclustered | `ann_dt` |
| `s_info_windcode_IDX` | nonclustered | `s_info_windcode` |
| `s_info_windcode_IDX_ann_dt_IDX` | unique nonclustered | `s_info_windcode`, `ann_dt` |

因此后续查询建议优先按 `ann_dt` 日期范围和/或 `s_info_windcode` 股票代码过滤，避免全表扫描。

## 快速使用

1. 安装依赖：

```bash
python3 -m pip install -r requirements.txt
```

2. 设置环境变量，密码不要提交进仓库：

```bash
cp .env.example .env
export FACTOR_DB_HOST='你的数据库地址'
export FACTOR_DB_PORT=1433
export FACTOR_DB_NAME='你的数据库名'
export FACTOR_DB_USER='你的账号'
export FACTOR_DB_PASSWORD='你的密码'
```

3. 跑一次抽样：

```bash
python3 scripts/explore_factor_db.py --factor factor_zoo_0 --start 2026-05-01 --end 2026-05-10 --codes 000001.SZ 600000.SH
```
