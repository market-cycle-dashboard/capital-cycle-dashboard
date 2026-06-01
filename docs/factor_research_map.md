# 因子库研究地图：有效性与拥挤度

## 1. 数据库里的因子口径

当前数据库不是只有 12 个因子。按 `institue_factor_type` 登记口径，共有 318 个因子：

| type | 数量 | 初步含义 | 代表 |
| --- | ---: | --- | --- |
| 0 | 250 | 基本面、估值、盈利、成长、预测、规模、财务质量，以及 12 个基本面 zoo 因子 | `s_fa_roe`, `s_val_pe_ttm`, `s_dq_mv`, `factorzoo_fm_all_m_8` |
| 1 | 9 | zoo 量价复合因子 | `factorzoo_pv_all_mtd_0` 到 `factorzoo_pv_all_mtd_8` |
| 2 | 59 | 技术指标/量价经典指标 | `rsi`, `macd`, `mom`, `natr`, `turnover`, `obv` 等 |

另有 12 张日频 `factor_zoo_*` 表，专门存 `factor_zoo_0` 到 `factor_zoo_11` 的长历史因子值。这 12 个是确定的基本面复合因子。

## 2. 可用表

| 表 | 覆盖 | 用途 |
| --- | --- | --- |
| `factor_zoo_0` 到 `factor_zoo_11` | 2014 至 2026，日频，千万行级/表 | 12 个基本面 zoo 因子的长历史研究 |
| `factor_zoo_fundmental_dict` | 12 条 | 12 个 zoo 基本面因子的公式 |
| `factor_data` | 2025-12-30 至 2026-05-29 | 12 个基本面 zoo + 9 个量价 zoo 的近期日频宽表 |
| `factor_monthly_ret` | 2025-01-31 至 2026-04-30 | 月频宽表，317 个数值因子列，适合近期有效性快速扫描 |
| `factor_weekly_ret` | 2025-10-05 至 2026-04-26 | 周频宽表，317 个数值因子列，适合短周期监控 |
| `talib_factor_data` | 2026-01-05 至 2026-04-23 | 技术指标 + 财务/估值宽表 |
| `IND_RET_STEPWISE` | 行业月收益 | 行业中性、行业轮动控制 |
| `LEVEL2_FACTOR_TABLE` | level2 高频/资金类因子长表 | 成交结构、资金行为类研究 |

## 3. 常用因子分组

### 规模与流动性

| 类别 | 因子 |
| --- | --- |
| 总市值 | `s_dq_mv`, `s_val_mv` |
| 股本/流通 | `tot_shr_today`, `float_a_shr_today`, `free_shares_today` |
| 换手 | `s_dq_turn`, `s_dq_freeturnover` |

适合做拥挤度，因为很多风格暴露会通过市值、流动性体现。

### 估值

| 类别 | 因子 |
| --- | --- |
| PE | `s_val_pe`, `s_val_pe_ttm`, `est_pe_FY1`, `est_pe_FTTM` |
| PB | `s_val_pb_new`, `est_pb_FY1`, `pb` |
| PS | `s_val_ps`, `s_val_ps_ttm` |
| PCF | `s_val_pcf_ocf`, `s_val_pcf_ocfttm`, `s_val_pcf_ncf`, `s_val_pcf_ncfttm` |
| 股息 | `s_price_div_dps`, `est_dps_FY1` |

建议统一转成“价值方向”：例如 `-PE`, `-PB`, `-PS`，或用盈利收益率、账面市值比。

### 盈利质量与盈利能力

| 类别 | 因子 |
| --- | --- |
| ROE/ROA/ROIC | `s_fa_roe`, `s_fa_roe_avg`, `s_fa_roe_yearly`, `s_fa_roa`, `s_fa_roic`, `waa_roe` |
| 毛利/净利率 | `s_fa_grossprofitmargin`, `s_fa_netprofitmargin`, `s_qfa_grossprofitmargin`, `s_qfa_netprofitmargin` |
| 扣非利润 | `s_fa_deductedprofit`, `s_fa_deductedprofittoprofit`, `s_qfa_deductedprofit` |
| 现金流质量 | `s_fa_ocftoor`, `s_fa_ocftoprofit`, `s_fa_salescashintoor`, `net_cash_flows_oper_act_ttm` |

