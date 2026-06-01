# 因子监控面板

第一版面板采用静态页面 + JSON 数据文件，支持月频和周频两种监控口径：

| 文件 | 说明 |
| --- | --- |
| `scripts/build_factor_monitor.py` | 从 SQL Server 拉取月频/周频宽表，计算监控指标 |
| `outputs/factor_monitor_data.json` | 月频面板数据文件 |
| `outputs/factor_monitor_weekly.json` | 周频面板数据文件 |
| `dashboard/index.html` | 静态监控面板 |
| `dashboard/app.js` | 表格、筛选、图表交互 |
| `dashboard/styles.css` | 面板样式 |

## 数据口径

当前第一版使用两张宽表：

- 因子数：27 个常用/代表因子
- 月频：`dbo.factor_monthly_ret`，用 `s_dq_close_today` 计算下月收益
- 周频：`dbo.factor_weekly_ret`，用 `s_dq_close_today` 计算下周收益
- 因子方向：按常见投资含义统一成“高值偏多”
- 当前未做：停牌涨跌停过滤、交易成本；行业中性需要外部行业映射 CSV 才会启用

## 指标

| 指标 | 含义 |
| --- | --- |
| RankIC | 因子排序与下月收益排序的相关性 |
| 市值中性 RankIC | 每期截面对 `log(市值)` 线性残差化后再计算 RankIC |
| 行业中性 RankIC | 传入股票行业映射后，按每期行业内去均值再计算 RankIC |
| RankIC IR | RankIC 均值 / RankIC 标准差 |
| 近期 RankIC | 月频取最近 3 期，周频取最近 6 期 |
| 多空月均 | Q5 下月收益 - Q1 下月收益 |
| 拥挤分 | 基于市值相关、换手差、PB 差的简化拥挤风险计分 |
| 拥挤度趋势 | 每期 Q5-Q1 的 PB 差、换手差、log 市值比 |
| 因子值优秀个股 | 最新面板日按统一方向排序的前 20 只股票，仅用于观察样本特征 |
| 高分行业分布 | 接入行业映射后统计前 20 只股票的行业分布；未接入时显示未启用 |

## 更新数据

密码不要写入文件，使用环境变量：

```bash
FACTOR_DB_HOST='你的数据库地址' \
FACTOR_DB_PORT='1433' \
FACTOR_DB_NAME='你的数据库名' \
FACTOR_DB_USER='你的账号' \
FACTOR_DB_PASSWORD='你的密码' \
python3 scripts/build_factor_monitor.py --frequency monthly --months-back 18
```

```bash
FACTOR_DB_HOST='你的数据库地址' \
FACTOR_DB_PORT='1433' \
FACTOR_DB_NAME='你的数据库名' \
FACTOR_DB_USER='你的账号' \
FACTOR_DB_PASSWORD='你的密码' \
python3 scripts/build_factor_monitor.py --frequency weekly --months-back 12
```

如需启用行业中性 RankIC，准备一个 CSV 文件，包含两列：

```text
stock_code,industry
000001.SZ,银行
600000.SH,银行
```

然后加参数：

```bash
python3 scripts/build_factor_monitor.py --frequency monthly --months-back 18 --industry-map path/to/industry_map.csv
```

目前数据库内只发现行业收益表 `IND_RET_STEPWISE`，未发现可直接用于 A 股股票的行业归属映射表，因此默认面板会显示“行业中性：未启用”。

## 打开面板

```bash
python3 -m http.server 8765
```

然后打开：

```text
http://127.0.0.1:8765/dashboard/
```

## 下一步

1. 接入可靠的 A 股股票行业映射，正式启用行业中性 IC 和高分组合行业分布。
2. 加入停牌、涨跌停、ST、上市天数等可交易性过滤。
3. 增加因子拥挤度的历史分位数，而不只看 Q5-Q1 当期差值。
4. 对代表性 zoo 基本面因子补长历史日频/月频回测。
