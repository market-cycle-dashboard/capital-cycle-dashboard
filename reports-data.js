/**
 * 深度报告数据文件
 * 数据层级：手工维护 → 前端发布
 * 后续可替换为从 data/manual/ 目录读取
 */
window.REPORTS_DATA = {
  updatedAt: "2026-05-17",
  reports: [
    {
      id: "report-century-ge",
      type: "century",
      title: "GE 百年专题：从发明家企业到工业组合的生命脉络",
      subtitle: "用长期历史理解一家公司的业务扩张、管理更替、资本配置与回报周期",
      author: "NSC Research",
      date: "2026-05-15",
      tags: ["GE", "百年专题", "公司史", "资本配置"],
      company: "General Electric",
      industry: "综合工业",
      market: "US",
      status: "published",
      confidence: "中",
      conclusion: "GE 的百年史不是单一产品公司的成长史，而是一部工业技术、金融扩张、管理文化和资本配置反复切换的历史。研究这类公司，关键不是只看某一年的利润，而是识别每个阶段的主导业务、管理层目标和资本回报来源。",
      keyEvidence: [
        "早期依靠电气化和工程能力建立工业平台，随后不断进入新产业。",
        "管理层更替往往对应资本配置范式变化，从工程导向到组合管理，再到去金融化和业务收缩。",
        "长期复盘能帮助识别公司从成长、扩张、复杂化到重新聚焦的完整生命周期。"
      ],
      timeline: [
        { period: "1878-1892", title: "成立前夜", summary: "爱迪生体系和 Thomson-Houston 等电气公司奠定技术与商业化基础，电气化成为新产业浪潮。" },
        { period: "1892-1922", title: "工业平台形成", summary: "合并后的 GE 围绕电力设备、照明和工程能力建立平台型工业公司形态。" },
        { period: "1922-1950", title: "接班与战争周期", summary: "公司在管理制度、生产能力和大型工业需求中扩张，战争和基础设施需求强化制造能力。" },
        { period: "1950-1981", title: "多元化与去中心化", summary: "业务边界扩张，管理体系复杂化，GE 从单一工业公司逐渐变成大型综合集团。" },
        { period: "1981-2000", title: "Jack Welch 时代", summary: "强调效率、排名、资本回报和组合管理，金融业务与工业业务共同推高集团估值。" },
        { period: "2000-2017", title: "后 Welch 调整", summary: "金融化和复杂集团折价暴露，资产出售、去金融化和重新聚焦成为主线。" }
      ],
      sections: [
        {
          title: "如何读百年公司",
          content: "百年专题的目标不是写传记，而是拆解公司在不同历史阶段的主导矛盾：靠什么业务赚钱、资本投向哪里、管理层如何定义增长、回报率为何上升或下降。这样的框架能把公司史和资本周期连接起来。"
        },
        {
          title: "投资研究含义",
          content: "公司生命线能帮助投资者避免只看短期财务表。对 GE 这类公司，单一指标常常会被业务组合变化掩盖，必须把产业周期、管理层战略和资本配置放在同一张时间线上看。"
        }
      ],
      linkedModules: ["capital-cycle"],
      linkedIndustryId: null
    },
    {
      id: "report-card-fedex",
      type: "company-card",
      title: "FedEx 公司卡片：快递网络、业务结构与成长变化",
      subtitle: "用一张卡片快速理解公司做什么、靠什么增长、和谁竞争",
      author: "NSC Research",
      date: "2026-05-15",
      tags: ["FedEx", "公司卡片", "物流", "业务结构"],
      company: "FedEx",
      industry: "综合物流",
      market: "US",
      status: "published",
      confidence: "中",
      conclusion: "FedEx 的核心资产是全球航空快递网络和地面配送网络。公司成长史体现为网络密度、服务半径和并购整合的叠加，研究重点应放在包裹量、单票收入、网络成本和竞争格局变化。",
      quickStats: [
        { label: "核心业务", value: "Express / Ground / Freight" },
        { label: "竞争对手", value: "UPS / DHL" },
        { label: "成长方式", value: "网络扩张 + 并购整合" },
        { label: "关键变量", value: "包裹量、单价、成本率" }
      ],
      businessMix: [
        { name: "FedEx Express", share: 45 },
        { name: "FedEx Ground", share: 30 },
        { name: "TNT Express", share: 12 },
        { name: "FedEx Freight", share: 11 },
        { name: "Services", share: 3 }
      ],
      keyEvidence: [
        "业务由航空快递、地面配送、货运和服务平台构成，网络协同是核心壁垒。",
        "1998 年后多次并购补齐地面货运、办公服务和国际网络能力。",
        "财务分析要同时看收入增速、运营利润率、资本开支和周转效率。"
      ],
      timeline: [
        { period: "1970s-1980s", title: "航空快递网络起步", summary: "以隔夜快递和航空枢纽网络建立差异化，核心是速度和可靠性。" },
        { period: "1998", title: "地面货运能力补齐", summary: "通过收购强化地面运输和区域配送能力，网络从空运向综合物流延伸。" },
        { period: "2000", title: "面向 C 端配送", summary: "拓展 Home Delivery 等服务，适应电商和居民配送需求。" },
        { period: "2004", title: "办公服务并购", summary: "收购 Kinko's，尝试把物流触点和办公服务网络结合。" },
        { period: "2016", title: "国际网络扩张", summary: "收购 TNT Express 强化欧洲和跨境网络，但也带来整合成本。" }
      ],
      sections: [
        {
          title: "公司卡片怎么用",
          content: "公司卡片用于快速建立研究对象的第一印象：管理层、业务构成、竞争对手、成长路径和核心财务变量。它不是完整深度报告，而是进入研究前的速览页。"
        },
        {
          title: "后续可补充字段",
          content: "真实版本可以继续补充年度财务表、分部利润率、区域收入、并购价格、资本开支、员工数、包裹量和单票收入等字段。"
        }
      ],
      linkedModules: [],
      linkedIndustryId: null
    },
    {
      id: "report-001",
      type: "industry",
      title: "锂电行业资本周期深度：供给出清拐点何时到来？",
      subtitle: "从资本开支退潮到产能利用率回升的时间窗口",
      author: "NSC Research",
      date: "2026-05-10",
      tags: ["锂电", "资本周期", "供给出清", "新能源"],
      industry: "锂电池",
      market: "A股",
      status: "published",
      confidence: "中高",
      conclusion: "锂电行业正处于资本开支退潮后段，头部企业资本纪律显著改善，产能利用率已从底部回升。预计 2026 下半年将看到行业整体 ROIC 的趋势性修复。",
      keyEvidence: [
        "头部企业 2025 年资本开支同比下降 35%，连续两年收缩",
        "行业产能利用率从 2024 年低点 45% 回升至 2025 年的 58%",
        "二线企业加速退出，CR5 市占率从 62% 提升至 72%"
      ],
      sections: [
        {
          title: "核心矛盾",
          content: "锂电行业的核心矛盾已经从「需求能否维持高增速」转向「供给出清的速度和深度」。2021-2023 年的产能军备竞赛导致行业严重过剩，但 2024 年以来，资本纪律开始重建。\n\n当前需要判断的是：出清进度是否已经足够让行业进入回报修复阶段？从资本开支、产能利用率和竞争格局三个维度来看，答案正在变得清晰。"
        },
        {
          title: "供给侧分析",
          content: "资本开支趋势：行业整体 Capex/折旧摊销比从 2022 年的 3.2x 下降至 2025 年的 1.4x，已进入「维持性投入」区间。头部企业的资本纪律更加明确——宁德时代 2025 年资本开支仅为 2022 年高峰的 48%。\n\n产能利用率：行业平均产能利用率从 2024Q2 的 45% 回升至 2025Q4 的 58%，但仍低于 75% 的健康水平。不过，边际改善的方向已经确立。\n\n竞争格局：二三线企业持续退出或被收购。2025 年行业新增产能公告同比下降 70%，新进入者几乎为零。"
        },
        {
          title: "需求侧验证",
          content: "全球电动车渗透率持续提升，2025 年全球 EV 销量同比增长 22%。储能需求成为第二增长极，2025 年全球储能装机同比增长 45%。\n\n关键假设：即使需求增速从 30%+ 放缓至 15-20%，在供给收缩的背景下，行业供需平衡仍在改善。"
        },
        {
          title: "投资含义",
          content: "对于资本周期投资者，锂电行业正处于从「收缩出清」向「回报修复」过渡的阶段。当前应重点关注：\n\n1. 资本开支已经收缩到位的头部企业\n2. 现金流质量持续改善的标的\n3. 产能利用率恢复领先的细分环节\n\n风险提示：如果需求增速进一步放缓至 10% 以下，或者头部企业重启扩产竞赛，回报修复可能延迟。"
        }
      ],
      linkedModules: ["capital-cycle"],
      linkedIndustryId: null
    },
    {
      id: "report-002",
      type: "industry",
      title: "半导体设备：国产替代驱动下的非典型资本周期",
      subtitle: "政策驱动的资本开支如何影响行业回报率",
      author: "NSC Research",
      date: "2026-04-28",
      tags: ["半导体", "设备", "国产替代", "资本周期"],
      industry: "半导体设备",
      market: "A股",
      status: "published",
      confidence: "中",
      conclusion: "半导体设备行业受国产替代政策驱动，资本开支周期与传统资本周期逻辑有显著差异。当前处于政策驱动的高投入阶段，短期回报率承压，但中长期份额提升逻辑清晰。",
      keyEvidence: [
        "国内半导体设备企业 2025 年资本开支同比增长 28%，逆周期扩张",
        "国产替代率从 2022 年的 15% 提升至 2025 年的 32%",
        "行业平均 ROIC 从 2023 年的 14% 下降至 2025 年的 9%，但收入增速维持 35%+"
      ],
      sections: [
        {
          title: "核心矛盾",
          content: "半导体设备行业的核心矛盾在于：政策驱动的资本开支扩张是否会导致传统资本周期理论中的「回报摊薄」？\n\n与锂电行业不同，半导体设备的供给扩张主要由国产替代逻辑驱动，而非单纯的利润吸引。这意味着即使短期 ROIC 下降，如果市场份额持续提升、技术壁垒逐步建立，长期回报率仍有修复空间。"
        },
        {
          title: "资本开支分析",
          content: "行业整体 Capex/折旧比维持在 2.8x 的高位，远高于 1.5x 的维持性投入水平。但细分来看：\n\n- 光刻、刻蚀等核心环节：3.5x+，正在建设新生产线\n- 清洗、检测等成熟环节：1.8x，已接近稳态\n\n需要区分「产能扩张型投资」和「能力建设型投资」——后者更多是研发和工艺平台的搭建，不会导致传统意义上的产能过剩。"
        },
        {
          title: "竞争格局与护城河",
          content: "国产设备企业的竞争优势正在从「价格」转向「服务响应+定制化」。头部企业与下游晶圆厂的绑定日益加深，客户切换成本显著提升。\n\n关键跟踪指标：\n1. 重复订单率（目前头部企业 > 60%）\n2. 高端产品收入占比\n3. 海外收入占比（验证全球竞争力）"
        },
        {
          title: "投资含义",
          content: "对于这类政策驱动型行业，传统资本周期框架需要做修正：\n\n1. 不能简单用 Capex/折旧判断行业是否过热\n2. 要区分份额驱动的增长和价格驱动的增长\n3. 关注研发投入的质量，而非仅看资本开支的数量\n\n当前定位：高投入但基本面改善（研究雷达右上象限），适合跟踪但需要验证护城河深度。"
        }
      ],
      linkedModules: ["capital-cycle"],
      linkedIndustryId: null
    },
    {
      id: "report-003",
      type: "company",
      title: "宁德时代：从资本扩张期到现金回报期的转折",
      subtitle: "行业龙头如何在产能过剩中建立护城河",
      author: "NSC Research",
      date: "2026-05-05",
      tags: ["宁德时代", "锂电", "现金牛", "龙头"],
      industry: "锂电池",
      market: "A股",
      status: "published",
      confidence: "高",
      conclusion: "宁德时代已完成从高速扩张到资本回报的战略转型。资本开支大幅收缩、自由现金流转正、分红比例提升，正在成为锂电行业的「现金牛」。估值切换逻辑正在发生。",
      keyEvidence: [
        "2025 年资本开支同比下降 42%，自由现金流达 380 亿元（历史首次超过净利润的 50%）",
        "全球市占率稳定在 37%，单 GWh 盈利能力行业领先",
        "2025 年分红比例从 10% 提升至 30%，开启股东回报新周期"
      ],
      sections: [
        {
          title: "核心矛盾",
          content: "市场对宁德时代的核心分歧在于：这家公司是「成长股见顶」还是「现金牛诞生」？\n\n从资本周期视角看，宁德时代正在经历一个经典的转变——从 PE 驱动的成长估值切换为 FCF Yield 驱动的价值估值。2021-2023 年的高资本开支已经转化为产能优势和成本优势，现在进入收割期。"
        },
        {
          title: "资本纪律的建立",
          content: "资本开支变化：\n- 2022 年：资本开支 680 亿元，Capex/折旧 = 4.2x\n- 2023 年：资本开支 520 亿元，Capex/折旧 = 3.1x\n- 2024 年：资本开支 380 亿元，Capex/折旧 = 2.0x\n- 2025 年：资本开支 220 亿元，Capex/折旧 = 1.2x\n\n从 4.2x 到 1.2x 的变化，是教科书式的资本周期从「扩张」到「维持」的转变。公司明确表示未来资本开支将维持在折旧水平附近。"
        },
        {
          title: "现金流与股东回报",
          content: "自由现金流（FCF）的变化更加显著：\n- 2022 年：-180 亿元（大规模扩产期）\n- 2023 年：+50 亿元（扩产放缓）\n- 2024 年：+250 亿元（资本纪律建立）\n- 2025 年：+380 亿元（进入收割期）\n\n公司 2025 年宣布将分红比例提升至 30%，并启动首次股票回购计划。这标志着管理层对未来现金流的信心，也是估值体系切换的催化剂。"
        },
        {
          title: "估值与风险",
          content: "当前估值：按 2026E 净利润 18x PE，按自由现金流 4.8% FCF Yield。\n\n如果市场认可「现金牛」逻辑，FCF Yield 有望从 4.8% 压缩至 3.5-4%，对应 25-30% 的估值上行空间。\n\n核心风险：\n1. 技术路线变化（固态电池加速商业化）\n2. 海外地缘政治风险\n3. 行业价格战重启导致盈利下滑"
        }
      ],
      linkedModules: ["capital-cycle"],
      linkedIndustryId: null
    },
    {
      id: "report-004",
      type: "company",
      title: "海螺水泥：传统行业现金牛的长期价值",
      subtitle: "供给侧改革后的水泥行业回报率分析",
      author: "NSC Research",
      date: "2026-04-15",
      tags: ["海螺水泥", "水泥", "现金牛", "传统行业"],
      industry: "水泥",
      market: "A股",
      status: "published",
      confidence: "中高",
      conclusion: "海螺水泥是中国传统行业资本周期「右侧标的」的典型代表。行业供给持续收缩、公司资本开支维持低位、自由现金流稳定，但需求端的下行压力限制了回报弹性。",
      keyEvidence: [
        "公司 Capex/折旧已连续 4 年低于 1.0x，处于净收缩状态",
        "自由现金流稳定在 200-250 亿元区间，FCF Yield 约 6.5%",
        "水泥行业新增产能连续 5 年为零，但需求同比下降 8%"
      ],
      sections: [
        {
          title: "核心矛盾",
          content: "海螺水泥的核心矛盾不在供给侧，而在需求侧。供给侧的故事已经很清晰——行业产能持续退出、CR10 提升、价格纪律改善。但房地产投资的持续下行让需求端承压，限制了量的恢复。\n\n关键问题：在需求不增长的前提下，海螺水泥的成本优势和现金流能力能否支撑其作为长期持有标的？"
        },
        {
          title: "资本周期位置",
          content: "水泥行业是 A 股最典型的「成熟现金牛」行业之一：\n\n- 新增产能：连续 5 年为零\n- 行业 Capex/折旧：0.6x（远低于维持水平）\n- 产能利用率：62%（低位但稳定）\n- 行业集中度：CR10 从 45% 提升至 58%\n\n海螺水泥作为行业龙头，资本纪律最为突出：公司将资本开支控制在折旧的 70-80%，意味着在主动缩减产能基础。"
        },
        {
          title: "财务质量",
          content: "核心财务指标（2025 年）：\n- ROIC：12.8%（行业中位数 6.5%）\n- ROE：14.2%\n- 资产负债率：18%\n- 自由现金流：228 亿元\n- 在手现金：680 亿元\n\n海螺的财务质量在传统行业中属于顶级——低负债、高现金、稳定回报。即使需求继续下滑 5-10%，公司的盈利和现金流仍有韧性。"
        },
        {
          title: "投资含义",
          content: "海螺水泥适合作为「现金流锚」在组合中配置：\n\n优势：\n- FCF Yield 6.5%，显著高于无风险利率\n- 资本纪律稳定，不会轻易重启扩产\n- 分红比例持续提升\n\n风险：\n- 房地产投资持续下行，需求难以恢复\n- 碳中和政策可能带来额外成本\n- 缺乏成长弹性\n\n估值：当前 8x PE、0.9x PB，处于历史低位。如果市场给予更高的现金流估值，有 20-30% 的估值修复空间。"
        }
      ],
      linkedModules: ["capital-cycle"],
      linkedIndustryId: null
    },
    {
      id: "report-005",
      type: "theme",
      title: "AI 产业链资本周期全景：从算力军备到应用变现",
      subtitle: "不同环节的资本周期位置差异巨大",
      author: "NSC Research",
      date: "2026-05-08",
      tags: ["AI", "算力", "应用", "资本周期", "产业链"],
      industry: null,
      market: null,
      status: "published",
      confidence: "中",
      conclusion: "AI 产业链各环节处于完全不同的资本周期阶段：算力基础设施处于「资本投入竞争」高峰期，算力芯片处于「过度扩张」早期，而 AI 应用层仍处于「回报验证」阶段。投资者需要按环节而非整条产业链来定位。",
      keyEvidence: [
        "全球算力基础设施 2025 年 Capex 超 3000 亿美元，同比增长 55%",
        "AI 芯片企业平均 Capex/折旧达 4.8x，处于极度扩张区间",
        "AI 应用层企业多数尚未盈利，无法用传统资本周期框架评估"
      ],
      sections: [
        {
          title: "核心矛盾",
          content: "AI 产业链的核心矛盾在于：当前的巨额资本投入是否能够产生足够的终端回报？\n\n从资本周期视角看，这是一个典型的「高回报吸引资本」→「资本投入竞争」的早期阶段。历史经验表明，科技行业的资本周期往往比传统行业更极端——boom 更大，bust 也更剧烈。\n\n关键问题不是 AI 有没有价值，而是当前的投资强度是否已经透支了未来 3-5 年的回报。"
        },
        {
          title: "算力基础设施：资本投入高峰",
          content: "全球云厂商（AWS、Azure、Google Cloud 等）的算力投资已经进入「军备竞赛」模式：\n\n- 2024 年全球算力 Capex：约 2000 亿美元\n- 2025 年全球算力 Capex：约 3100 亿美元（+55%）\n- Capex/折旧比：3.2x（显著高于历史中枢 1.8x）\n\n这是资本周期理论中最典型的「过度投入」信号。但短期内，由于需求增速仍然很高（AI 训练和推理算力需求），产能利用率并未下降。\n\n关键跟踪指标：云厂商的 Capex 增速何时开始放缓？目前看最早在 2027 年。"
        },
        {
          title: "AI 芯片：扩张但有壁垒",
          content: "AI 芯片（GPU、ASIC 等）企业的资本周期位置：\n\n- NVIDIA：Capex/折旧 4.8x，ROIC 仍在 60%+ 的惊人水平\n- AMD、Intel AI 部门：Capex/折旧 2.5-3.0x，但 ROIC 显著低于 NVIDIA\n\nNVIDIA 的情况特殊——极高的 ROIC 意味着当前的高资本投入仍然在创造价值。但如果竞争加剧（AMD、自研芯片、ASIC），回报率可能快速下降。\n\n国产 AI 芯片：政策驱动的非典型资本周期，类似半导体设备的逻辑。"
        },
        {
          title: "AI 应用：前资本周期阶段",
          content: "大部分 AI 应用企业仍处于「前资本周期」阶段——收入尚未形成、商业模式未验证、无法用传统的 ROIC 和 Capex 框架分析。\n\n当前应关注的指标：\n1. 收入增速和客户留存率\n2. 单位经济模型（Unit Economics）\n3. 现金消耗速度（Cash Burn Rate）\n4. 从 API 模式到自有产品的转型进度\n\n对于这类早期企业，不应使用资本周期框架，而应使用风险投资的评估逻辑。"
        },
        {
          title: "投资含义",
          content: "不同环节的策略完全不同：\n\n- 算力基础设施：高度警惕，资本周期风险最高\n- AI 芯片：分化严重，只有具备真正壁垒的龙头值得关注\n- AI 应用：择优跟踪，等待商业模式验证\n\n整体建议：当前应回避「纯 AI 概念」的高估值标的，聚焦于「有真实收入和现金流」的环节。AI 产业链的资本周期调整（如果发生）可能在 2027-2028 年。"
        }
      ],
      linkedModules: ["capital-cycle"],
      linkedIndustryId: null
    },
    {
      id: "report-006",
      type: "theme",
      title: "出海企业的估值重估逻辑",
      subtitle: "从出口导向到全球化运营的价值跃迁",
      author: "NSC Research",
      date: "2026-04-20",
      tags: ["出海", "全球化", "估值重估", "制造业"],
      industry: null,
      market: "A股",
      status: "published",
      confidence: "中高",
      conclusion: "中国出海企业正在从「低成本出口」升级为「全球化运营」，这带来了两重估值重估：一是收入结构改善（海外高毛利占比提升），二是估值体系切换（从 A 股估值向全球可比公司估值靠拢）。",
      keyEvidence: [
        "A 股出海企业海外收入占比中位数从 2020 年的 22% 提升至 2025 年的 38%",
        "海外毛利率平均高于国内 8-12 个百分点",
        "头部出海企业 PE 估值仍比全球可比公司低 30-40%"
      ],
      sections: [
        {
          title: "核心矛盾",
          content: "出海企业的核心矛盾在于：当前的海外扩张是短期的订单转移，还是长期的全球化能力建设？\n\n如果只是订单转移（受益于汇率或贸易格局变化），那么估值重估的基础不稳固。但如果是真正的全球化运营能力（本地建厂、本地团队、本地品牌），则值得给予更高的估值。"
        },
        {
          title: "出海企业的资本周期特征",
          content: "出海企业的资本周期与纯内需企业有显著差异：\n\n1. 资本开支结构不同：海外建厂的 Capex 周期更长、前期投入更大\n2. 回报节奏不同：海外产能从投产到盈利通常需要 2-3 年的爬坡期\n3. 竞争环境不同：海外市场的竞争者更分散，定价权更强\n\n因此，出海企业的高 Capex/折旧比不一定代表「过度扩张」，可能是「能力建设」的必要投入。需要区分对待。"
        },
        {
          title: "估值框架",
          content: "出海企业的估值重估来自两个维度：\n\n维度一：盈利质量改善\n- 海外毛利率平均高于国内 8-12pct\n- 海外收入占比每提升 10pct，综合毛利率提升 1-1.5pct\n- ROE 因此获得结构性提升\n\n维度二：估值体系切换\n- 全球化运营的中国企业可以参考海外可比公司定价\n- 全球制造业龙头 PE 中枢 18-22x，而 A 股出海企业平均 12-15x\n- 存在 30-40% 的估值折价，随着全球化深化有望收窄\n\n关键催化剂：海外收入占比超过 50%、海外生产基地投产、获得海外机构投资者认可。"
        },
        {
          title: "投资含义",
          content: "筛选标准：\n1. 海外收入占比 > 30% 且趋势上升\n2. 海外毛利率 > 国内毛利率\n3. 已在海外建立生产基地或正在建设中\n4. 管理层有明确的全球化战略\n5. 资本周期位置偏右侧（避免纯扩张期的企业）\n\n重点关注行业：\n- 工程机械（三一、徐工）\n- 家电（海尔、美的）\n- 汽车零部件\n- 光伏逆变器（阳光电源等）\n- 跨境电商基础设施\n\n风险：地缘政治、汇率波动、海外建厂成本超预期。"
        }
      ],
      linkedModules: ["capital-cycle"],
      linkedIndustryId: null
    },
    {
      id: "report-007",
      type: "company",
      title: "伟仕佳杰：亚太IT分销龙头的价值与边际",
      subtitle: "东南亚渠道网络 × AI算力分销 × 云计算转型",
      author: "NSC Research",
      date: "2026-05-16",
      tags: ["伟仕佳杰", "IT分销", "东南亚", "AI算力", "港股"],
      industry: "IT分销",
      market: "港股",
      status: "published",
      confidence: "中高",
      conclusion: "伟仕佳杰（0856.HK）是亚太最大的ICT分销商之一，东南亚渠道网络是核心护城河。2025年收入976亿港元（+9.6%），净利润13.53亿港元（+28.6%），ROE约13.3%。中等护城河，当前股价10.41港元安全边际不足，合理买入区间在8.0-8.6港元以下。",
      keyEvidence: [
        "东南亚收入占比从2019年21%升至2025年37%，净利润占比超50%",
        "5年平均ROE约12.5%，高于资本成本（10.5%），但超额回报幅度不大",
        "经营现金流19.55亿港元，覆盖净利润1.44倍，现金创造能力良好",
        "云计算业务收入50.81亿港元，毛利率远高于传统分销（云管理服务60%+）",
        "创始人李佳林持股31.77%，但2012年有操控股价被判入狱的历史污点"
      ],
      sections: [
        {
          title: "核心矛盾",
          content: "伟仕佳杰的核心矛盾在于：IT分销是一门低毛利（4%-5%）、高周转的「苦生意」，护城河真实但不宽。公司的差异化来自东南亚渠道网络（9国、80+办公室、5万+渠道伙伴）和上游300+科技厂商的授权关系。\n\n关键问题：东南亚数字化红利和AI算力分销的增量，能否推动公司从「普通分销商」升级为「高毛利技术服务商」？如果云计算占比从5%提升至15-20%，盈利结构将发生质变。"
        },
        {
          title: "竞争格局与护城河",
          content: "三大直接竞争者对比（2025年）：\n\n伟仕佳杰：收入976亿港元，毛利率4.46%，净利率1.39%，ROE~13.3%\n神州数码：收入~1300亿港元等值，毛利率~3.4%，净利率~0.36%（转型阵痛期，净利润同比-30.5%）\n联强国际：收入~1000亿港元等值，毛利率~4.3%，净利率~2.45%，ROE较高\n\n伟仕佳杰的核心差异化在于东南亚版图——神州数码和联强都没有如此深厚的东南亚布局。公司是中国科技企业出海东南亚的首选渠道。\n\n护城河评级：中等。ROE高于行业平均和神州数码，但与联强相比差距不大。优势来自渠道网络和厂商关系，而非结构性垄断。护城河正在变宽——东南亚占比持续提升，云计算高毛利业务增长。"
        },
        {
          title: "R/N/g三要素与估值",
          content: "R（ROE）：5年均值约12.5%，高于资本成本10.5%，超额回报真实但幅度有限。\n\nN（护城河持续期）：8-12年。东南亚数字化红利至少8-10年释放窗口，AI算力需求刚刚开始。\n\ng（增长率）：2022-2025年净利润3年复合增长率约18%。基准情景g=10%，乐观15%，悲观5%。增长几乎全部来自内生。\n\n估值：\n- AV（资产价值）= 每股7.28港元（PB=1.43x）\n- EPV（5年均值）= 每股7.28港元\n- EPV（2025实际）= 每股9.01港元\n- Q公式合理估值（g=7%）= 每股11.43港元\n\n股东权益回报率 = ROE/PB = 13.3%/1.43 ≈ 9.3%，略低于10%的合理门槛。\n累计分红约10年回本，勉强达到张尧标准。\n\n合理买入区间：8.0-8.6港元以下（合理估值打7-7.5折）。"
        },
        {
          title: "风险与跟踪指标",
          content: "行业风险：\n- 厂商直销/电商侵蚀消费电子分销（可能性中，影响EPV约10%）\n- 全球IT支出放缓（参考2022-2023年，净利润可下降30-40%）\n- 地缘政治影响中国科技企业出海（可能性中低）\n\n公司风险：\n- 管理层污点：李佳林2012年操控股价前科（有条件信任）\n- 资金周转：AI服务器等高单价产品放量时存货占用可能增加\n\n结论：当前10.41港元不是最佳买入时机，安全边际不足。等待8.0-8.6港元以下的买入窗口。\n\n核心跟踪指标（每半年更新）：\n1. 东南亚收入占比及利润占比\n2. 云计算业务收入增速及毛利率\n3. 经营现金流/净利润比率\n4. 应收账款和存货周转天数\n5. ROE水平"
        }
      ],
      linkedModules: ["capital-cycle"],
      linkedIndustryId: null,
      markdownFile: "reports/vstecs-deep-report.md"
    },
    {
      id: "report-008",
      type: "company",
      title: "泡泡玛特：LABUBU 之后，泡泡玛特是不是中国的 Sanrio？",
      subtitle: "从潮玩零售商到全球 IP 运营平台，拆解管理层、竞争格局、R/N/g 与安全边际",
      author: "NSC Research",
      date: "2026-05-16",
      tags: ["泡泡玛特", "POP MART", "LABUBU", "潮玩", "IP", "港股", "全球化"],
      company: "泡泡玛特",
      industry: "潮玩与消费IP",
      market: "港股",
      status: "published",
      confidence: "中高",
      conclusion: "泡泡玛特已经从潮玩零售商升级为以自有 IP 为核心、用产品和渠道完成全球商业化的文化消费公司。2025 年 LABUBU/THE MONSTERS 全球爆发证明了爆款能力，但公司仍需用 2026-2027 年证明超级 IP 的长寿能力和多 IP 接棒能力。当前 HK$152.40 位于需要成长兑现的区间，HK$110-120 以下更符合安全边际纪律。",
      keyEvidence: [
        "2025 年收入 RMB 371.20 亿元，同比增长 184.7%；归母净利润 RMB 127.76 亿元，同比增长 308.8%",
        "THE MONSTERS 收入 RMB 141.61 亿元，占总收入约 38.1%，LABUBU 成为全球级爆款",
        "自有产品收入占比 99.1%，公司利润主要来自自有或深度运营 IP，而非简单渠道差价",
        "王宁被视为持股 48.73%，创始人控制力强；Post-IPO 股份奖励计划绑定核心员工",
        "估值上 AV 约 HK$15-22/股，EPV 中性约 HK$100-120/股，当前价格已包含可见成长价值"
      ],
      sections: [
        {
          title: "核心矛盾",
          content: "泡泡玛特是不是好公司已不是最核心的问题。2025 年之后，它更像一家全球 IP 运营平台，而不是单纯盲盒或潮玩零售商。真正的核心矛盾是：LABUBU 的爆发到底是一段超级爆款周期，还是泡泡玛特可持续生产全球 IP 的组织能力证明？"
        },
        {
          title: "管理层与叙事转折",
          content: "王宁在 2025 年年报中称“LABUBU 像一個金礦”，同时把 2026 年比作“维修站”年份，强调加油换轮胎和可持续增长。前一句体现信心，后一句体现对高速增长后组织消化的警觉。管理层综合评价为条件信任：创始人持股高、战略清楚、财务克制、执行结果突出，但必须证明非 THE MONSTERS 的 IP 矩阵能接棒。"
        },
        {
          title: "竞争与护城河",
          content: "核心对标是 Sanrio，辅助对照是 Funko。Sanrio 证明角色 IP 可以跨越几十年；Funko 则说明仅靠授权玩具和渠道铺货，可能陷入库存和利润波动。泡泡玛特 2025 年毛利率 72.1%、净利率 35.1%，显著高于 Funko，并接近成熟 IP 公司的利润结构。护城河评级为中等偏宽，正在变宽，但尚未达到成熟宽护城河。"
        },
        {
          title: "估值与买入纪律",
          content: "泡泡玛特不是资产保护型投资，AV 约 HK$15-22/股；保守 EPV 约 HK$70-90/股，中性 EPV 约 HK$100-120/股。当前 HK$152.40 位于 EPV + 可见成长价值区间，价格层安全边际不厚。较好的新买入区间在 HK$110-120 以下；HK$90 附近则接近明显便宜。"
        },
        {
          title: "风险与跟踪指标",
          content: "主要风险包括单一 IP 依赖、库存上升、海外组织降速、仿品和品牌秩序。每半年重点跟踪 THE MONSTERS 占比、非 THE MONSTERS 前六大 IP 增速、海外收入环比和单店收入、存货周转天数、经营利润率是否稳定在 30% 以上。"
        }
      ],
      linkedModules: [],
      linkedIndustryId: null,
      markdownFile: "reports/popmart-deep-report.md"
    },
    {
      id: "report-009",
      type: "company",
      title: "京东方 A：面板双寡头时代的周期与价值",
      subtitle: "全球 LCD 龙头 × OLED 转型 × ROE 能否突破资本成本",
      author: "NSC Research",
      date: "2026-05-16",
      tags: ["京东方", "BOE", "面板", "LCD", "OLED", "周期股", "A股"],
      company: "京东方A",
      industry: "半导体显示",
      market: "A股",
      status: "published",
      confidence: "中",
      conclusion: "京东方A（000725.SZ）是全球面板龙头，LCD出货面积全球第一。双寡头格局初步形成，但5年平均ROE仅7.4%，低于10%资本成本——公司目前不创造经济价值。EPV约2.0元/股，当前4.14元是EPV的2倍，安全边际不存在。理想买入区间3.0元以下。",
      keyEvidence: [
        "2025年收入2046亿元，归母净利润58.6亿元，ROE仅4.4%，远低于10%资本成本",
        "5年平均ROE 7.4%，EPV≈AV，几乎不存在经济商誉——规模优势未转化为超额回报",
        "全球LCD产能高度集中于京东方+TCL华星，双寡头定价权初步形成",
        "TCL华星2025年净利润80.1亿已超过京东方58.6亿，经营效率反超是警惕信号",
        "Q公式显示ROE<资本成本时合理PB应低于1，当前PB 1.14x意味市场在赌ROE提升"
      ],
      sections: [
        {
          title: "核心矛盾",
          content: "京东方的核心矛盾是：全球面板龙头的规模优势是否能在双寡头格局下转化为真实的超额回报？5年平均ROE 7.4%低于10%资本成本，说明目前为止答案是否定的。市场正在提前定价'格局改善→ROE提升'的逻辑，但财务数据尚未验证。"
        },
        {
          title: "竞争与护城河",
          content: "产能规模护城河为宽，但综合护城河仅为中等。关键问题是TCL华星2025年净利润已反超京东方——规模最大≠效率最高。面板行业利润夹在高壁垒上游和强势下游之间，结构性薄利。护城河→WACC取10.5%。"
        },
        {
          title: "估值与买入纪律",
          content: "EPV约2.0元/股，AV约2.0元/股。EPV≈AV说明不存在经济商誉。当前4.14元是EPV的2倍。股东权益回报率3.9%（远低于10%门槛）。分红回本40年以上。三个成长价值验证工具全部不达标。理想买入区间3.0元以下。"
        },
        {
          title: "风险与跟踪指标",
          content: "面板价格下行压力测试：EPV降至0.64元，下行85%，完全不可吸收。OLED转型不及预期：EPV降至0.59元，同样不可吸收。核心跟踪：ROE是否突破7%、OLED良率、LCD价格稳定性、是否再次定增、TCL华星利润率趋势。"
        }
      ],
      linkedModules: [],
      linkedIndustryId: null,
      markdownFile: "reports/boe-deep-report.md"
    },
    {
      id: "report-010",
      type: "company",
      title: "顾家家居：地产后周期里的软体家具龙头",
      subtitle: "软体家具品牌 × 盈峰系入主 × 中等护城河下的买入纪律",
      author: "NSC Research",
      date: "2026-05-16",
      tags: ["顾家家居", "软体家具", "家居", "消费", "A股", "盈峰系"],
      company: "顾家家居",
      industry: "家居用品",
      market: "A股",
      status: "published",
      confidence: "中",
      conclusion: "顾家家居是一家现金流质量较好的软体家具龙头，2025年收入200.56亿元、归母净利润17.90亿元、经营现金流27.74亿元。但家具是低频消费，护城河评级为中等而非宽。当前31.79元已高于EPV估算的20-22元/股，需要为成长和盈峰系赋能付费；新买入最好等待26元以下，22元附近更接近保守区。",
      keyEvidence: [
        "2025年收入200.56亿元，同比+8.53%；归母净利润17.90亿元，同比+26.37%；经营现金流/净利润约1.55x",
        "管理层需要分层看：顾江生证明品牌创业能力但喜临门事件留下治理折价，李东来承接美的式职业化运营，何剑锋/盈峰系仍需用结果证明赋能",
        "沙发收入115.76亿元、卧室产品34.65亿元，是公司品牌心智和规模优势所在",
        "对比敏华控股和欧派家居，顾家2025年收入增长跑赢，但毛利率和净利率并非行业最高，护城河不能直接评为宽",
        "卡拉曼式清算地板约9.4元/股，经营转售AV约12.8元/股，EPV约20-22元/股；当前价格位于EPV以上的成长价值区间，安全边际不厚"
      ],
      sections: [
        {
          title: "核心矛盾",
          content: "顾家的问题不是它是不是一家好家具公司，而是在地产后周期里，品牌、渠道、海外供应链和新控制人赋能能否把ROE稳定在15%-17%。如果只是2025年修复，当前价格不便宜；如果连续兑现功能智能、海外非美和零售效率，估值才有上移空间。"
        },
        {
          title: "管理层与控制权转折",
          content: "顾家管理层要分三层：顾江生时代把沙发品牌做成软体龙头，但喜临门收购和后续调查说明资本扩张边界要打折；李东来2012年从美的体系进入顾家，长期担任总裁，是职业化运营的核心；何剑锋/盈峰系以102.99亿元接盘并继续定增，像产业控制型资本，但仍需用2026-2027年的经营结果证明赋能。"
        },
        {
          title: "竞争与护城河",
          content: "敏华控股是软体和功能沙发的直接对手，欧派家居是争夺整家装修预算的参照。顾家2025年收入增长明显跑赢二者，但毛利率32.8%低于敏华和欧派。结论是中等护城河：品牌、渠道、现金流真实存在，但行业低频、替代多、价格战仍会压制估值。"
        },
        {
          title: "估值与买入纪律",
          content: "AV按卡拉曼式清算地板处理，不按账面净资产照搬：应收、存货、固定资产、商誉和品牌渠道均做压力折扣。清算AV约77亿元，对应约9.4元/股；经营转售AV约105亿元，对应约12.8元/股；中性EPV约165-180亿元，对应20-22元/股。当前31.79元处于EPV+成长价值区间，22元以下接近保守区，26元以下较有吸引力。"
        },
        {
          title: "跟踪指标",
          content: "每半年跟踪收入增速、毛利率、ROE、经营现金流/净利润、海外非美收入、应收账款和存货周转。若连续两个半年度收入8%+、毛利率32%+、ROE17%+、OCF/净利润1.2x+，合理买入区可上移到28-30元。"
        }
      ],
      linkedModules: [],
      linkedIndustryId: null,
      markdownFile: "reports/gujia-deep-report.md"
    },
    {
      id: "report-011",
      type: "company",
      title: "五粮液：品牌资产仍厚，治理折价已显性化",
      subtitle: "高端浓香品牌 × 收入确认重述 × 股息与安全边际的重新校准",
      author: "NSC Research",
      date: "2026-05-17",
      tags: ["五粮液", "白酒", "高端消费", "A股", "治理折价", "股息"],
      company: "五粮液",
      industry: "白酒",
      market: "A股",
      status: "published",
      confidence: "中",
      conclusion: "五粮液仍是中国白酒里少数拥有全国高端品牌、浓香品类基本盘和超额现金资产的公司，但2025年业绩断崖、收入确认口径调整、董事长被留置共同说明，当前研究重点已从“品牌是否强”转向“治理和渠道真实库存能否重新变得可信”。按 EBIT 模式重估后基准 EPV 约 72.6 元，86.87元/股落在乐观修复价值附近，更适合持有和等待验证，暂无深度安全边际。",
      keyEvidence: [
        "2025年收入405.29亿元，同比-54.55%；归母净利润89.54亿元，同比-71.89%；ROE降至6.89%",
        "2026年一季报说明因梳理2025年业务模式，基于谨慎性原则调整部分业务收入确认相关核算",
        "前期会计差错更正显示，2025年一季度营业收入由369.40亿元调减至170.86亿元，归母净利润由148.60亿元调减至44.16亿元",
        "2025年末货币资金1270.14亿元，年度拟每10股派现25.78元，但年度分红高于当年归母净利润",
        "对比贵州茅台，五粮液主品牌毛利率仍高，但稀缺性、价格刚性、ROE稳定性和治理可信度均需要打折"
      ],
      sections: [
        {
          title: "核心矛盾",
          content: "五粮液不是简单的“便宜白酒龙头”。它真正的投资问题是：品牌、现金和分红能否抵消收入确认调整、渠道库存和管理层事件带来的治理折价？如果公司能重新证明主品牌批价、库存和收入确认稳定，护城河可回到宽护城河附近；否则更应按高现金成熟消费国企估值。"
        },
        {
          title: "管理层与治理折价",
          content: "公司长期高分红、现金充足，历史上把五粮液重新推回高端白酒价格带，经营资产真实存在。但2025-2026年的两个信号必须提高资本成本：收入确认与业务模式调整，以及董事长曾从钦被留置、立案调查。管理层综合评级为条件信任，核心条件是后续定期报告不再出现口径反复，渠道库存和批价恢复可验证。"
        },
        {
          title: "竞争与护城河",
          content: "核心对手是贵州茅台。茅台2025年收入1688.38亿元、归母净利润823.20亿元、ROE 32.53%，酒类毛利率91.23%；五粮液2025年收入405.29亿元、归母净利润89.54亿元、ROE 6.89%，酒类毛利率83.75%。五粮液的品牌、浓香品类、产区和渠道护城河真实存在，但不是茅台式稀缺资产，护城河评级为中等偏宽且需要修复验证。"
        },
        {
          title: "估值与买入纪律",
          content: "五粮液2025年末每股净资产约30.90元，86.87元对应PB约2.81倍。保守AV约25-26元/股。采用 EBIT 模式剥离超额现金重估后，基准修复EPV约72.6元/股，乐观修复EPV约85.0元/股。当前价（86.87元）几乎刚好贴合乐观修复 EPV，已计入业务复苏预期。60-75元是具备深度现金保护的买入区，75-85元以持有验证为主。"
        },
        {
          title: "跟踪指标",
          content: "每半年跟踪五个指标：收入确认是否继续调整；主品牌批价与渠道库存；合同负债、经营现金流与收入增长是否匹配；2026年归母净利润能否回到180-220亿元区间；分红是否由当年利润覆盖，而不是主要消耗历史现金。"
        }
      ],
      linkedModules: [],
      linkedIndustryId: null,
      markdownFile: "reports/wuliangye-deep-report.md"
    }
  ]
};

