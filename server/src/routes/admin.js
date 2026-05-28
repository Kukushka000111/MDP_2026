const express = require("express");
const pool = require("../db/pool");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { listModerationQueueSchema, moderateEventSchema } = require("../schemas/events");
const HttpError = require("../utils/http-error");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", async (req, res, next) => {
  try {
    const [eventsByStatus, totals] = await Promise.all([
      pool.query(
        `SELECT moderation_status, COUNT(*)::int AS count
         FROM events
         GROUP BY moderation_status`
      ),
      pool.query(
        `SELECT
            (SELECT COUNT(*)::int FROM users) AS users_count,
            (SELECT COUNT(*)::int FROM events) AS events_count,
            (SELECT COUNT(*)::int FROM event_registrations) AS registrations_count,
            (SELECT COUNT(*)::int FROM reviews) AS reviews_count,
            (SELECT COUNT(*)::int FROM favorites) AS favorites_count`
      )
    ]);

    const moderation = Object.fromEntries(
      eventsByStatus.rows.map((row) => [row.moderation_status, row.count])
    );

    return res.json({
      totals: totals.rows[0],
      moderation: {
        PENDING: moderation.PENDING || 0,
        NEEDS_EDIT: moderation.NEEDS_EDIT || 0,
        APPROVED: moderation.APPROVED || 0,
        REJECTED: moderation.REJECTED || 0
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/events/moderation-queue", validate(listModerationQueueSchema), async (req, res, next) => {
  try {
    const status = req.validated.query.status;
    const values = [];
    let whereSql =
      "e.moderation_status IN ('PENDING', 'NEEDS_EDIT') AND e.event_type = 'COMMUNITY'";

    if (status) {
      values.push(status);
      whereSql = `e.moderation_status = $${values.length}`;
    }

    const result = await pool.query(
      `SELECT
          e.id, e.title, e.description, e.address, e.starts_at, e.ends_at,
          e.event_type, e.moderation_status, e.moderation_comment, e.created_at,
          c.name AS category_name,
          u.display_name AS created_by_name,
          u.email AS created_by_email
       FROM events e
       JOIN categories c ON c.id = e.category_id
       JOIN users u ON u.id = e.created_by
       WHERE ${whereSql}
       ORDER BY e.created_at ASC`,
      values
    );

    return res.json({ items: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.patch("/events/:eventId/moderation", validate(moderateEventSchema), async (req, res, next) => {
  try {
    const { eventId } = req.validated.params;
    const { status, moderationComment } = req.validated.body;

    const eventResult = await pool.query(
      "SELECT id, event_type, moderation_status FROM events WHERE id = $1",
      [eventId]
    );

    if (eventResult.rowCount === 0) {
      throw new HttpError(404, "Event not found");
    }

    const event = eventResult.rows[0];
    if (event.event_type !== "COMMUNITY") {
      throw new HttpError(400, "Moderation flow applies only to community events");
    }

    if (!["PENDING", "NEEDS_EDIT"].includes(event.moderation_status)) {
      throw new HttpError(400, "Only pending/revision events can be moderated");
    }

    const result = await pool.query(
      `UPDATE events
       SET moderation_status = $1,
           moderation_comment = $2,
           moderated_by = $3,
           moderated_at = NOW(),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, moderationComment || "", req.user.sub, eventId]
    );

    const { notifyModerationResult } = require("../utils/notifications");
    await notifyModerationResult(eventId, status, result.rows[0]?.title);

    return res.json({ item: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
