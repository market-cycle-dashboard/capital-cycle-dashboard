let monitorData = null;
let selectedFactor = null;
let currentFrequency = "monthly";

const dataFiles = {
  monthly: "./data/factor_monitor_data.json",
  weekly: "./data/factor_monitor_weekly.json",
};

const els = {
  dataDate: document.getElementById("dataDate"),
  frequencySelect: document.getElementById("frequencySelect"),
  monitorName: document.getElementById("monitorName"),
  factorCount: document.getElementById("factorCount"),
  panelDate: document.getElementById("panelDate"),
  signalDate: document.getElementById("signalDate"),
  groupFilter: document.getElementById("groupFilter"),
  sortKey: document.getElementById("sortKey"),
  searchBox: document.getElementById("searchBox"),
  notes: document.getElementById("notes"),
  visibleCount: document.getElementById("visibleCount"),
  factorRows: document.getElementById("factorRows"),
  detailGroup: document.getElementById("detailGroup"),
  detailTitle: document.getElementById("detailTitle"),
  detailCode: document.getElementById("detailCode"),
  detailDescription: document.getElementById("detailDescription"),
  mRankIc: document.getElementById("mRankIc"),
  mNeutralRankIc: document.getElementById("mNeutralRankIc"),
  mRankIr: document.getElementById("mRankIr"),
  mLongShortLabel: document.getElementById("mLongShortLabel"),
  mLongShort: document.getElementById("mLongShort"),
  mCrowding: document.getElementById("mCrowding"),
  cMvCorr: document.getElementById("cMvCorr"),
  cTurnCorr: document.getElementById("cTurnCorr"),
  cPbSpread: document.getElementById("cPbSpread"),
  cTurnSpread: document.getElementById("cTurnSpread"),
  lineChart: document.getElementById("lineChart"),
  crowdingChart: document.getElementById("crowdingChart"),
  barChart: document.getElementById("barChart"),
  topStockRows: document.getElementById("topStockRows"),
};

const fmt = {
  num(value, digits = 3) {
    return value === null || value === undefined || Number.isNaN(value) ? "-" : Number(value).toFixed(digits);
  },
  pct(value, digits = 1) {
    return value === null || value === undefined || Number.isNaN(value) ? "-" : `${(Number(value) * 100).toFixed(digits)}%`;
  },
  signedPct(value, digits = 1) {
    if (value === null || value === undefined || Number.isNaN(value)) return "-";
    const n = Number(value) * 100;
    return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
  },
};

function toneClass(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "";
  return Number(value) >= 0 ? "pos" : "neg";
}

function riskLabel(score) {
  if (score >= 2) return ["高", "high"];
  if (score === 1) return ["中", "mid"];
  return ["低", "low"];
}

async function loadData(frequency = currentFrequency) {
  currentFrequency = frequency;
  const res = await fetch(dataFiles[frequency], { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`无法加载 ${dataFiles[frequency]}，请先生成对应数据文件`);
  }
  monitorData = await res.json();
  selectedFactor = monitorData.factors[0]?.name;
  initControls();
  render();
}

function initControls() {
  els.dataDate.textContent = `生成 ${monitorData.generated_at}`;
  els.monitorName.textContent = monitorData.monitor_name || "Monitor";
  els.factorCount.textContent = monitorData.factor_count;
  els.panelDate.textContent = monitorData.latest_panel_date;
  els.signalDate.textContent = monitorData.latest_complete_signal_date;
  els.notes.innerHTML = monitorData.notes.map((note) => `<div>${note}</div>`).join("");

  const groups = ["全部", ...new Set(monitorData.factors.map((f) => f.group))];
  els.groupFilter.innerHTML = groups.map((g) => `<option value="${g}">${g}</option>`).join("");
  els.frequencySelect.value = currentFrequency;
}

els.frequencySelect.addEventListener("change", () => loadData(els.frequencySelect.value));
els.groupFilter.addEventListener("change", render);
els.sortKey.addEventListener("change", render);
els.searchBox.addEventListener("input", render);

function filteredFactors() {
  const group = els.groupFilter.value;
  const q = els.searchBox.value.trim().toLowerCase();
  const sortKey = els.sortKey.value;
  return monitorData.factors
    .filter((f) => group === "全部" || f.group === group)
    .filter((f) => !q || `${f.name} ${f.label}`.toLowerCase().includes(q))
    .sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      return Number(bv) - Number(av);
    });
}

function render() {
  const rows = filteredFactors();
  els.visibleCount.textContent = `${rows.length} 个`;
  if (!rows.some((f) => f.name === selectedFactor)) {
    selectedFactor = rows[0]?.name || monitorData.factors[0]?.name;
  }
  renderRows(rows);
  renderDetail(selectedFactor);
}

