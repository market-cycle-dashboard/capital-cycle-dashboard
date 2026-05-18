# 数据源登记表

这个文件记录项目计划使用的数据源。新增数据源前先登记，避免后续不知道数据来自哪里、能不能复算、是否能自动更新。

## 数据源总览

| 数据源 | 用途 | 自动化优先级 | 凭据 | 主要风险 |
| --- | --- | --- | --- | --- |
| AKShare | A股、港股、指数、宏观、利率等公开数据 | 高 | 无统一 token | 接口可能随上游网页变化 |
| Tushare Pro | A股行情、财务报表、财务指标、每日指标 | 高 | 需要 token 和积分权限 | 权限、频次、积分门槛 |
| BaoStock | A股历史行情、部分财务和宏观数据 | 中 | 通常无需 token | 覆盖面和维护活跃度需验证 |
| FRED | 美国宏观、利率、信用、流动性时间序列 | 高 | API key | 中国本土数据覆盖有限 |
| 腾讯公开行情 | A股前复权日 K 烟囱测试 | 中 | 无 | 非官方正式数据源，字段较少 |
| Yahoo Chart | 全球股票和指数行情样本 | 中 | 无 | 非官方正式数据源，适合烟囱测试和备份 |
| 手工 Excel/CSV | 难以自动抓取或需要人工判断的数据 | 中 | 无 | 需要版本管理和口径说明 |
| CME XEURBI | EUR/USD cross-currency basis，离岸美元融资压力 | 高 | OAuth entitlement | 官方 REST API 需要授权，不能网页抓取 |

## 已验证烟囱测试

| 日期 | 数据源 | 样本 | 状态 | 产物 |
| --- | --- | --- | --- | --- |
| 2026-05-13 | 腾讯公开行情接口 | 600519.SH、300750.SZ、000001.SZ 前复权日 K | 通过，978 行价格数据 | `data/clean/sample_prices.csv` |
| 2026-05-13 | FRED 公开 CSV | DGS10、BAMLH0A0HYM2 | 通过，711 行宏观数据；Python requests 超时，使用 curl fallback | `data/clean/sample_macro.csv` |
| 2026-05-13 | AKShare | `stock_financial_analysis_indicator`，600519.SH、300750.SZ、000001.SZ | 通过，27 行财务指标数据 | `data/clean/akshare_sample_financial_indicators.csv` |

## AKShare 当前接口探测

| 接口 | 状态 | 备注 |
| --- | --- | --- |
| `stock_financial_analysis_indicator` | 可用 | 适合作为财务指标第一版 provider |
| `stock_zh_a_hist` | 超时 | 当前网络下不稳定，行情先用腾讯烟囱源 |
| `stock_info_a_code_name` | 超时 | 后续再测或换 Tushare/手工映射 |
| `stock_zh_a_spot_em` | 失败/超时 | 当前环境不作为默认源 |
| `stock_balance_sheet_by_report_em` | 超时 | 三大报表后续优先考虑 Tushare |
| `stock_profit_sheet_by_report_em` | 超时 | 三大报表后续优先考虑 Tushare |
| `stock_cash_flow_sheet_by_report_em` | 超时 | 三大报表后续优先考虑 Tushare |

## 资本周期模块

| 数据项 | 首选来源 | 备选来源 | 更新频率 | 备注 |
| --- | --- | --- | --- | --- |
| 股票列表 | AKShare / Tushare | 手工表 | 月度 | 需要统一 A股、港股代码格式 |
| 行业分类 | AKShare / Tushare | 手工映射 | 月度 | 行业口径要固定，否则历史不可比 |
| 利润表 | Tushare | AKShare / 手工 | 季度 | 计算营业利润、净利润等 |
| 资产负债表 | Tushare | AKShare / 手工 | 季度 | 计算投入资本、负债率 |
| 现金流量表 | Tushare | AKShare / 手工 | 季度 | 计算现金流质量 |
| 财务指标 | Tushare / BaoStock | 自算 | 季度 | ROE、ROIC 最好保留自算口径 |
| PB/估值 | Tushare / AKShare | 手工 | 日频/周频 | 用于 PB-ROE 地图 |
| 历史行情 | AKShare / BaoStock | Tushare | 日频 | 后续可用于价格周期 |

## 流动性模块

| 数据项 | 首选来源 | 备选来源 | 更新频率 | 备注 |
| --- | --- | --- | --- | --- |
| 利率 | FRED / AKShare | 手工 | 日频/周频 | 中美分开处理 |
| 信用利差 | FRED / 手工 | AKShare | 日频/周频 | 先从美国信用利差入手 |
| 货币供应 | FRED / AKShare | 手工 | 月频 | M1/M2、社融等 |
| 成交额 | AKShare / Tushare | 手工 | 日频 | A股流动性核心指标 |
| 融资融券 | Tushare / AKShare | 手工 | 日频 | 需要权限验证 |
| 北向/南向资金 | AKShare / Tushare | 手工 | 日频 | 接口稳定性需测试 |
| Fed 资产负债表、TGA、RRP、准备金、SOFR、IORB、广义美元指数 | FRED 公开 CSV | 本地缓存 CSV | 日频任务，源数据按各自频率更新 | `scripts/build-liquidity-data.mjs` 默认联网刷新，失败后回退缓存 |
| EUR/USD cross-currency basis | CME XEURBI Cross Currency API | CME DataMine / 手工 | 日频 | 需配置 `CME_OAUTH_TOKEN`；无授权时页面显示“需授权”，不使用 DXY 冒充基差 |
| JPY/USD cross-currency basis | 待定 | Bloomberg JYBS3M / SDR 推导 | 日频 | 尚未找到稳定免授权公开日频源，保持显式缺口 |

## 深度报告模块

| 数据项 | 首选来源 | 备选来源 | 更新频率 | 备注 |
| --- | --- | --- | --- | --- |
| 报告标题 | 手工 | 后续 CMS | 事件驱动 | 先手工维护 |
| 报告摘要 | 手工 | 后续 CMS | 事件驱动 | 需要保留作者判断 |
| 标签 | 手工 | 半自动 | 事件驱动 | 行业、主题、公司 |
| 关联数据图 | 内部模块 | 无 | 事件驱动 | 报告应能链接到图表模块 |

## 数据源验证清单

每接入一个数据源，至少验证：

- 是否能稳定拉取 3 个样本股票或指标。
- 是否能拉取历史数据。
- 是否有更新频率说明。
- 是否有字段说明。
- 是否需要 token。
- 是否允许当前用途。
- 是否能保存原始返回结果。
- 是否能映射到内部标准字段。

## 参考链接

- AKShare 数据字典：https://akshare.akfamily.xyz/data/index.html
- Tushare 权限说明：https://tushare.pro/document/1?doc_id=108
- FRED API 文档：https://fred.stlouisfed.org/docs/api/fred/fred/
- CME EUR/USD Cross Currency Basis Index：https://www.cmegroup.com/market-data/cme-group-benchmark-administration/eur-usd-cross-currency-basis-index.html
- BaoStock PyPI：https://pypi.org/project/baostock/
