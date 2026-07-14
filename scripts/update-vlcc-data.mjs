import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const snapshotDir = path.join(root, "vlcc", "snapshots");
const fleetDataPath = path.join(root, "vlcc", "fleet-map-data.js");
const freightJsPath = path.join(root, "vlcc", "freight-rates.js");
const dataDir = path.join(root, "data", "vlcc");
const localCsvPath = path.join(dataDir, "latest-observations.csv");
const localJsonPath = path.join(dataDir, "latest-observations.json");
const baselinePath = path.join(dataDir, "history-baselines.json");
const marketPath = path.join(dataDir, "market.json");
const freightJsonPath = path.join(dataDir, "freight-rates.json");
const dispatchOverridesPath = path.join(dataDir, "dispatch-overrides.json");

const COMMERCIAL_BUCKETS = new Set([
  "laden_voyage",
  "part_cargo",
  "active_port",
  "ballast_reposition",
  "waiting_loading",
  "waiting_orders",
  "yard_repair",
  "unknown"
]);

const AREA_CENTERS = {
  "China Coast": [121.0, 28.0],
  "East Asia": [130.0, 31.0],
  "South East Asia": [104.0, 2.5],
  "Indonesia": [109.0, -6.0],
  "Indian Ocean": [70.0, -8.0],
  "Indian Coast": [78.0, 14.0],
  "East Africa": [45.0, -5.0],
  "West Africa": [3.0, 1.0],
  "South Africa": [22.0, -33.0],
  "Red Sea": [39.0, 18.0],
  "Middle East Gulf": [52.0, 25.0],
  "Arabian Sea": [61.0, 17.0],
  "Caribbean Sea": [-68.0, 15.0],
  "Gulf of Mexico": [-94.0, 28.0],
  "South America East Coast": [-42.0, -23.0],
  "North America West Coast": [-123.0, 35.0],
  "West Mediterranean": [5.0, 38.0],
  "North East Atlantic Ocean": [-20.0, 35.0]
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function readFleetDataJs() {
  const raw = fs.readFileSync(fleetDataPath, "utf8")
    .replace(/^window\.FLEET_DATA\s*=\s*/, "")
    .replace(/;\s*$/, "");
  return JSON.parse(raw);
}

function writeFleetDataJs(data) {
  if (fs.existsSync(fleetDataPath)) {
    const existing = readFleetDataJs();
    if (JSON.stringify(existing) === JSON.stringify(data)) return;
  }
  fs.writeFileSync(fleetDataPath, `window.FLEET_DATA = ${JSON.stringify(data)};\n`);
}

function writeFreightRatesJs(data) {
  if (fs.existsSync(freightJsPath)) {
    const existing = readFreightRatesJs();
    if (existing && JSON.stringify(existing) === JSON.stringify(data)) return;
  }
  fs.writeFileSync(freightJsPath, `window.VLCC_FREIGHT_RATES = ${JSON.stringify(data, null, 2)};\n`);
}

function readFreightRatesJs() {
  try {
    const window = {};
    Function("window", fs.readFileSync(freightJsPath, "utf8"))(window);
    return window.VLCC_FREIGHT_RATES || null;
  } catch {
    return null;
  }
}

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [headers, ...body] = rows.filter(r => r.some(cell => cell.trim()));
  if (!headers) return [];
  return body.map(values => Object.fromEntries(headers.map((h, index) => [h.trim(), (values[index] ?? "").trim()])));
}