function renderRows(rows) {
  els.factorRows.innerHTML = rows
    .map((f) => {
      const [risk, riskClass] = riskLabel(f.crowding_score);
      return `
        <tr class="${f.name === selectedFactor ? "active" : ""}" data-factor="${f.name}">
          <td>
            <div class="factor-name">
              <strong>${f.label}</strong>
              <span>${f.name}</span>
            </div>
          </td>
          <td>${f.group}</td>
          <td class="${toneClass(f.rank_ic_mean)}">${fmt.num(f.rank_ic_mean, 3)}</td>
          <td class="${toneClass(f.size_neutral_rank_ic_mean)}">${fmt.num(f.size_neutral_rank_ic_mean, 3)}</td>
          <td>${fmt.num(f.rank_ic_ir, 2)}</td>
          <td class="${toneClass(f.recent_3m_rank_ic)}">${fmt.num(f.recent_3m_rank_ic, 3)}</td>
          <td class="${toneClass(f.long_short_mean)}">${fmt.signedPct(f.long_short_mean, 1)}</td>
          <td><span class="risk ${riskClass}">${risk}</span></td>
        </tr>
      `;
    })
    .join("");
  els.factorRows.querySelectorAll("tr").forEach((tr) => {
    tr.addEventListener("click", () => {
      selectedFactor = tr.dataset.factor;
      render();
    });
  });
}

function renderDetail(name) {
  const f = monitorData.factors.find((row) => row.name === name);
  if (!f) return;
  const detail = monitorData.details[name];
  const [risk] = riskLabel(f.crowding_score);
  els.detailGroup.textContent = f.group;
  els.detailTitle.textContent = f.label;
  els.detailCode.textContent = f.name;
  els.detailDescription.textContent = f.description;
  els.mRankIc.textContent = fmt.num(f.rank_ic_mean, 3);
  els.mNeutralRankIc.textContent = fmt.num(f.size_neutral_rank_ic_mean, 3);
  els.mRankIr.textContent = fmt.num(f.rank_ic_ir, 2);
  els.mLongShortLabel.textContent = `${monitorData.period_name || "下期"}多空均值`;
  els.mLongShort.textContent = fmt.signedPct(f.long_short_mean, 1);
  els.mCrowding.textContent = `${risk} / ${f.crowding_score}`;
  els.cMvCorr.textContent = fmt.num(f.mv_rank_corr_recent, 2);
  els.cTurnCorr.textContent = fmt.num(f.turn_rank_corr_recent, 2);
  els.cPbSpread.textContent = fmt.num(f.crowding?.pb_spread, 2);
  els.cTurnSpread.textContent = fmt.num(f.crowding?.turn_spread, 2);
  renderLineChart(detail);
  renderBarChart(detail);
  renderCrowdingChart(detail);
  renderTopStocks(detail);
}

function scale(values, minPx, maxPx) {
  const clean = values.filter((v) => v !== null && v !== undefined && !Number.isNaN(v));
  const min = Math.min(...clean, 0);
  const max = Math.max(...clean, 0);
  const span = max - min || 1;
  return (value) => maxPx - ((value - min) / span) * (maxPx - minPx);
}