(function setupReportDeepLinkFallback() {
  function normalizeReportHash(hash) {
    if (!hash || !hash.startsWith("#report-")) return null;
    const raw = decodeURIComponent(hash.slice(1));
    const reports = (window.REPORTS_DATA && window.REPORTS_DATA.reports) || [];
    if (reports.some(report => report.id === raw)) return raw;

    const withoutExtraPrefix = raw.replace(/^report-/, "");
    if (reports.some(report => report.id === withoutExtraPrefix)) return withoutExtraPrefix;
    return null;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function typeLabel(type) {
    return {
      industry: "行业报告",
      company: "公司报告",
      theme: "主题报告",
      century: "百年专题",
      "company-card": "公司卡片"
    }[type] || type || "报告";
  }

  function renderDirectReport(report) {
    const capitalCycleContent = document.getElementById("capital-cycle-content");
    const deepReportsContent = document.getElementById("deep-reports-module");
    const reportGrid = document.getElementById("reportGrid");
    if (!deepReportsContent || !reportGrid) return false;

    capitalCycleContent?.classList.add("hidden");
    deepReportsContent.classList.remove("hidden");
    document.getElementById("capital-cycle")?.classList.remove("active");
    document.getElementById("module-reports")?.classList.add("active");

    const tags = (report.tags || []).map(tag => `<span class="report-tag">${escapeHtml(tag)}</span>`).join("");
    const evidence = (report.keyEvidence || []).map(item => `<li>${escapeHtml(item)}</li>`).join("");
    const summarySections = (report.sections || []).map(section => `
      <div class="report-section-block">
        <h4>${escapeHtml(section.title)}</h4>
        <div class="section-text">${escapeHtml(section.content)}</div>
      </div>
    `).join("");

    reportGrid.innerHTML = `
      <div class="report-card active" data-report-id="${escapeHtml(report.id)}">
        <div class="report-card-head">
          <span class="report-type-badge ${escapeHtml(report.type)}">${escapeHtml(typeLabel(report.type))}</span>
          <span class="report-card-date">${escapeHtml(report.date)}</span>
          ${report.market ? `<span class="report-card-date">${escapeHtml(report.market)}</span>` : ""}
        </div>
        <h3>${escapeHtml(report.title)}</h3>
        <div class="report-card-subtitle">${escapeHtml(report.subtitle || "")}</div>
        <div class="report-card-conclusion">${escapeHtml(report.conclusion || "")}</div>
        <div class="report-tags">${tags}</div>
        <div class="report-card-footer">
          <span class="report-confidence">置信度: ${escapeHtml(report.confidence || "")}</span>
          <span class="report-card-date">${escapeHtml(report.author || "")}</span>
        </div>
      </div>
      <div class="report-detail-panel" id="reportDetail-${escapeHtml(report.id)}">
        <div class="report-detail-header">
          <div>
            <h2>${escapeHtml(report.title)}</h2>
            <div class="report-detail-meta">
              <span class="report-type-badge ${escapeHtml(report.type)}">${escapeHtml(typeLabel(report.type))}</span>
              ${report.market ? `<span class="badge">${escapeHtml(report.market)}</span>` : ""}
              ${report.industry ? `<span class="badge">${escapeHtml(report.industry)}</span>` : ""}
              <span class="report-card-date">${escapeHtml(report.date)} · ${escapeHtml(report.author || "")} · 置信度 ${escapeHtml(report.confidence || "")}</span>
            </div>
          </div>
          <button class="report-close-btn" data-report-close aria-label="关闭详情">×</button>
        </div>
        ${report.markdownFile ? `<div class="report-md-loading" id="directMdContent-${escapeHtml(report.id)}">正在加载完整报告…</div>` : `
          <div class="report-evidence-box">
            <h4>核心结论</h4>
            <p>${escapeHtml(report.conclusion || "")}</p>
            <ul class="report-evidence-list">${evidence}</ul>
          </div>
          <div class="report-sections">${summarySections}</div>
        `}
      </div>
    `;

    reportGrid.querySelector("[data-report-close]")?.addEventListener("click", () => {
      history.replaceState(null, "", "#deep-reports-module");
      const companyReportLink = document.querySelector('[data-report-type="company"]');
      if (companyReportLink) {
        companyReportLink.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
      }
      document.getElementById("deep-reports-module")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    if (report.markdownFile) {
      fetch(report.markdownFile)
        .then(response => response.ok ? response.text() : Promise.reject(new Error("markdown fetch failed")))
        .then(markdown => {
          const holder = document.getElementById("directMdContent-" + report.id);
          if (!holder) return;
          holder.className = "report-full-md";
          holder.innerHTML = typeof marked !== "undefined"
            ? marked.parse(markdown)
            : `<pre style="white-space:pre-wrap;font-size:13px;line-height:1.7">${escapeHtml(markdown)}</pre>`;
        })
        .catch(() => {
          const holder = document.getElementById("directMdContent-" + report.id);
          if (holder) holder.textContent = "报告加载失败，请刷新重试。";
        });
    }

    setTimeout(() => {
      document.getElementById("reportDetail-" + report.id)?.scrollIntoView({ behavior: "auto", block: "start" });
    }, 0);
    return true;
  }

  function openReportHash() {
    const reportId = normalizeReportHash(window.location.hash);
    if (!reportId) return false;

    const reports = (window.REPORTS_DATA && window.REPORTS_DATA.reports) || [];
    const report = reports.find(item => item.id === reportId);
    if (!report) return false;

    if (window.location.hash !== "#" + reportId) {
      history.replaceState(null, "", "#" + reportId);
    }

    return renderDirectReport(report);
  }

  window.addEventListener("DOMContentLoaded", () => {
    setTimeout(openReportHash, 350);
  });
  window.addEventListener("hashchange", () => {
    setTimeout(openReportHash, 80);
  });
})();