async function loadObservationFeed() {
  if (process.env.VLCC_OBSERVATIONS_URL) {
    const response = await fetch(process.env.VLCC_OBSERVATIONS_URL);
    if (!response.ok) {
      throw new Error(`Observation feed failed: ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    return processObservationText(text, process.env.VLCC_OBSERVATIONS_URL);
  }
  if (fs.existsSync(localJsonPath)) {
    return processObservationText(fs.readFileSync(localJsonPath, "utf8"), localJsonPath);
  }
  if (fs.existsSync(localCsvPath)) {
    return processObservationText(fs.readFileSync(localCsvPath, "utf8"), localCsvPath);
  }
  return null;
}

function processObservationText(text, sourceName) {
  const trimmed = text.trim();
  const payload = trimmed.startsWith("[") || trimmed.startsWith("{")
    ? JSON.parse(trimmed)
    : parseCsv(trimmed);
  const vessels = Array.isArray(payload) ? payload : payload.vessels;
  if (!Array.isArray(vessels)) {
    throw new Error(`Observation feed ${sourceName} must be a CSV, an array, or an object with vessels[]`);
  }
  const snapshotAt = Array.isArray(payload) ? null : payload.snapshot_at || payload.generatedAt || payload.created_at || null;
  return {snapshotAt, sourceName, vessels};
}

function loadDispatchOverrides() {
  if (!fs.existsSync(dispatchOverridesPath)) return {asOf: "", source: "", overridesByImo: new Map(), unmatched: []};
  const payload = readJson(dispatchOverridesPath);
  const records = Array.isArray(payload) ? payload : payload.vessels || [];
  const overridesByImo = new Map();
  for (const record of records) {
    const imo = String(record.imo || "").trim();
    if (!imo) continue;
    overridesByImo.set(imo, record);
  }
  return {
    asOf: Array.isArray(payload) ? "" : payload.as_of || "",
    source: Array.isArray(payload) ? "" : payload.source || "",
    overridesByImo,
    unmatched: Array.isArray(payload) ? [] : payload.unmatched || []
  };
}

function listSnapshotFiles() {
  return fs.readdirSync(snapshotDir)
    .filter(name => /^\d{4}-\d{2}-\d{2}-\d{4}\.json$/.test(name))
    .sort()
    .map(name => path.join(snapshotDir, name));
}

function parseUtc(value) {
  if (!value) return null;
  const normalized = String(value).replace(" UTC", "Z");
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? new Date(parsed) : null;
}

function formatUtc(date) {
  const pad = value => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

function snapshotFileName(date) {
  const pad = value => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}.json`;
}

function inferArea(positionArea = "") {
  const cleaned = String(positionArea).replace(/^at\s+/i, "").trim();
  if (!cleaned) return "Unknown";
  if (AREA_CENTERS[cleaned]) return cleaned;
  const lower = cleaned.toLowerCase();
  if (lower.includes("china coast")) return "China Coast";
  if (lower.includes("south east asia")) return "South East Asia";
  if (lower.includes("east asia")) return "East Asia";
  if (lower.includes("west africa")) return "West Africa";
  if (lower.includes("south africa")) return "South Africa";
  if (lower.includes("east africa")) return "East Africa";
  if (lower.includes("indian coast")) return "Indian Coast";
  if (lower.includes("indian ocean")) return "Indian Ocean";
  if (lower.includes("caribbean")) return "Caribbean Sea";
  if (lower.includes("gulf of mexico")) return "Gulf of Mexico";
  if (lower.includes("south america")) return "South America East Coast";
  if (lower.includes("north america west")) return "North America West Coast";
  if (lower.includes("west mediterranean")) return "West Mediterranean";
  if (lower.includes("north east atlantic")) return "North East Atlantic Ocean";
  if (lower.includes("red sea")) return "Red Sea";
  if (lower.includes("arabian") || lower.includes("middle east")) return "Middle East Gulf";
  return cleaned;
}

function hashOffset(seed, scale) {
  let hash = 0;
  for (const ch of String(seed)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return ((hash % 1000) / 1000 - 0.5) * scale;
}

function positionFor(vessel) {
  const area = inferArea(vessel.area || vessel.position_area);
  if (Number.isFinite(Number(vessel.lon)) && Number.isFinite(Number(vessel.lat))) {
    return {area, lon: Number(vessel.lon), lat: Number(vessel.lat)};
  }
  const [lon, lat] = AREA_CENTERS[area] || [0, 0];
  return {
    area,
    lon: Number((lon + hashOffset(vessel.imo, 5)).toFixed(3)),
    lat: Number((lat + hashOffset(`${vessel.imo}:lat`, 4)).toFixed(3))
  };
}

function loadBand(vessel) {
  if (["laden", "part_laden", "ballast"].includes(vessel.derived_load_band)) return vessel.derived_load_band;
  const draught = Number(vessel.draught_m);
  if (!Number.isFinite(draught)) return "ballast";
  if (draught >= 18) return "laden";
  if (draught >= 12.5) return "part_laden";
  return "ballast";
}

function isFresh(vessel, limitHours = 72) {
  const age = Number(vessel.ais_age_hours_at_collection);
  if (Number.isFinite(age)) return age <= limitHours;
  const received = parseUtc(vessel.position_received_at || vessel.ais_timestamp_utc);
  const collected = parseUtc(vessel.collected_at_utc || vessel.position_collected_at);
  if (!received || !collected) return false;
  return (collected - received) / 36e5 <= limitHours;
}

function inferCommercialBucket(vessel) {
  if (COMMERCIAL_BUCKETS.has(vessel.commercial_bucket)) return vessel.commercial_bucket;
  if (vessel.is_yard_repair || /yard|repair|坞修|维修|\(修\)|（修）/i.test([vessel.dispatch_status, vessel.voyage_destination, vessel.broker_status, vessel.analyst_note].join(" "))) {
    return "yard_repair";
  }
  const band = loadBand(vessel);
  const status = vessel.navigation_status || "";
  if (band === "laden" && ["At anchor", "Moored"].includes(status)) return "active_port";
  if (band === "laden") return "laden_voyage";
  if (band === "part_laden") return "part_cargo";
  if (["At anchor", "Moored"].includes(status)) {
    const area = inferArea(vessel.area || vessel.position_area);
    return ["West Africa", "Gulf of Mexico", "Caribbean Sea", "Middle East Gulf"].includes(area)
      ? "waiting_loading"
      : "waiting_orders";
  }
  if (!isFresh(vessel)) return "unknown";
  return "ballast_reposition";
}

function routeFor(vessel) {
  if (vessel.route_name && Number.isFinite(Number(vessel.route_lon)) && Number.isFinite(Number(vessel.route_lat))) {
    return {
      route_lon: Number(vessel.route_lon),
      route_lat: Number(vessel.route_lat),
      route_name: vessel.route_name,
      route_note: vessel.route_note || ""
    };
  }
  if (vessel.voyage_destination || vessel.voyage_origin || vessel.voyage_eta) {
    const destination = vessel.voyage_destination || vessel.dispatch_pool || "目的港待核";
    const origin = vessel.voyage_origin || "始发港待核";
    const eta = vessel.voyage_eta ? `，ETA ${vessel.voyage_eta}` : "";
    let route_lon = 52.0;
    let route_lat = 25.0;
    if (/singapore|新加坡|malacca|马六甲/i.test(destination)) [route_lon, route_lat] = [104.0, 1.3];
    if (/yanbu|延布|red sea|红海/i.test(destination)) [route_lon, route_lat] = [38.1, 24.1];
    if (/fujairah|富查伊拉|fahle|费赫勒|oman|阿曼/i.test(destination)) [route_lon, route_lat] = [56.3, 25.1];
    if (/galveston|loop|美湾|gulf of mexico|科珀斯|卢普/i.test(destination)) [route_lon, route_lat] = [-94.0, 28.0];
    if (/panama|巴拿马/i.test(destination)) [route_lon, route_lat] = [-79.5, 9.0];
    if (/angola|安哥拉|congo|刚果|as su|阿苏|brazil|巴西/i.test(destination)) [route_lon, route_lat] = [5.0, 0.5];
    if (/ningbo|dalian|tianjin|huizhou|qinzhou|lanshan|china|中国|宁波|大连|天津|惠州|钦州|岚山|湄洲湾/i.test(destination)) [route_lon, route_lat] = [121.5, 29.0];
    if (/japan|korea|malaysia|thailand|indonesia|日本|韩国|马来|泰国|印尼/i.test(destination)) [route_lon, route_lat] = [104.0, 2.5];
    return {
      route_lon,
      route_lat,
      route_name: destination,
      route_note: `${origin} -> ${destination}${eta}; dispatch override, higher precision than region-level public AIS.`
    };
  }
  const band = loadBand(vessel);
  const text = [vessel.area, vessel.position_area, vessel.prior_area, vessel.prior_origin, vessel.prior_destination, vessel.calibrated_position, vessel.analyst_note]
    .join(" ")
    .toLowerCase();
  if (band === "laden") {
    return {route_lon: 121.5, route_lat: 29.0, route_name: "中国卸港", route_note: "重载东行，推断驶往亚洲卸港"};
  }
  if (/gulf of mexico|caribbean|north america|south america|美国湾|美湾|科珀斯|巴西|哥伦比亚|加勒比|墨西哥/.test(text)) {
    return {route_lon: -94.0, route_lat: 28.0, route_name: "美湾装港", route_note: "空载/待装，推断进入美湾装货管道"};
  }
  if (/west africa|south africa|安哥拉|刚果|喀麦隆|尼日利亚|西非|djeno|girassol|kribi/.test(text)) {
    return {route_lon: 5.0, route_lat: 0.5, route_name: "西非装港", route_note: "空载/待装，推断进入西非装货管道"};
  }
  return {route_lon: 52.0, route_lat: 25.0, route_name: "中东装港", route_note: "空载西行，推断赴中东装港"};
}

function brokerStatus(vessel) {
  if (vessel.broker_status) return vessel.broker_status;
  const bucket = inferCommercialBucket(vessel);
  if (bucket === "yard_repair") return "在修/坞修";
  return {
    laden_voyage: "载货航次",
    active_port: "港口作业/待泊",
    part_cargo: "部分载货/专线作业",
    ballast_reposition: "空载调位",
    waiting_loading: "装港候货",
    waiting_orders: "可用运力/等指令",
    unknown: "状态过期待核"
  }[bucket];
}

function brokerRationale(vessel) {
  if (vessel.broker_rationale) return vessel.broker_rationale;
  const bucket = inferCommercialBucket(vessel);
  if (bucket === "yard_repair") return "调度口径标记为修船或坞修，不计入可经营运力。";
  if (bucket === "unknown") return "公开AIS超过72小时或缺少精确时点，不能可靠区分空放、候货或港口停留。";
  if (bucket === "laden_voyage") return "吃水达到重载区间，商业上视为收入航段；AIS过旧时需复核。";
  if (bucket === "active_port") return "重载且停泊/系泊，通常处于卸货、待泊或码头作业阶段。";
  if (bucket === "part_cargo") return "中间吃水不宜简单视为空载，可能是部分载货、穿梭或压载调整。";
  if (bucket === "ballast_reposition") return "空载在航是下一航次的必要压载段，属于运营中，但不直接产生运费。";
  return "空载停泊，偏向候货、补给、等待装港或等待商业指令。";
}

function normalizeVessel(base, update, snapshotAt) {
  const merged = {...base, ...update};
  const hasObservationUpdate = [
    "position_area",
    "draught_m",
    "navigation_status",
    "ais_timestamp_utc",
    "position_received_at",
    "ais_age_hours_at_collection"
  ].some(key => Object.hasOwn(update, key));
  if (hasObservationUpdate && !Object.hasOwn(update, "derived_load_band")) delete merged.derived_load_band;
  if (hasObservationUpdate && !Object.hasOwn(update, "commercial_bucket")) delete merged.commercial_bucket;
  if (hasObservationUpdate && !Object.hasOwn(update, "broker_status")) delete merged.broker_status;
  if (hasObservationUpdate && !Object.hasOwn(update, "broker_rationale")) delete merged.broker_rationale;
  if (hasObservationUpdate && !Object.hasOwn(update, "assessment_confidence")) delete merged.assessment_confidence;
  if (hasObservationUpdate && !Object.hasOwn(update, "area")) delete merged.area;
  if (hasObservationUpdate && !Object.hasOwn(update, "lon")) delete merged.lon;
  if (hasObservationUpdate && !Object.hasOwn(update, "lat")) delete merged.lat;
  if (hasObservationUpdate && !Object.hasOwn(update, "route_name")) delete merged.route_name;
  if (hasObservationUpdate && !Object.hasOwn(update, "route_note")) delete merged.route_note;
  if (hasObservationUpdate && !Object.hasOwn(update, "route_lon")) delete merged.route_lon;
  if (hasObservationUpdate && !Object.hasOwn(update, "route_lat")) delete merged.route_lat;
  if (base?.roster_name) merged.roster_name = base.roster_name;
  if (base?.build_year) merged.build_year = base.build_year;
  if (base?.dwt) merged.dwt = base.dwt;
  if (base?.flag) merged.flag = base.flag;
  if (base?.source_consistency && !update.source_consistency) merged.source_consistency = base.source_consistency;
  if (base?.position_authority && !update.position_authority) merged.position_authority = base.position_authority;
  merged.imo = String(merged.imo || "").trim();
  merged.current_name = merged.current_name || merged.roster_name;
  merged.draught_m = merged.draught_m === undefined || merged.draught_m === null ? "" : String(merged.draught_m);
  merged.derived_load_band = loadBand(merged);
  merged.commercial_bucket = inferCommercialBucket(merged);
  merged.broker_status = brokerStatus(merged);
  merged.broker_rationale = brokerRationale(merged);
  merged.collected_at_utc = merged.collected_at_utc || snapshotAt;
  merged.position_collected_at = merged.position_collected_at || parseUtc(snapshotAt)?.toISOString() || "";
  merged.source = merged.source || "manual/public AIS";
  merged.source_consistency = merged.source_consistency || "single_public_source";
  const pos = positionFor(merged);
  Object.assign(merged, pos, routeFor(merged));
  return merged;
}

function applyDispatchOverride(vessel, override, snapshotAt) {
  if (!override) return vessel;
  const update = {
    ...override,
    imo: vessel.imo,
    roster_name: vessel.roster_name,
    current_name: vessel.current_name
  };
  if (!update.source) update.source = "dispatch override + public AIS";
  if (!update.source_consistency) update.source_consistency = "multi_source";
  if (!update.position_authority) update.position_authority = "dispatch_calibrated";
  return normalizeVessel(vessel, update, snapshotAt);
}

function snapshotMetrics(snapshot, labelOverride) {
  const vessels = snapshot.vessels;
  const coverage = vessels.length;
  const count = key => vessels.filter(v => v.derived_load_band === key).length;
  const waiting = vessels.filter(v => ["waiting_loading", "waiting_orders"].includes(v.commercial_bucket)).length;
  const operating = vessels.filter(v => ["laden_voyage", "part_cargo", "active_port", "ballast_reposition"].includes(v.commercial_bucket)).length;
  const revenue = vessels.filter(v => v.commercial_bucket === "laden_voyage" || (v.commercial_bucket === "active_port" && v.derived_load_band === "laden")).length;
  const stale = vessels.filter(v => !isFresh(v) || v.source_consistency === "review_required" || v.source_consistency === "indexed_snapshot").length;
  const date = snapshot.snapshot_at || snapshot.generatedAt || snapshot.created_at;
  const parsed = parseUtc(date);
  const pad = value => String(value).padStart(2, "0");
  const label = labelOverride || (parsed
    ? `${pad(parsed.getUTCMonth() + 1)}月${pad(parsed.getUTCDate())}日 ${pad(parsed.getUTCHours())}:${pad(parsed.getUTCMinutes())}`
    : date);
  return {
    date: date.replace(" UTC", ""),
    label,
    coverage,
    laden: count("laden"),
    part_laden: count("part_laden"),
    ballast: count("ballast"),
    yard: vessels.filter(v => v.commercial_bucket === "yard_repair" || /yard|repair|坞修|维修/i.test([v.navigation_status, v.position_area, v.area, v.voyage_destination, v.dispatch_status].join(" "))).length,
    commercial_rate: Math.round(operating / Math.max(coverage, 1) * 100),
    revenue_rate: Math.round(revenue / Math.max(coverage, 1) * 100),
    waiting,
    confidence: stale / Math.max(coverage, 1) > 0.4 ? "low" : "medium",
    comparability: "同一53艘、同一规则的定时公开AIS快照"
  };
}

function buildHistory(enrichmentByImo, dispatch) {
  const baselines = fs.existsSync(baselinePath) ? readJson(baselinePath) : [];
  const fullSnapshots = listSnapshotFiles().map(readJson).map(snapshot => {
    const snapshotDate = parseUtc(snapshot.snapshot_at || snapshot.generatedAt || snapshot.created_at);
    const dispatchDate = parseUtc(dispatch.asOf);
    const shouldApplyDispatch = dispatchDate && snapshotDate && snapshotDate >= dispatchDate;
    const normalized = {
      ...snapshot,
      vessels: snapshot.vessels.map(v => {
        const base = normalizeVessel(enrichmentByImo.get(String(v.imo)) || v, v, snapshot.snapshot_at || snapshot.created_at);
        return shouldApplyDispatch
          ? applyDispatchOverride(base, dispatch.overridesByImo.get(String(v.imo)), snapshot.snapshot_at || snapshot.created_at)
          : base;
      })
    };
    return snapshotMetrics(normalized);
  });
  return [...baselines, ...fullSnapshots];
}

function validateFleet(vessels) {
  const imos = vessels.map(v => v.imo);
  const unique = new Set(imos);
  if (vessels.length !== 53) throw new Error(`Expected 53 VLCC vessels, got ${vessels.length}`);
  if (unique.size !== vessels.length) throw new Error("Duplicate IMO values found in VLCC vessels");
  const missing = vessels.filter(v => !v.roster_name || !v.imo || !v.derived_load_band || !v.commercial_bucket);
  if (missing.length) throw new Error(`Missing required normalized fields for ${missing.length} vessels`);
}

function validateMapConsistency(vessels) {
  const issues = vessels.flatMap(vessel => {
    const area = inferArea(vessel.area || vessel.position_area);
    const center = AREA_CENTERS[area];
    const lon = Number(vessel.lon);
    const lat = Number(vessel.lat);
    const vesselIssues = [];
    if (vessel.area !== area) {
      vesselIssues.push(`${vessel.roster_name} area=${vessel.area || "missing"} inferred=${area}`);
    }
    if (!center || !Number.isFinite(lon) || !Number.isFinite(lat)) {
      vesselIssues.push(`${vessel.roster_name} has invalid map coordinates for ${area}`);
    } else {
      const distance = Math.hypot(lon - center[0], lat - center[1]);
      if (distance > 8) {
        vesselIssues.push(`${vessel.roster_name} map point ${lon},${lat} is inconsistent with ${area}`);
      }
    }
    return vesselIssues;
  });
  if (issues.length) {
    throw new Error(`VLCC map/record consistency failed:\n${issues.join("\n")}`);
  }
}

async function main() {
  const existingPageData = readFleetDataJs();
  const latestSnapshotPath = listSnapshotFiles().at(-1);
  if (!latestSnapshotPath) throw new Error("No VLCC snapshots found");
  const latestSnapshot = readJson(latestSnapshotPath);
  const enrichmentByImo = new Map(existingPageData.vessels.map(v => [String(v.imo), v]));
  const dispatch = loadDispatchOverrides();
  const feed = await loadObservationFeed();
  let currentSnapshot = latestSnapshot;

  if (feed) {
    const snapshotDate = feed.snapshotAt ? parseUtc(feed.snapshotAt) : new Date();
    const snapshotAt = formatUtc(snapshotDate);
    const updatesByImo = new Map(feed.vessels.map(v => [String(v.imo || "").trim(), v]));
    const nextVessels = existingPageData.vessels.map(base => {
      const update = updatesByImo.get(String(base.imo)) || {};
      const normalized = normalizeVessel(base, update, snapshotAt);
      return applyDispatchOverride(normalized, dispatch.overridesByImo.get(String(base.imo)), snapshotAt);
    });
    validateFleet(nextVessels);
    validateMapConsistency(nextVessels);
    currentSnapshot = {
      snapshot_at: snapshotAt,
      created_at: formatUtc(new Date()),
      source: `automated VLCC observation feed: ${feed.sourceName}`,
      vessels: nextVessels.map(v => {
        const {history, market, ...clean} = v;
        return clean;
      })
    };
    const outPath = path.join(snapshotDir, snapshotFileName(snapshotDate));
    writeJson(outPath, currentSnapshot);
  }

  const generatedAt = feed
    ? currentSnapshot.snapshot_at || currentSnapshot.created_at
    : existingPageData.generatedAt || currentSnapshot.snapshot_at || currentSnapshot.created_at;
  const pageVessels = feed
    ? currentSnapshot.vessels.map(v => normalizeVessel(enrichmentByImo.get(String(v.imo)) || v, v, generatedAt))
    : existingPageData.vessels.map(v => applyDispatchOverride(v, dispatch.overridesByImo.get(String(v.imo)), generatedAt));
  validateFleet(pageVessels);
  validateMapConsistency(pageVessels);
  const pageData = {
    generatedAt,
    positionPrecision: "AIS public-page region, visualized with deterministic offset",
    vessels: pageVessels,
    history: buildHistory(enrichmentByImo, dispatch),
    market: fs.existsSync(marketPath) ? readJson(marketPath) : existingPageData.market
  };
  writeFleetDataJs(pageData);
  if (fs.existsSync(freightJsonPath)) {
    writeFreightRatesJs(readJson(freightJsonPath));
  }
  console.log(`VLCC data rebuilt: ${generatedAt}; ${pageVessels.length} vessels; ${pageData.history.length} history points.`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