### 成长

| 类别 | 因子 |
| --- | --- |
| 营收成长 | `s_fa_yoy_or`, `s_fa_yoy_tr`, `s_qfa_yoygr`, `est_oper_revenue_YOY`, `est_oper_revenue_CAGR` |
| 利润成长 | `s_fa_yoynetprofit`, `s_fa_yoynetprofit_deducted`, `s_qfa_yoynetprofit`, `est_eps_YOY`, `net_profit_YOY` |
| 分析师预期成长 | `est_eps_CAGR`, `est_roe_YOY`, `est_ebit_YOY`, `est_total_profit_YOY` |

### 杠杆与安全性

| 类别 | 因子 |
| --- | --- |
| 负债率 | `s_fa_debttoassets`, `s_fa_debttoequity`, `s_fa_assetstoequity` |
| 偿债能力 | `s_fa_current`, `s_fa_quick`, `s_fa_cashratio`, `s_fa_ebitdatodebt` |
| 权益/负债 | `s_fa_equitytodebt`, `s_fa_equitytointerestdebt` |

### 动量与反转

| 类别 | 因子 |
| --- | --- |
| 价格动量 | `mom`, `roc`, `rocp`, `rocr`, `rocr100` |
| 均线趋势 | `sma`, `ema`, `wma`, `dema`, `tema`, `kama`, `ht_trendline` |
| MACD | `macd`, `macdsignal`, `macdhist`, `ppo`, `apo` |
| 价格区间 | `s_pq_adjhigh_52w`, `s_pq_adjlow_52w`, `s_pq_high_52w_`, `s_pq_low_52w_` |

### 波动率与交易活跃度

| 类别 | 因子 |
| --- | --- |
| 波动率 | `natr`, `trange`, `upperband`, `middleband`, `lowerband` |
| 趋势强度 | `adx`, `adxr`, `dx`, `plus_di`, `minus_di`, `plus_dm`, `minus_dm` |
| 成交量价 | `obv`, `ad`, `adosc`, `mfi`, `bop` |

### zoo 因子

| 类别 | 因子 |
| --- | --- |
| 基本面 zoo | `factorzoo_fm_all_m_0` 到 `factorzoo_fm_all_m_11` |
| 量价 zoo | `factorzoo_pv_all_mtd_0` 到 `factorzoo_pv_all_mtd_8` |

其中量价 zoo 有明显重复/反向组：

| 组 | 因子 |
| --- | --- |
| 波动/活跃度 | `factorzoo_pv_all_mtd_0`, `factorzoo_pv_all_mtd_2`, `factorzoo_pv_all_mtd_7` |
| 价格水平 | `factorzoo_pv_all_mtd_1`, `factorzoo_pv_all_mtd_8` |
| 低波/规模稳定 | `factorzoo_pv_all_mtd_4`, `factorzoo_pv_all_mtd_5` |
| 混合活跃度 | `factorzoo_pv_all_mtd_3`, `factorzoo_pv_all_mtd_6` |

## 4. 近期有效性研究

建议先做月频和周频两套：

| 频率 | 表 | 目标 |
| --- | --- | --- |
| 月频 | `factor_monthly_ret` | 因子中期有效性、组合换手低、风格稳定 |
| 周频 | `factor_weekly_ret` | 因子近期状态、拥挤交易变化、短期失效预警 |

核心指标：

