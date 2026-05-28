const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { createReviewSchema, listReviewsSchema } = require("../schemas/reviews");
const HttpError = require("../utils/http-error");

const router = express.Router();

router.get("/event/:eventId", validate(listReviewsSchema), async (req, res, next) => {
  try {
    const { eventId } = req.validated.params;
    const result = await pool.query(
      `SELECT r.id, r.rating, r.body, r.created_at, u.display_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.event_id = $1
       ORDER BY r.created_at DESC`,
      [eventId]
    );
    return res.json({ items: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAuth, validate(createReviewSchema), async (req, res, next) => {
  try {
    const { eventId, rating, body } = req.validated.body;

    const eventResult = await pool.query(
      "SELECT id, ends_at, moderation_status FROM events WHERE id = $1",
      [eventId]
    );
    if (eventResult.rowCount === 0) {
      throw new HttpError(404, "Event not found");
    }

    const event = eventResult.rows[0];
    if (event.moderation_status !== "APPROVED") {
      throw new HttpError(400, "Reviews are allowed only for published events");
    }

    if (new Date(event.ends_at) > new Date()) {
      throw new HttpError(400, "Отзыв можно оставить только после окончания мероприятия");
    }

    const registration = await pool.query(
      `SELECT 1 FROM event_registrations
       WHERE user_id = $1 AND event_id = $2 AND status = 'APPROVED'`,
      [req.user.sub, eventId]
    );
    if (registration.rowCount === 0) {
      throw new HttpError(403, "Отзыв могут оставить только записавшиеся на мероприятие");
    }

    const result = await pool.query(
      `INSERT INTO reviews (user_id, event_id, rating, body)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, event_id)
       DO UPDATE SET rating = EXCLUDED.rating, body = EXCLUDED.body, updated_at = NOW()
       RETURNING *`,
      [req.user.sub, eventId, rating, body]
    );

    return res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
