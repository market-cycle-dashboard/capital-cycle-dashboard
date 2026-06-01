# 资本周期 capital cycle

这是一个面向复用和推广的投研站点项目。当前最成熟的模块是资本周期，后续会逐步扩展到流动性、深度报告、数据中心和方法论。

线上地址：

https://capital-cycle-dashboard.pages.dev/

## 当前模块

- 资本周期：行业资本周期波浪图、行业研究雷达、PB-ROE 估值盈利地图、行业详情、个股财务轨迹、交集研究池。
- 深度报告：行业报告、公司报告、主题报告，含报告卡片、筛选交互和详情展开面板。
- 流动性：规划中。
- 因子监控：代表性因子近期有效性、拥挤度和因子值优秀个股观察面板。
- 数据中心：规划中。
- 方法论：规划中。

## 项目文档

- [投研站点蓝图](docs/site-blueprint.md)
- [研究模块模板](docs/module-template.md)
- [建设路线图](docs/roadmap.md)
- [设计与协作原则](docs/design-principles.md)
- [数据底座方案](docs/data-foundation.md)
- [数据源登记表](docs/data-source-registry.md)
- [因子监控面板说明](factor-monitor/docs/README.md)

## 协作方式

这个项目按“装修房子”的方式推进：先确认站点骨架，再逐个建设模块。每次开发前先明确本次改动属于站点层、模块层还是组件层，避免只围绕局部页面反复修补。

当前项目会在多个终端、由不同 agent 并行开发。开始改动前请先同步远端：

```bash
git fetch origin
git pull --ff-only origin main
```

协作约定：

- 远端 `main` 是发布源，Cloudflare Pages 会跟随 `main` 自动部署。
- 不要假设本地副本是最新版本，改动前先看最近提交和文件差异。
- 每次只做一个清晰范围的改动，避免跨模块大面积重写。
- 不要覆盖其他 agent 刚提交的内容；如果出现分叉，先读 diff 再合并。
- 原始 Excel 和大型底稿不进入公开仓库，公开仓库只放静态站点和可公开的数据文件。

本地预览可以直接打开 `index.html`，或在项目目录启动静态服务：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://127.0.0.1:8000/
```
