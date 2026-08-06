import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const ENTITY_KEYS = ["assets", "hypotheses", "questions", "evidence", "metrics", "metricValues", "events", "stageChanges", "journal", "actions"];
const storePath = process.env.RESEARCH_DATA_PATH || path.join(process.cwd(), "data", "research.json");

export function emptyStore() {
  return Object.fromEntries(ENTITY_KEYS.map((key) => [key, []]));
}

function normalizeStore(data) {
  const base = emptyStore();
  ENTITY_KEYS.forEach((key) => { base[key] = Array.isArray(data?.[key]) ? data[key] : []; });
  return base;
}

export function readStore() {
  if (!fs.existsSync(storePath)) return emptyStore();
  return normalizeStore(JSON.parse(fs.readFileSync(storePath, "utf8")));
}

export function writeStore(data) {
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  const normalized = normalizeStore(data);
  const temp = `${storePath}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  fs.renameSync(temp, storePath);
  return normalized;
}

export function createEntity(type, input) {
  if (!ENTITY_KEYS.includes(type)) throw new Error("Unknown entity type");
  const store = readStore();
  const now = new Date().toISOString();
  const entity = { ...input, id: input.id || crypto.randomUUID(), createdAt: input.createdAt || now, updatedAt: now };
  store[type].push(entity);
  writeStore(store);
  return entity;
}

export function updateEntity(type, id, input) {
  if (!ENTITY_KEYS.includes(type)) throw new Error("Unknown entity type");
  const store = readStore();
  const index = store[type].findIndex((item) => item.id === id);
  if (index < 0) return null;
  store[type][index] = { ...store[type][index], ...input, id, updatedAt: new Date().toISOString() };
  writeStore(store);
  return store[type][index];
}

export function deleteEntity(type, id) {
  if (!ENTITY_KEYS.includes(type)) throw new Error("Unknown entity type");
  const store = readStore();
  const before = store[type].length;
  store[type] = store[type].filter((item) => item.id !== id);
  if (type === "assets") ENTITY_KEYS.filter((key) => key !== "assets").forEach((key) => { store[key] = store[key].filter((item) => item.assetId !== id); });
  writeStore(store);
  return store[type].length < before;
}

export function assetBundle(assetId) {
  const store = readStore();
  const asset = store.assets.find((item) => item.id === assetId);
  if (!asset) return null;
  return { asset, ...Object.fromEntries(ENTITY_KEYS.filter((key) => key !== "assets").map((key) => [key, store[key].filter((item) => item.assetId === assetId)])) };
}
