const data = window.FLEET_DATA.vessels;
const colors = {laden:"#19a875",part_laden:"#4e9ab2",ballast:"#e4a23a"};
const labels = {laden:"重载",part_laden:"半载",ballast:"空载"};
const isStale = v => v.ais_age_hours_at_collection === "" || Number(v.ais_age_hours_at_collection) > 72;
const count = key => data.filter(v => v.derived_load_band === key).length;
const laden = count("laden"), part = count("part_laden"), ballast = count("ballast");
const stale = data.filter(isStale).length;
const knownStatus = data.filter(v => v.navigation_status && v.navigation_status !== "-");
const moving = knownStatus.filter(v => v.navigation_status === "Under way").length;
const revenueWeight = (laden + part * .55) / data.length;
const flowBalance = 1 - Math.abs(laden - ballast) / data.length;
const statusScore = knownStatus.length ? moving / knownStatus.length : .65;
const confidence = 1 - stale / data.length;
const bucketCount = key => data.filter(v => v.commercial_bucket === key).length;
const waitingCount = data.filter(v => ["waiting_loading","waiting_orders"].includes(v.commercial_bucket)).length;
const operatingCount = data.filter(v => ["laden_voyage","part_cargo","active_port","ballast_reposition"].includes(v.commercial_bucket)).length;
const confirmedRevenueCount = data.filter(v =>
  v.commercial_bucket === "laden_voyage" ||
  (v.commercial_bucket === "active_port" && v.derived_load_band === "laden")
).length;
const commercialRate = Math.round(operatingCount / data.length * 100);
const revenueRate = Math.round(confirmedRevenueCount / data.length * 100);
const history = window.FLEET_DATA.history || [];
const market = window.FLEET_DATA.market || {};

document.querySelector("#dataTime").textContent = window.FLEET_DATA.generatedAt.replace(" UTC","Z");
document.querySelector("#ladenCount").textContent = laden;
document.querySelector("#partCount").textContent = part;
document.querySelector("#ballastCount").textContent = ballast;
document.querySelector("#commercialRate").textContent = commercialRate + "%";
document.querySelector("#revenueRate").textContent = revenueRate + "%";
document.querySelector("#commercialGauge").style.width = commercialRate + "%";
document.querySelector("#revenueGauge").style.width = revenueRate + "%";

const map = L.map("map",{zoomControl:false,minZoom:2,worldCopyJump:true}).setView([17,48],2);
L.control.zoom({position:"bottomright"}).addTo(map);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:8,attribution:"© OpenStreetMap"}).addTo(map);
const markerLayer = L.layerGroup().addTo(map);
const routeLayer = L.layerGroup().addTo(map);
let activeFilter = "all";

function routePoints(v){
  const points = [[v.lat,v.lon]];
  if(Math.abs(v.route_lon-v.lon)>80){
    const bendLon = v.lon > 80 && v.route_lon < 0 ? 178 : (v.lon < -80 && v.route_lon > 0 ? -178 : (v.lon+v.route_lon)/2);
    points.push([(v.lat+v.route_lat)/2,bendLon]);
  }
  points.push([v.route_lat,v.route_lon]);
  return points;
}
function markerIcon(v){
  const size = v.derived_load_band === "laden" ? 13 : 10;
  return L.divIcon({className:"",html:`<div class="ship-marker ${isStale(v)?"stale-marker":""}" style="width:${size}px;height:${size}px;background:${colors[v.derived_load_band]};color:${colors[v.derived_load_band]}"></div>`,iconSize:[size,size],iconAnchor:[size/2,size/2]});
}
function visible(v){
  if(activeFilter==="all")return true;
  if(activeFilter==="stale")return v.assessment_confidence==="低";
  if(activeFilter==="waiting")return ["waiting_loading","waiting_orders"].includes(v.commercial_bucket);
  return v.commercial_bucket===activeFilter;
}
function renderMap(){
  markerLayer.clearLayers();routeLayer.clearLayers();
  data.filter(visible).forEach(v=>{
    const marker=L.marker([v.lat,v.lon],{icon:markerIcon(v),title:v.roster_name}).addTo(markerLayer);
    marker.bindTooltip(`${v.roster_name} · ${labels[v.derived_load_band]}`,{direction:"top"});
    marker.on("click",()=>showShip(v));
    if(document.querySelector("#routeToggle").checked){
      L.polyline(routePoints(v),{color:colors[v.derived_load_band],weight:1,opacity:.42,dashArray:"5 6",interactive:false}).addTo(routeLayer);
    }
  });
}
document.querySelector("#filters").addEventListener("click",e=>{
  const btn=e.target.closest("button");if(!btn)return;
  document.querySelectorAll("#filters button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");
  activeFilter=btn.dataset.filter;renderMap();
});
document.querySelector("#routeToggle").addEventListener("change",renderMap);

