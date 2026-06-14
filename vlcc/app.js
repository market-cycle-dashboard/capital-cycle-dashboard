const data = window.FLEET_DATA.vessels;
const colors = {laden:"#19a875",part_laden:"#4e9ab2",ballast:"#e4a23a"};
const labels = {laden:"重载",part_laden:"半载",ballast:"空载"};
function parseUtc(value){
  if(!value)return null;
  const parsed = Date.parse(String(value).replace(" UTC","Z"));
  return Number.isFinite(parsed) ? parsed : null;
}
function positionAgeHours(v){
  if(v.ais_age_hours_at_collection !== "" && v.ais_age_hours_at_collection !== undefined){
    const age = Number(v.ais_age_hours_at_collection);
    if(Number.isFinite(age))return age;
  }
  const received = parseUtc(v.position_received_at || v.ais_timestamp_utc);
  const collected = parseUtc(v.collected_at_utc || window.FLEET_DATA.generatedAt);
  if(received && collected)return Math.max(0,(collected-received)/36e5);
  return Infinity;
}
function confidenceMeta(v){
  const age = positionAgeHours(v);
  const freshnessScore =
    age <= 6 ? 70 :
    age <= 24 ? 60 :
    age <= 72 ? 40 :
    age <= 168 ? 20 : 0;
  const consistency = v.source_consistency || (v.position_authority === "review_required" ? "review_required" : "single_public_source");
  const sourceScore = {
    multi_source: 30,
    cross_checked_supplemental: 24,
    single_public_source: 18,
    indexed_snapshot: 8,
    review_required: 0
  }[consistency] ?? 12;
  let score = freshnessScore + sourceScore;
  if(consistency === "review_required")score = Math.min(score,45);
  if(!Number.isFinite(age))score = Math.min(score,35);
  const label = score >= 75 ? "高" : score >= 50 ? "中" : "低";
  const ageText = Number.isFinite(age) ? `${Math.round(age)}h` : "无精确时点";
  const reason = `位置新鲜度 ${ageText}；来源 ${v.source || "unknown"} / ${consistency}`;
  return {score,label,age,reason,consistency};
}
const isStale = v => confidenceMeta(v).label === "低";
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
const freight = window.VLCC_FREIGHT_RATES || {routes:[]};

