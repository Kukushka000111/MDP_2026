const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

router.get("/profile", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, email, display_name, role, created_at FROM users WHERE id = $1",
      [req.user.sub]
    );
    return res.json({ item: result.rows[0] || null });
  } catch (error) {
    return next(error);
  }
});

router.get("/created-events", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.*, c.name AS category_name, d.name AS district_name,
              COALESCE(reg.registrations_count, 0) AS registrations_count
       FROM events e
       JOIN categories c ON c.id = e.category_id
       JOIN districts d ON d.id = e.district_id
       LEFT JOIN (
         SELECT event_id, COUNT(*)::int AS registrations_count
         FROM event_registrations
         GROUP BY event_id
       ) reg ON reg.event_id = e.id
       WHERE e.created_by = $1
       ORDER BY e.created_at DESC`,
      [req.user.sub]
    );
    return res.json({ items: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.get("/attending-events", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.*, c.name AS category_name, d.name AS district_name
       FROM event_registrations er
       JOIN events e ON e.id = er.event_id
       JOIN categories c ON c.id = e.category_id
       JOIN districts d ON d.id = e.district_id
       WHERE er.user_id = $1
       ORDER BY e.starts_at ASC`,
      [req.user.sub]
    );
    return res.json({ items: result.rows });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
