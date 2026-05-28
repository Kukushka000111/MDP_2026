const express = require("express");
const pool = require("../db/pool");

const router = express.Router();

router.get("/categories", async (_req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, name FROM categories ORDER BY name ASC"
    );
    return res.json({ items: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.get("/geocode", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ items: [] });

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "CulturalNavigator/1.0",
        Accept: "application/json"
      }
    });
    if (!response.ok) {
      return res.json({ items: [] });
    }
    const data = await response.json();
    const items = Array.isArray(data)
      ? data.map((item) => ({
          latitude: Number(item.lat),
          longitude: Number(item.lon),
          displayName: item.display_name
        }))
      : [];
    return res.json({ items });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