function showShip(v){
  const supplemental = v.calibrated_position && v.calibrated_position !== "—"
    ? `<br><br><b>人工校准观察：${v.calibrated_position}</b>${v.analyst_note?`<br>${v.analyst_note}`:""}`
    : (v.analyst_note?`<br><br><b>人工备注</b><br>${v.analyst_note}`:"");
  document.querySelector("#shipCard").innerHTML=`
    <h3>${v.roster_name}</h3><div class="imo">IMO ${v.imo} · MMSI ${v.mmsi}</div>
    ${v.current_name.toUpperCase()!==v.roster_name.toUpperCase()?`<div class="imo">现名 ${v.current_name}</div>`:""}
    <div class="ship-grid">
      <div><span>当前区域</span><b>${v.area}</b></div>
      <div><span>吃水 / 载况</span><b>${v.draught_m}m · ${labels[v.derived_load_band]}</b></div>
      <div><span>航行状态</span><b>${v.navigation_status||"未上报"}</b></div>
      <div><span>AIS时点</span><b>${v.ais_timestamp_utc||"索引快照"}</b></div>
      <div><span>建造 / 载重吨</span><b>${v.build_year||"—"} · ${v.dwt?Math.round(v.dwt/1000)+"k DWT":"—"}</b></div>
      <div><span>船旗</span><b>${v.flag||"—"}</b></div>
    </div><div class="route-call"><b>${v.broker_status} · ${v.assessment_confidence}置信度</b><br>${v.broker_rationale}<br><br><b>推断航向：${v.route_name}</b><br>${v.route_note}</div>`;
  document.querySelector("#shipCard .route-call").insertAdjacentHTML("beforeend",supplemental);
}

const regionCounts=Object.entries(data.reduce((a,v)=>(a[v.area]=(a[v.area]||0)+1,a),{})).sort((a,b)=>b[1]-a[1]).slice(0,7);
const maxRegion=regionCounts[0][1];
document.querySelector("#regionBars").innerHTML=regionCounts.map(([name,n])=>`<div class="region-row"><span>${name}</span><div class="bar"><i style="width:${n/maxRegion*100}%"></i></div><b>${n}</b></div>`).join("");
const balanceText = ballast > laden ? "空载船略多于重载船，船队仍处于补位阶段" : "重载船已覆盖空载船，收入航段占优";
document.querySelector("#diagnosis").innerHTML=`
  <div class="diagnostic good"><b>商业运营率 ${commercialRate}% · ${operatingCount}艘</b><p>包括载货、部分载货、港口作业和空载调位。压载航行属于完整商业循环，不等于闲置。</p></div>
  <div class="diagnostic ${revenueRate>=40?"good":"warn"}"><b>收入航段率 ${revenueRate}% · ${confirmedRevenueCount}艘</b><p>仅统计确定载货航次及重载港口作业；空载调位、候货和中间吃水均不计入。</p></div>
  <div class="diagnostic ${waitingCount<8?"good":"warn"}"><b>候货/等指令 ${waitingCount}艘</b><p>其中装货区锚泊与卸货后待命性质不同，需要连续位置和停留时长进一步区分。</p></div>
  <div class="diagnostic ${stale<10?"good":"risk"}"><b>低置信度 ${stale}艘</b><p>AIS超过72小时或缺精确时点，商业状态只能作为初判，不能计入严格利用率。</p></div>`;

