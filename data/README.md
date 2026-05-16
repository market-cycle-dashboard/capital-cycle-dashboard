# 数据目录

这个目录用于承载投研站点的数据流水线。

当前前端仍然使用仓库根目录的 `data.js`。后续会逐步把数据生产过程拆成：

```text
data/raw/       原始数据
data/clean/     标准化数据
data/model/     指标和模型结果
data/manual/    手工维护数据
```

注意：

- `raw` 数据尽量不改字段。
- `clean` 数据统一代码、日期、单位和行业口径。
- `model` 数据存放计算后的投研指标。
- `manual` 数据存放人工判断、标签、报告摘要等。
- 不要提交 API token 或任何私密凭据。

## 烟囱测试

当前仓库提供一个最小公开数据拉取脚本：

```bash
python3 scripts/fetch_sample_data.py --start 2025-01-01
```

它会拉取：

- 腾讯公开行情接口：3 个 A 股样本的前复权日 K 数据
- FRED 公开 CSV：10 年期美债收益率、高收益债利差

并产出：

```text
data/raw/api/                         原始 API 返回
data/clean/sample_prices.csv          标准化价格样本
data/clean/sample_macro.csv           标准化宏观样本
data/model/sample_market_snapshot.json 轻量模型结果
```

这个脚本只用于验证数据链路，不代表最终数据源组合。

备注：当前 macOS 系统 Python 的 requests/urllib3 访问 FRED 会超时，脚本对 FRED 使用 `curl` fallback。

如需测试东方财富公开接口，可以运行：

```bash
python3 scripts/fetch_sample_data.py --start 2025-01-01 --stock-provider eastmoney
```

如需测试 Yahoo Chart 公开接口，可以运行：

```bash
python3 scripts/fetch_sample_data.py --start 2025-01-01 --stock-provider yahoo
```

## AKShare 财务指标测试

安装依赖：

```bash
python3 -m pip install -r requirements.txt
```

运行：

```bash
python3 scripts/fetch_akshare_sample.py --start-year 2024
```

它会拉取 3 个 A 股样本的 AKShare 财务分析指标，并产出：

```text
data/raw/api/akshare_financial_indicator_*.json
data/clean/akshare_sample_financial_indicators.csv
data/model/akshare_sample_financial_snapshot.json
```

当前验证结论：AKShare 财务指标接口可用；部分行情和三大报表接口在当前网络下会超时，暂不作为默认 provider。
