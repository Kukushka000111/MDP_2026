const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { addFavoriteSchema } = require("../schemas/favorites");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.id, e.title, e.starts_at, e.ends_at, e.event_type, e.moderation_status
       FROM favorites f
       JOIN events e ON e.id = f.event_id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [req.user.sub]
    );

    return res.json({ items: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.post("/", validate(addFavoriteSchema), async (req, res, next) => {
  try {
    const { eventId } = req.validated.body;
    await pool.query(
      `INSERT INTO favorites (user_id, event_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, event_id) DO NOTHING`,
      [req.user.sub, eventId]
    );
    return res.status(201).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:eventId", async (req, res, next) => {
  try {
    await pool.query(
      "DELETE FROM favorites WHERE user_id = $1 AND event_id = $2",
      [req.user.sub, req.params.eventId]
    );
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
