// Bundles the dataset and generated JSON into files the app imports (so the deployed app needs no filesystem access).
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ds = path.join(root, "data", "dataset");

function walk(dir, base = "") {
  let out = [];
  for (const e of fs.readdirSync(path.join(dir, base), { withFileTypes: true })) {
    const rel = path.join(base, e.name);
    if (e.isDirectory()) out = out.concat(walk(dir, rel));
    else if (/\.(md|csv)$/.test(e.name)) out.push(rel);
  }
  return out;
}
const sources = {};
for (const rel of walk(ds)) sources[rel.split(path.sep).join("/")] = fs.readFileSync(path.join(ds, rel), "utf8");
fs.writeFileSync(path.join(root, "data", "sources.json"), JSON.stringify(sources));

const briefsDir = path.join(root, "data", "briefs");
const briefs = fs.readdirSync(briefsDir).filter((f) => f.endsWith(".json") && !f.startsWith("_")).sort()
  .map((f) => JSON.parse(fs.readFileSync(path.join(briefsDir, f), "utf8")));
fs.writeFileSync(path.join(root, "data", "briefs.json"), JSON.stringify(briefs));

// Simulated test contracts: stored briefs kept apart from the 15 dataset briefs (they never enter the queue, the evaluation or the playbook).
const sbDir = path.join(root, "data", "sample_briefs");
const sampleBriefs = fs.existsSync(sbDir) ? fs.readdirSync(sbDir).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(fs.readFileSync(path.join(sbDir, f), "utf8"))) : [];
fs.writeFileSync(path.join(root, "data", "sample_briefs.json"), JSON.stringify(sampleBriefs));

// tracker csv -> json
function parseCsv(t) {
  const rows = []; let row = [], cur = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"' && t[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; row.push(cur); cur = ""; if (row.length > 1 || row[0] !== "") rows.push(row); row = []; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const [h, ...r] = rows;
  return r.map((x) => Object.fromEntries(h.map((k, i) => [k, x[i] ?? ""])));
}
fs.writeFileSync(path.join(root, "data", "tracker.json"), JSON.stringify(parseCsv(sources["contract_tracker.csv"])));
console.log("sources", Object.keys(sources).length, "briefs", briefs.length, "sample briefs", sampleBriefs.length);