function formatUpdateTime(value){
  const parsed = parseUtc(value);
  if(!parsed)return {primary:value || "—", detail:"更新时间待核"};
  const beijing = new Intl.DateTimeFormat("zh-CN",{
    timeZone:"Asia/Shanghai",
    year:"numeric",
    month:"2-digit",
    day:"2-digit",
    hour:"2-digit",
    minute:"2-digit",
    hour12:false
  }).format(new Date(parsed)).replace(/\//g,"-");
  return {
    primary:`${beijing} 北京时间`,
    detail:`UTC ${String(value).replace(" UTC","Z")}`
  };
}
const updateTime = formatUpdateTime(window.FLEET_DATA.generatedAt);
document.querySelector("#dataTime").textContent = updateTime.primary;
document.querySelector("#dataTimeDetail").textContent = `${updateTime.detail} · 位置为公开AIS区域级快照`;
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

function greatCirclePoints(v, steps=48){
  const toRad = deg => deg*Math.PI/180;
  const toDeg = rad => rad*180/Math.PI;
  const lat1=toRad(v.lat), lon1=toRad(v.lon), lat2=toRad(v.route_lat), lon2=toRad(v.route_lon);
  const d=2*Math.asin(Math.sqrt(Math.sin((lat2-lat1)/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin((lon2-lon1)/2)**2));
  if(!Number.isFinite(d)||d===0)return [[v.lat,v.lon],[v.route_lat,v.route_lon]];
  const points=[];
  for(let i=0;i<=steps;i++){
    const f=i/steps;
    const a=Math.sin((1-f)*d)/Math.sin(d), b=Math.sin(f*d)/Math.sin(d);
    const x=a*Math.cos(lat1)*Math.cos(lon1)+b*Math.cos(lat2)*Math.cos(lon2);
    const y=a*Math.cos(lat1)*Math.sin(lon1)+b*Math.cos(lat2)*Math.sin(lon2);
    const z=a*Math.sin(lat1)+b*Math.sin(lat2);
    points.push([toDeg(Math.atan2(z,Math.sqrt(x*x+y*y))),toDeg(Math.atan2(y,x))]);
  }
  return points;
}
function addRouteLine(v){
  const options={color:colors[v.derived_load_band],weight:1,opacity:.42,dashArray:"5 6",interactive:false,steps:64};
  const endpoints=[[v.lat,v.lon],[v.route_lat,v.route_lon]];
  if(L.Geodesic){
    return new L.Geodesic(endpoints,options).addTo(routeLayer);
  }
  return L.polyline(greatCirclePoints(v),options).addTo(routeLayer);
}
function markerIcon(v){
  const size = v.derived_load_band === "laden" ? 13 : 10;
  return L.divIcon({className:"",html:`<div class="ship-marker ${isStale(v)?"stale-marker":""}" style="width:${size}px;height:${size}px;background:${colors[v.derived_load_band]};color:${colors[v.derived_load_band]}"></div>`,iconSize:[size,size],iconAnchor:[size/2,size/2]});
}
function visible(v){
  if(activeFilter==="all")return true;
  if(activeFilter==="stale")return confidenceMeta(v).label==="低";
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
      addRouteLine(v);
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
  const confidence=confidenceMeta(v);
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
      <div><span>位置接收</span><b>${v.position_received_at||v.ais_timestamp_utc||"索引快照"}</b></div>
      <div><span>建造 / 载重吨</span><b>${v.build_year||"—"} · ${v.dwt?Math.round(v.dwt/1000)+"k DWT":"—"}</b></div>
      <div><span>来源</span><b>${v.source||"—"}</b></div>
    </div><div class="route-call"><b>${v.broker_status} · ${confidence.label}置信度 / ${confidence.score}分</b><br>${v.broker_rationale}<br><small>${confidence.reason}</small><br><br><b>推断航向：${v.route_name}</b><br>${v.route_note}</div>`;
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
    <div class="trend-note risk"><b>最大的限制是数据时效</b><br>当前${stale}艘为低置信度。只有连续快照后，才能计算真实等待天数、空载航程、航次转换和趋势。</div>
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
const usdK = value => Number.isFinite(Number(value)) ? `$${Math.round(Number(value)/1000)}k` : "—";
function classifyFreightRoute(v){
  const text=[v.area,v.position_area,v.prior_area,v.prior_origin,v.prior_destination,v.calibrated_position,v.analyst_note].join(" ").toLowerCase();
  if(/west africa|south africa|安哥拉|刚果|喀麦隆|尼日利亚|西非|djeno|girassol|kribi/.test(text))return "TD15";
  if(/gulf of mexico|caribbean|north america|south america|美国湾|美湾|科珀斯|巴西|哥伦比亚|圭亚那|加勒比|墨西哥/.test(text))return "TD22";
  if(/middle east|arabian|indian ocean|indian coast|south east asia|east asia|china coast|波斯湾|阿曼湾|阿拉伯|中东|红海|霍尔木兹|印度洋/.test(text))return "TD3C";
  return "OTHER";
}
function routeExposure(){
  const eligible=data.filter(v=>["laden_voyage","part_cargo","active_port","ballast_reposition"].includes(v.commercial_bucket));
  return eligible.reduce((acc,v)=>{
    const route=classifyFreightRoute(v);
    acc[route]=(acc[route]||0)+1;
    return acc;
  },{TD3C:0,TD15:0,TD22:0,OTHER:0});
}
function linkedFreightModel(){
  const exposure=routeExposure();
  const tradeable=freight.routes.filter(r=>r.tradeability==="tradeable");
  const fallback=tradeable.length?tradeable.reduce((sum,r)=>sum+r.tceUsdDay,0)/tradeable.length:90000;
  let nominalSum=0,realizableSum=0,total=0;
  Object.entries(exposure).forEach(([id,count])=>{
    const quote=freight.routes.find(r=>r.id===id);
    const nominal=quote?.tceUsdDay||fallback;
    const realizable=quote?.tradeability==="tradeable"?nominal:fallback;
    nominalSum+=nominal*count;
    realizableSum+=realizable*count;
    total+=count;
  });
  return {exposure,fallback,nominalTce:nominalSum/Math.max(total,1),realizableTce:realizableSum/Math.max(total,1),total};
}
function renderFreightBoard(model){
  const asOf=new Date(`${freight.asOf}T00:00:00Z`);
  const ageDays=Math.max(0,Math.floor((Date.now()-asOf.getTime())/86400000));
  const stale=ageDays>3;
  const sourceLinks=(freight.sourceUrls||[]).map((url,index)=>`<a href="${url}" target="_blank" rel="noopener">${index===0?"航线定义":"Baltic周报"}</a>`).join(" · ");
  document.querySelector("#freightFreshness").className=`freight-freshness ${stale?"stale":""}`;
  document.querySelector("#freightFreshness").innerHTML=`<b>${freight.asOf} · ${stale?"报价待更新":"最新公开快照"}</b>${freight.sourceLabel}<br>${sourceLinks}`;
  document.querySelector("#freightRouteGrid").innerHTML=freight.routes.map(r=>{
    const exposure=model.exposure[r.id]||0;
    const change=Number(r.dayChangePct);
    return `<article class="freight-route">
      <div class="freight-route-head"><span><b>${r.id}</b> · ${r.route}</span><span class="trade-tag ${r.tradeability}">${r.tradeability==="tradeable"?"可成交锚":"名义评估"}</span></div>
      <div class="route-tce">${usdK(r.tceUsdDay)}<small>/天</small></div>
      <div class="route-change ${Number.isFinite(change) ? (change>=0?"up":"down") : ""}">${Number.isFinite(change) ? `${change>=0?"+":""}${change.toFixed(2)}% 变动` : "周报未披露环比"}</div>
      <dl><div><dt>船队暴露</dt><dd>${exposure}艘</dd></div><div><dt>月均</dt><dd>${usdK(r.monthAverageTceUsdDay)}</dd></div><div><dt>前值</dt><dd>${usdK(r.previousTceUsdDay)}</dd></div><div><dt>年内均值</dt><dd>${usdK(r.ytdAverageTceUsdDay)}</dd></div></dl>
      <p>${r.note}</p>
    </article>`;
  }).join("");
  const sensitivity=estimateQuarter(model.realizableTce+10000,.93).companyNet-estimateQuarter(model.realizableTce,.93).companyNet;
  document.querySelector("#freightLinkage").innerHTML=`
    <div class="linkage-metric"><span>名义加权 TCE</span><b>${usdK(model.nominalTce)}/天</b><small>包含 TD3C 名义盘，仅用于观察价格失真。</small></div>
    <div class="linkage-metric"><span>可兑现混合 TCE</span><b>${usdK(model.realizableTce)}/天</b><small>TD3C 以 TD15/TD22 可成交均值替代，进入盈利模型。</small></div>
    <div class="linkage-metric"><span>TCE 每变动 +$10k/天</span><b>+${toYi(sensitivity).toFixed(1)}亿元</b><small>按 53 艘、Q3 92天、93%有效营运天估算。</small></div>`;
}
function renderMarketMonitor(){
  const linked=linkedFreightModel();
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

  renderFreightBoard(linked);
  const scenarios=[
    {name:"悲观",tce:linked.realizableTce*.78,earning:.90,logic:"可成交混合TCE再下调22%"},
    {name:"基准",tce:linked.realizableTce,earning:.93,logic:"按当前航线暴露与可成交报价"},
    {name:"乐观",tce:linked.realizableTce*1.28,earning:.95,logic:"可成交混合TCE上调28%"}
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
    当前船队航线暴露对应的可兑现混合TCE为 ${usdK(linked.realizableTce)}/天；
    TD3C ${usdK(market.td3c_tce_usd_day)}/天名义盘仅展示、不直接计入。基准归母净利约 ${toYi(scenarios[1].companyNet).toFixed(1)} 亿元。`;
}

function renderRows(query=""){
  const q=query.trim().toLowerCase();
  document.querySelector("#fleetRows").innerHTML=data.filter(v=>!q||[v.roster_name,v.current_name,v.imo,v.mmsi,v.area].join(" ").toLowerCase().includes(q)).map(v=>{
    const confidence=confidenceMeta(v);
    return `
    <tr data-imo="${v.imo}">
      <td><b>${v.roster_name}</b>${v.current_name.toUpperCase()!==v.roster_name.toUpperCase()?`<br><small>现名 ${v.current_name}</small>`:""}</td>
      <td><span class="freshness">${v.imo}<br>${v.mmsi}</span></td><td>${v.area}</td><td>${v.draught_m} m</td>
      <td><span class="load-pill" style="color:${colors[v.derived_load_band]}">${v.broker_status}</span></td>
      <td><span class="freshness ${confidence.label==="低"?"old":""}">${confidence.label} / ${confidence.score}<br>${v.position_received_at||v.ais_timestamp_utc||"时间待核"}</span></td><td>${v.route_name}</td>
    </tr>`;
  }).join("");
}
document.querySelector("#search").addEventListener("input",e=>renderRows(e.target.value));
document.querySelector("#fleetRows").addEventListener("click",e=>{
  const row=e.target.closest("tr");if(!row)return;const v=data.find(x=>x.imo===row.dataset.imo);showShip(v);map.flyTo([v.lat,v.lon],4,{duration:.6});
});
renderMap();renderRows();renderHistory();renderMarketMonitor();
