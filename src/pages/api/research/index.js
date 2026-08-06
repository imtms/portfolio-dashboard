import { ENTITY_KEYS, assetBundle, createEntity, deleteEntity, readStore, updateEntity, writeStore } from "../../../lib/researchStore";

export default function handler(req, res) {
  try {
    if (req.method === "GET") {
      if (req.query.export === "1") {
        res.setHeader("Content-Disposition", `attachment; filename=research-export-${new Date().toISOString().slice(0, 10)}.json`);
        return res.status(200).json(readStore());
      }
      if (req.query.assetId) {
        const bundle = assetBundle(String(req.query.assetId));
        return bundle ? res.status(200).json(bundle) : res.status(404).json({ error: "Asset not found" });
      }
      return res.status(200).json(readStore());
    }

    if (req.method === "POST") {
      const { type, data } = req.body || {};
      if (!ENTITY_KEYS.includes(type) || !data || typeof data !== "object") return res.status(400).json({ error: "Invalid type or data" });
      return res.status(201).json(createEntity(type, data));
    }

    if (req.method === "PUT") {
      if (req.query.import === "1") return res.status(200).json(writeStore(req.body));
      const { type, id, data } = req.body || {};
      const updated = updateEntity(type, id, data || {});
      return updated ? res.status(200).json(updated) : res.status(404).json({ error: "Entity not found" });
    }

    if (req.method === "DELETE") {
      const { type, id } = req.body || {};
      return deleteEntity(type, id) ? res.status(204).end() : res.status(404).json({ error: "Entity not found" });
    }

    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("research api", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
