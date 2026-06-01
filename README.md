# 多因子量化研究工作区

这个仓库保存因子数据库探索、代表性因子监控数据生成脚本、静态观察面板和研究说明。

## 当前内容

- `scripts/explore_factor_db.py`：探索 SQL Server 因子库结构和样例数据。
- `scripts/build_factor_monitor.py`：生成代表性因子的月频/周频监控 JSON。
- `dashboard/`：本地静态面板，可直接查看因子有效性、拥挤度和因子值优秀个股。
- `outputs/`：已生成的监控 JSON 和单因子分析 CSV。
- `docs/`：数据库结构、研究地图和面板口径说明。

## 安全约定

- 不提交 `.env`。
- 不提交数据库账号、密码。
- 不在公开文档中记录真实数据库地址、端口或库名。
- 公开仓库只保留代码、说明和可公开的衍生数据。

## 本地使用

```bash
python3 -m pip install -r requirements.txt
cp .env.example .env
```

填好 `.env` 后生成数据：

```bash
python3 scripts/build_factor_monitor.py --frequency monthly --months-back 18
python3 scripts/build_factor_monitor.py --frequency weekly --months-back 12
```

查看面板：

```bash
python3 -m http.server 8765
```

然后打开：

```text
http://127.0.0.1:8765/dashboard/
```