| 指标 | 含义 |
| --- | --- |
| IC 均值 | 因子值与未来收益的 Pearson 相关 |
| RankIC 均值 | 因子排名与未来收益排名的 Spearman 相关 |
| RankIC IR | RankIC 均值 / RankIC 标准差，衡量稳定性 |
| IC 正比例 | 最近 N 期 IC 为正的比例 |
| 多空收益 | 最高分组减最低分组收益 |
| 分组单调性 | Q1 到 Q5 收益是否递增/递减 |
| 最近滚动 RankIC | 近 3/6/12 期因子状态 |

## 5. 拥挤度研究

拥挤度不能只看 IC，建议从 4 个维度构建。

### 5.1 估值拥挤

某个因子多头组合相对空头组合是否变贵：

| 指标 | 例子 |
| --- | --- |
| 多头 PB / 空头 PB | Q5 的 `s_val_pb_new` 是否显著高于 Q1 |
| 多头 PE / 空头 PE | 成长/质量因子多头是否已经被买贵 |
| 多头市值 / 空头市值 | 是否集中到大票或小票 |

### 5.2 持仓相似/相关性拥挤

如果一个因子和市场热门风格高度相关，说明拥挤风险上升：

| 指标 | 说明 |
| --- | --- |
| 因子与市值 RankCorr | 是否变成大盘/小盘暴露 |
| 因子与动量 RankCorr | 是否拥挤到动量交易 |
| 因子与低波 RankCorr | 是否变成低波抱团 |
| 因子与换手 RankCorr | 是否交易太拥挤 |

### 5.3 交易拥挤

观察因子多头组合交易活跃度：

| 指标 | 说明 |
| --- | --- |
| Q5 平均换手率 | `s_dq_turn`, `s_dq_freeturnover` |
| Q5 相对 Q1 换手差 | 多头是否过热 |
| Q5 平均成交波动 | `natr`, `trange` |

### 5.4 表现反转/失效拥挤

拥挤因子常见现象是：长期有效，但近期多空收益突然反转。

| 指标 | 说明 |
| --- | --- |
| 最近 3 期 RankIC vs 历史 RankIC | 近期是否显著走弱 |
| 最近 3 期多空收益 | 是否转负 |
| 多空收益波动 | 是否变得不稳定 |
| 因子分组单调性 | 是否从单调变成乱序 |

## 6. 第一版研究清单

优先做这些常用因子：

| 风格 | 推荐代表因子 |
| --- | --- |
| 市值 | `s_dq_mv` |
| 价值 | `s_val_pb_new`, `s_val_pe_ttm`, `s_val_ps_ttm` |
| 盈利质量 | `s_fa_roe`, `s_fa_roa`, `s_fa_roic`, `s_fa_grossprofitmargin` |
| 成长 | `s_qfa_yoygr`, `s_fa_yoynetprofit`, `est_eps_YOY` |
| 杠杆/安全 | `s_fa_debttoassets`, `s_fa_current`, `s_fa_equitytodebt` |
| 动量 | `mom`, `roc`, `macd`, `rsi` |
| 波动 | `natr`, `trange` |
| 换手/流动性 | `s_dq_turn`, `s_dq_freeturnover` |
| zoo 基本面 | `factorzoo_fm_all_m_8`, `factorzoo_fm_all_m_10`, `factorzoo_fm_all_m_0` |
| zoo 量价 | `factorzoo_pv_all_mtd_0`, `factorzoo_pv_all_mtd_1`, `factorzoo_pv_all_mtd_4`, `factorzoo_pv_all_mtd_6` |

## 7. 需要注意

1. `factor_monthly_ret` 和 `factor_weekly_ret` 的历史较短，适合做“近期状态”，不适合单独证明长期有效。
2. 12 个 `factor_zoo_*` 日频表历史长，适合补长期验证，但只有这 12 个 zoo 基本面因子。
3. 做拥挤度时，要先统一因子方向，否则高低分组含义会乱。
4. 因子有效性应至少做市值中性和行业中性，否则很多结果可能只是大小盘或行业行情。
5. 数据库没有现成 IC/拥挤度结果，需要用宽表自行计算。