function renderHistory(){
  if(!history.length)return;
  const march=history[0], juneSummary=history[1], current=history[history.length-1];
  const vsMarch=current.laden-march.laden;
  const vsJune=current.laden-juneSummary.laden;
  document.querySelector("#trendVerdict").innerHTML=
    `<b>结论：相较3月改善，相较6月7日表面退化但证据不足。</b><br>`+
    `重载船较3月增加 ${vsMarch} 艘；较6月7日汇总减少 ${Math.abs(vsJune)} 艘。后者覆盖数和分类口径不同，不能直接视为经营恶化。`;
  const displayed=history.length>6 ? [history[0],history[1],...history.slice(-4)] : history;
  document.querySelector("#trendChart").innerHTML=displayed.map(h=>`
    <article class="trend-card">
      <h3>${h.label}</h3><div class="coverage">覆盖 ${h.coverage} 艘 · ${h.confidence==="low"?"低":"中"}置信度</div>
      <div class="stack">
        <i data-value="${h.laden}" style="height:${h.laden/h.coverage*100}%;background:${colors.laden}"></i>
        <i data-value="${h.part_laden}" style="height:${h.part_laden/h.coverage*100}%;background:${colors.part_laden}"></i>
        <i data-value="${h.ballast}" style="height:${h.ballast/h.coverage*100}%;background:${colors.ballast}"></i>
        <i data-value="${h.yard}" style="height:${h.yard/h.coverage*100}%;background:#8a8f93"></i>
      </div>
      <div class="trend-metrics">
        <span>收入航段率<b>${h.revenue_rate}%</b></span>
        <span>商业运营率<b>${h.commercial_rate===null?"—":h.commercial_rate+"%"}</b></span>
      </div>
    </article>`).join("");
  document.querySelector("#trendNotes").innerHTML=`
    <div class="trend-note"><b>相较3月：明确改善</b><br>重载由17艘升至22艘，维修/系泊标签由4艘降至当前未识别到明确船厂状态，船队已走出封锁初期低点。</div>
    <div class="trend-note warn"><b>相较6月7日：可能回落</b><br>汇总曾记录28艘重载，目前为22艘。但6月7日只有51艘且半载口径为0，存在分类合并，不能据此断言运营退化。</div>
    <div class="trend-note risk"><b>最大的限制是数据时效</b><br>当前19艘为低置信度。只有连续快照后，才能计算真实等待天数、空载航程、航次转换和趋势。</div>
    <div class="trend-note"><b>后续比较规则</b><br>每12小时保存一次IMO级快照；同一口径连续7天后，再判断商业运营率和收入航段率的改善或退化。</div>`;
}

