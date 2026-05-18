import fs from "node:fs/promises";
import path from "node:path";

const series = {
  WALCL: "Assets: Total Assets: Total Assets (Less Eliminations from Consolidation)",
  WTREGEN: "U.S. Treasury General Account",
  RRPONTSYD: "Overnight Reverse Repurchase Agreements",
  RESBALNS: "Reserve Balances with Federal Reserve Banks",
  SOFR: "Secured Overnight Financing Rate",
  IORB: "Interest Rate on Reserve Balances",
  DTWEXBGS: "Nominal Broad U.S. Dollar Index"
};

const startDate = "2015-01-01";

async function fetchFredCsv(id) {
  const cachePath = path.join("data", "liquidity", `${id}.csv`);
  let text;
  try {
    text = await fs.readFile(cachePath, "utf8");
  } catch {
    const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FRED ${id} failed: ${res.status}`);
    text = await res.text();
  }
  const rows = text.trim().split(/\r?\n/).slice(1);
  return rows
    .map(line => {
      const [date, raw] = line.split(",");
      const value = raw && raw !== "." ? Number(raw) : null;
      return { date, value: Number.isFinite(value) ? value : null };
    })
    .filter(row => row.date >= startDate && row.value !== null);
}

function latestOnOrBefore(rows, date, cursor) {
  while (cursor.index + 1 < rows.length && rows[cursor.index + 1].date <= date) {
    cursor.index += 1;
  }
  return cursor.index >= 0 ? rows[cursor.index].value : null;
}

function rollingStats(values, index, lookback = 104) {
  const start = Math.max(0, index - lookback + 1);
  const sample = values.slice(start, index + 1).filter(Number.isFinite);
  if (sample.length < 12) return { mean: 0, std: 1 };
  const mean = sample.reduce((sum, v) => sum + v, 0) / sample.length;
  const variance = sample.reduce((sum, v) => sum + (v - mean) ** 2, 0) / sample.length;
  return { mean, std: Math.sqrt(variance) || 1 };
}

function zScore(values, index, lookback = 104) {
  const { mean, std } = rollingStats(values, index, lookback);
  return (values[index] - mean) / std;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function stateFromScore(score) {
  if (score >= 65) return "宽松扩散";
  if (score >= 52) return "温和宽松";
  if (score >= 42) return "中性震荡";
  if (score >= 30) return "抽水收缩";
  return "压力显性化";
}

const raw = {};
for (const id of Object.keys(series)) {
  raw[id] = await fetchFredCsv(id);
}

const weeklyDates = raw.WALCL.map(row => row.date);
const cursors = Object.fromEntries(Object.keys(series).map(id => [id, { index: -1 }]));
const aligned = weeklyDates.map(date => {
  const row = { date };
  for (const id of Object.keys(series)) {
    row[id] = latestOnOrBefore(raw[id], date, cursors[id]);
  }
  return row;
}).filter(row => row.WALCL && row.WTREGEN && row.RRPONTSYD !== null && row.RESBALNS);

const baseRows = aligned.map(row => {
  const fedAssets = row.WALCL / 1000;
  const tga = row.WTREGEN / 1000;
  const rrp = row.RRPONTSYD;
  const reserves = row.RESBALNS;
  const netLiquidity = fedAssets - tga - rrp;
  const sofrIorb = row.SOFR !== null && row.IORB !== null ? row.SOFR - row.IORB : null;
  return {
    date: row.date,
    fedAssets,
    tga,
    rrp,
    reserves,
    netLiquidity,
    dollarIndex: row.DTWEXBGS,
    sofrIorb
  };
});

const deltas13 = key => baseRows.map((row, index) => {
  const previous = baseRows[index - 13];
  if (!previous || !Number.isFinite(row[key]) || !Number.isFinite(previous[key])) return 0;
  return row[key] - previous[key];
});

const netDelta = deltas13("netLiquidity");
const reserveDelta = deltas13("reserves");
const tgaDelta = deltas13("tga");
const rrpLevel = baseRows.map(row => row.rrp);
const dollarDelta = deltas13("dollarIndex");
const sofrSpread = baseRows.map(row => Number.isFinite(row.sofrIorb) ? row.sofrIorb : 0);

const outputRows = baseRows.map((row, index) => {
  const impulse =
    0.35 * zScore(netDelta, index) +
    0.25 * zScore(reserveDelta, index) -
    0.15 * zScore(tgaDelta, index) +
    0.10 * zScore(rrpLevel, index) -
    0.10 * zScore(dollarDelta, index) -
    0.05 * zScore(sofrSpread, index);
  const score = Math.round(clamp(50 + impulse * 10, 0, 100));
  const pressure = Math.round(clamp(100 - score, 0, 100));
  return {
    date: row.date,
    score,
    pressure,
    state: stateFromScore(score),
    netLiquidity: Number(row.netLiquidity.toFixed(1)),
    fedAssets: Number(row.fedAssets.toFixed(1)),
    tga: Number(row.tga.toFixed(1)),
    rrp: Number(row.rrp.toFixed(1)),
    reserves: Number(row.reserves.toFixed(1)),
    dollarIndex: row.dollarIndex ? Number(row.dollarIndex.toFixed(2)) : null,
    sofrIorb: row.sofrIorb !== null ? Number(row.sofrIorb.toFixed(3)) : null
  };
});

const latest = outputRows.at(-1);
const payload = {
  updatedAt: new Date().toISOString().slice(0, 10),
  source: "FRED public CSV",
  model: {
    name: "Dollar Liquidity Pipe Score",
    description: "0-100 score. Higher means liquidity is more supportive for risk assets; lower means the system is closer to funding pressure.",
    weights: {
      netLiquidityMomentum: 0.35,
      reserveMomentum: 0.25,
      tgaDrain: -0.15,
      rrpBuffer: 0.10,
      dollarTightening: -0.10,
      sofrIorbSpread: -0.05
    }
  },
  series,
  latest,
  history: outputRows
};

await fs.writeFile(
  "liquidity-data.js",
  `window.LIQUIDITY_PIPE_DATA = ${JSON.stringify(payload, null, 2)};\n`,
  "utf8"
);

console.log(`wrote liquidity-data.js with ${outputRows.length} weekly observations, latest ${latest.date}`);
