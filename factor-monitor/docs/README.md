# 因子监控面板说明

这个目录是投研网站的第 4 个一级板块“因子监控”。当前版本只使用已有静态数据文件，不连接数据库，也不接入行业映射。

## 文件结构

| 文件 | 说明 |
| --- | --- |
| `index.html` | 因子监控独立页面，可被主站 iframe 嵌入，也可直接访问 `/factor-monitor/` |
| `app.js` | 面板交互逻辑：月频/周频切换、分组筛选、排序、因子详情、优秀个股表 |
| `styles.css` | 面板样式 |
| `data/factor_monitor_data.json` | 月频监控数据 |
| `data/factor_monitor_weekly.json` | 周频监控数据 |

## 当前数据口径

- 因子范围：27 个代表性因子，覆盖规模流动性、估值、盈利质量、成长、杠杆安全、动量反转、波动交易，以及部分 Zoo 基本面/量价因子。
- 有效性指标：RankIC、市值中性 RankIC、RankIC IR、近期 RankIC、Q5-Q1 多空收益。
- 拥挤度指标：市值相关、换手相关、Q5-Q1 PB 差、Q5-Q1 换手差及趋势。
- 个股展示：每个因子最新面板日按统一方向排序的前 20 只股票，只用于观察样本特征，不构成推荐。
- 当前不展示行业：用户已明确“不要行业了，个股就行，用已有的数据”。

## 更新数据

数据由另一个本地研究目录生成：

```text
/Users/shuchengnie/Documents/多因子量化/scripts/build_factor_monitor.py
```

生成后把两份 JSON 覆盖到本目录：

```text
factor-monitor/data/factor_monitor_data.json
factor-monitor/data/factor_monitor_weekly.json
```

不要把数据库账号、密码或 `.env` 写入本站仓库。公开站点只保留静态 JSON 和页面文件。

## 主站接入

主站 `index.html` 通过 `#factor-monitor-module` 作为一级模块入口，并用 iframe 加载：

```html
<iframe src="factor-monitor/index.html"></iframe>
```

如果后续 agent 要改成交互更深的原生模块，建议先保持 `factor-monitor/` 独立页面可直接运行，再逐步拆出共享样式和数据加载逻辑。