function estimateQuarter(tce, earningFactor, otherProfit=.28){
  const ships=53, days=92, fixedUsdDay=20000, fx=7.1, afterTax=.88;
  const tceRevenue=ships*days*earningFactor*tce;
  const fleetFixedCost=ships*days*fixedUsdDay;
  const tankerNet=Math.max(0,(tceRevenue-fleetFixedCost)*fx/1e9*afterTax);
  return {tankerNet,companyNet:tankerNet+otherProfit};
}
const toYi = valueBn => valueBn*10;
function renderMarketMonitor(){
  const atlanticWaiting=data.filter(v=>
    ["Gulf of Mexico","Caribbean Sea","West Africa","South America East Coast"].includes(v.area) &&
    v.derived_load_band==="ballast" &&
    ["At anchor","Moored"].includes(v.navigation_status)
  ).length;
  const signals=[
    {name:"候货/等指令",value:waitingCount+"艘",threshold:"预警 ≥10艘",state:waitingCount>=10?"risk":waitingCount>=8?"warn":"good",note:"当前尚未形成大面积闲置"},
    {name:"商业运营率",value:commercialRate+"%",threshold:"预警 <65%",state:commercialRate<65?"risk":commercialRate<70?"warn":"good",note:"衡量船队是否仍在执行商业安排"},
    {name:"收入航段率",value:revenueRate+"%",threshold:"预警 <35%",state:revenueRate<35?"risk":revenueRate<40?"warn":"good",note:"严格统计重载收入航段"},
    {name:"大西洋空载停泊",value:atlanticWaiting+"艘",threshold:"关注持续增加",state:atlanticWaiting>=6?"risk":atlanticWaiting>=3?"warn":"good",note:"验证西移后是否出现运力堆积"},
    {name:"TD15 / TD22",value:`$${Math.round(market.td15_tce_usd_day/1000)}k / $${Math.round(market.td22_tce_usd_day/1000)}k`,threshold:"预警均 < $60k",state:(market.td15_tce_usd_day<60000&&market.td22_tce_usd_day<60000)?"risk":"good",note:`VLSFO $${market.vlsfo_usd_ton}/吨，成本仍高`}
  ];
  document.querySelector("#signalGrid").innerHTML=signals.map(s=>`
    <article class="signal-card ${s.state}"><div class="signal-top"><span>${s.name}</span><span>${s.threshold}</span></div><strong>${s.value}</strong><p>${s.note}</p></article>`).join("");

  const scenarios=[
    {name:"悲观",tce:70000,earning:.90,logic:"海峡长期低通行，非中东货盘不足"},
    {name:"基准",tce:90000,earning:.93,logic:"TD15/TD22附近运行，部分海峡恢复"},
    {name:"乐观",tce:120000,earning:.95,logic:"海峡恢复叠加补库存和港口拥堵"}
  ].map(s=>({...s,...estimateQuarter(s.tce,s.earning)}));
  const q2=estimateQuarter(market.q2_assumed_tce_usd_day,.95);
  document.querySelector("#profitScenarios").innerHTML=`<table class="scenario-table">
    <thead><tr><th>情景</th><th>混合TCE</th><th>有效营运天</th><th>油轮净利</th><th>公司归母净利</th></tr></thead>
    <tbody>${scenarios.map(s=>`<tr class="${s.name==="基准"?"base":""}"><td><b>${s.name}</b><br><small>${s.logic}</small></td><td>$${Math.round(s.tce/1000)}k/天</td><td>${Math.round(s.earning*100)}%</td><td>${toYi(s.tankerNet).toFixed(1)}亿元</td><td class="scenario-profit">${toYi(s.companyNet).toFixed(1)}亿元</td></tr>`).join("")}</tbody>
  </table>`;
  document.querySelector("#modelNote").innerHTML=`
    <b>模型锚点</b><br>
    2026Q1公司归母净利 ${toYi(market.q1_company_net_profit_rmb_bn).toFixed(2)} 亿元，其中油轮板块约 ${toYi(market.q1_tanker_net_profit_rmb_bn).toFixed(2)} 亿元；
    Q1参考TCE约 $${Math.round(market.q1_reference_tce_usd_day/1000)}k/天。<br><br>
    <b>Q2参考推算</b><br>
    按你提供的TCE $${Math.round(market.q2_assumed_tce_usd_day/1000)}k/天，模型对应公司归母净利约 ${toYi(q2.companyNet).toFixed(1)} 亿元。
    Q2尚未发布正式财报，此数值仅用于校准。<br><br>
    <b>Q3基准判断</b><br>
    以TD15 $${Math.round(market.td15_tce_usd_day/1000)}k、TD22 $${Math.round(market.td22_tce_usd_day/1000)}k为可成交市场锚，
    不采用不可成交的TD3C $${Math.round(market.td3c_tce_usd_day/1000)}k名义盘。基准归母净利约 ${toYi(scenarios[1].companyNet).toFixed(1)} 亿元。`;
}

function renderRows(query=""){
  const q=query.trim().toLowerCase();
  document.querySelector("#fleetRows").innerHTML=data.filter(v=>!q||[v.roster_name,v.current_name,v.imo,v.mmsi,v.area].join(" ").toLowerCase().includes(q)).map(v=>`
    <tr data-imo="${v.imo}">
      <td><b>${v.roster_name}</b>${v.current_name.toUpperCase()!==v.roster_name.toUpperCase()?`<br><small>现名 ${v.current_name}</small>`:""}</td>
      <td><span class="freshness">${v.imo}<br>${v.mmsi}</span></td><td>${v.area}</td><td>${v.draught_m} m</td>
      <td><span class="load-pill" style="color:${colors[v.derived_load_band]}">${v.broker_status}</span></td>
      <td><span class="freshness ${v.assessment_confidence==="低"?"old":""}">${v.assessment_confidence}<br>${v.ais_timestamp_utc||"时间待核"}</span></td><td>${v.route_name}</td>
    </tr>`).join("");
}
document.querySelector("#search").addEventListener("input",e=>renderRows(e.target.value));
document.querySelector("#fleetRows").addEventListener("click",e=>{
  const row=e.target.closest("tr");if(!row)return;const v=data.find(x=>x.imo===row.dataset.imo);showShip(v);map.flyTo([v.lat,v.lon],4,{duration:.6});
});
renderMap();renderRows();renderHistory();renderMarketMonitor();
