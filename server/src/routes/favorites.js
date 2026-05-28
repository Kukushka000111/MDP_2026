const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { addFavoriteSchema } = require("../schemas/favorites");
const { ORGANIZER_JOIN, ORGANIZER_SELECT } = require("../utils/event-queries");

const router = express.Router();

const APPROVED_REG_COUNT_SUBQUERY = `
  SELECT event_id, COUNT(*)::int AS registrations_count
  FROM event_registrations
  WHERE status = 'APPROVED'
  GROUP BY event_id
`;

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.id, e.title, e.description, e.address, e.address_public, e.latitude, e.longitude,
              e.image_url, e.starts_at, e.ends_at, e.max_participants, e.event_type, e.moderation_status,
              e.created_by, c.name AS category_name,
              COALESCE(reg.registrations_count, 0) AS registrations_count,
              ${ORGANIZER_SELECT}
       FROM favorites f
       JOIN events e ON e.id = f.event_id
       JOIN categories c ON c.id = e.category_id
       LEFT JOIN (${APPROVED_REG_COUNT_SUBQUERY}) reg ON reg.event_id = e.id
       ${ORGANIZER_JOIN}
       WHERE f.user_id = $1 AND e.moderation_status = 'APPROVED'
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