function renderLineChart(detail) {
  const ic = detail.ic_by_month.map((row) => ({ date: row.end_date, value: row.rank_ic }));
  const ls = detail.long_short_by_month.map((row) => ({ date: row.end_date, value: row.q5_minus_q1 }));
  const dates = ic.map((row) => row.date);
  const width = 760;
  const height = 260;
  const pad = { left: 36, right: 18, top: 18, bottom: 34 };
  const xStep = dates.length > 1 ? (width - pad.left - pad.right) / (dates.length - 1) : 1;
  const y = scale([...ic.map((d) => d.value), ...ls.map((d) => d.value)], pad.top, height - pad.bottom);
  const x = (i) => pad.left + i * xStep;
  const zeroY = y(0);

  const pathFor = (items) =>
    items
      .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.value ?? 0).toFixed(1)}`)
      .join(" ");

  const icDots = ic.map((d, i) => `<circle class="dot-ic" cx="${x(i)}" cy="${y(d.value ?? 0)}" r="3" />`).join("");
  const lsDots = ls.map((d, i) => `<circle class="dot-ls" cx="${x(i)}" cy="${y(d.value ?? 0)}" r="3" />`).join("");
  const labels = dates
    .filter((_, i) => i === 0 || i === dates.length - 1)
    .map((date, i, arr) => {
      const idx = i === 0 ? 0 : dates.length - 1;
      return `<text x="${x(idx)}" y="${height - 10}" text-anchor="${i === 0 ? "start" : "end"}" fill="#647067" font-size="11">${date.slice(0, 7)}</text>`;
    })
    .join("");

  els.lineChart.innerHTML = `
    <line class="axis" x1="${pad.left}" x2="${width - pad.right}" y1="${zeroY}" y2="${zeroY}" />
    <path class="line-ic" d="${pathFor(ic)}" />
    <path class="line-ls" d="${pathFor(ls)}" />
    ${icDots}
    ${lsDots}
    ${labels}
    <text x="${pad.left}" y="14" fill="#1d6f5f" font-size="12">RankIC</text>
    <text x="${pad.left + 68}" y="14" fill="#8b5e34" font-size="12">Q5-Q1</text>
  `;
}

function renderBarChart(detail) {
  const rows = detail.quintile_summary;
  const values = rows.map((r) => r.avg_next_ret ?? 0);
  const maxAbs = Math.max(...values.map((v) => Math.abs(v)), 0.001);
  els.barChart.innerHTML = rows
    .map((row) => {
      const val = row.avg_next_ret ?? 0;
      const h = Math.max(4, (Math.abs(val) / maxAbs) * 104);
      return `
        <div class="bar-item">
          <div>${fmt.signedPct(val, 1)}</div>
          <div class="bar ${val < 0 ? "neg" : ""}" style="height:${h}px"></div>
          <div>Q${Number(row.q).toFixed(0)}</div>
        </div>
      `;
    })
    .join("");
}

function renderCrowdingChart(detail) {
  const items = detail.crowding_by_period || [];
  const pb = items.map((row) => ({ date: row.end_date, value: row.pb_spread }));
  const turn = items.map((row) => ({ date: row.end_date, value: row.turn_spread }));
  const mv = items.map((row) => ({ date: row.end_date, value: row.mv_ratio === null || row.mv_ratio === undefined ? null : Math.log(row.mv_ratio) }));
  const dates = items.map((row) => row.end_date);
  const width = 760;
  const height = 220;
  const pad = { left: 36, right: 18, top: 18, bottom: 34 };
  if (!items.length) {
    els.crowdingChart.innerHTML = `<text x="36" y="40" fill="#647067" font-size="12">暂无拥挤度趋势</text>`;
    return;
  }
  const xStep = dates.length > 1 ? (width - pad.left - pad.right) / (dates.length - 1) : 1;
  const y = scale([...pb.map((d) => d.value), ...turn.map((d) => d.value), ...mv.map((d) => d.value)], pad.top, height - pad.bottom);
  const x = (i) => pad.left + i * xStep;
  const zeroY = y(0);
  const pathFor = (series) =>
    series
      .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.value ?? 0).toFixed(1)}`)
      .join(" ");
  const labels = dates
    .filter((_, i) => i === 0 || i === dates.length - 1)
    .map((date, i) => {
      const idx = i === 0 ? 0 : dates.length - 1;
      return `<text x="${x(idx)}" y="${height - 10}" text-anchor="${i === 0 ? "start" : "end"}" fill="#647067" font-size="11">${date.slice(0, 7)}</text>`;
    })
    .join("");

  els.crowdingChart.innerHTML = `
    <line class="axis" x1="${pad.left}" x2="${width - pad.right}" y1="${zeroY}" y2="${zeroY}" />
    <path class="line-ic" d="${pathFor(pb)}" />
    <path class="line-ls" d="${pathFor(turn)}" />
    <path class="line-mv" d="${pathFor(mv)}" />
    ${labels}
    <text x="${pad.left}" y="14" fill="#1d6f5f" font-size="12">PB差</text>
    <text x="${pad.left + 52}" y="14" fill="#8b5e34" font-size="12">换手差</text>
    <text x="${pad.left + 120}" y="14" fill="#5f668c" font-size="12">log市值比</text>
  `;
}

function renderTopStocks(detail) {
  const rows = detail.top_stocks || [];
  if (!rows.length) {
    els.topStockRows.innerHTML = `<tr><td colspan="5" class="empty-cell">暂无最新因子值</td></tr>`;
    return;
  }
  els.topStockRows.innerHTML = rows
    .map((row) => `
      <tr>
        <td>${row.stock_code}</td>
        <td>${fmt.num(row.raw_factor, 3)}</td>
        <td>${fmt.num(row.pb, 2)}</td>
        <td>${fmt.num(row.pe, 1)}</td>
        <td>${fmt.num(row.turn, 2)}</td>
      </tr>
    `)
    .join("");
}

loadData().catch((err) => {
  document.body.innerHTML = `<pre style="padding:24px;color:#b34040">加载失败：${err.message}</pre>`;
});
