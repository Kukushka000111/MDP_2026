const express = require("express");
const pool = require("../db/pool");
const validate = require("../middleware/validate");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { createEventSchema, updateEventSchema, listEventsSchema } = require("../schemas/events");
const HttpError = require("../utils/http-error");

const router = express.Router();

router.get("/", validate(listEventsSchema), async (req, res, next) => {
  try {
    const { q, categoryId, districtId, type, dateFrom, dateTo, page, limit } = req.validated.query;
    const offset = (page - 1) * limit;
    const where = ["e.moderation_status = 'APPROVED'"];
    const values = [];

    if (q) {
      values.push(`%${q}%`);
      where.push(`e.title ILIKE $${values.length}`);
    }

    if (categoryId) {
      values.push(categoryId);
      where.push(`e.category_id = $${values.length}`);
    }

    if (districtId) {
      values.push(districtId);
      where.push(`e.district_id = $${values.length}`);
    }

    if (type) {
      values.push(type);
      where.push(`e.event_type = $${values.length}`);
    }

    if (dateFrom) {
      values.push(dateFrom);
      where.push(`e.starts_at >= $${values.length}`);
    }

    if (dateTo) {
      values.push(dateTo);
      where.push(`e.starts_at <= $${values.length}`);
    }

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM events e
       WHERE ${where.join(" AND ")}`,
      values
    );
    const total = countResult.rows[0]?.total || 0;

    values.push(limit, offset);
    const result = await pool.query(
      `SELECT
          e.id, e.title, e.description, e.address, e.latitude, e.longitude,
          e.image_url,
          e.organizer_name, e.organizer_contact, e.starts_at, e.ends_at,
          e.event_type, e.moderation_status, e.created_at,
          c.id AS category_id, c.name AS category_name,
          d.id AS district_id, d.name AS district_name,
          COALESCE(reg.registrations_count, 0) AS registrations_count
       FROM events e
       JOIN categories c ON c.id = e.category_id
       JOIN districts d ON d.id = e.district_id
       LEFT JOIN (
         SELECT event_id, COUNT(*)::int AS registrations_count
         FROM event_registrations
         GROUP BY event_id
       ) reg ON reg.event_id = e.id
       WHERE ${where.join(" AND ")}
       ORDER BY e.starts_at ASC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return res.json({
      items: result.rows,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit))
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/:eventId/attend", requireAuth, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const eventResult = await pool.query(
      "SELECT id, moderation_status FROM events WHERE id = $1",
      [eventId]
    );
    if (eventResult.rowCount === 0) {
      throw new HttpError(404, "Event not found");
    }
    if (eventResult.rows[0].moderation_status !== "APPROVED") {
      throw new HttpError(400, "Only approved events are available for attendance");
    }

    await pool.query(
      `INSERT INTO event_registrations (user_id, event_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, event_id) DO NOTHING`,
      [req.user.sub, eventId]
    );

    return res.status(201).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:eventId/attend", requireAuth, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    await pool.query(
      "DELETE FROM event_registrations WHERE user_id = $1 AND event_id = $2",
      [req.user.sub, eventId]
    );
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.get("/:eventId/participants", requireAuth, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const permissionCheck = await pool.query(
      "SELECT id, created_by FROM events WHERE id = $1",
      [eventId]
    );
    if (permissionCheck.rowCount === 0) {
      throw new HttpError(404, "Event not found");
    }
    const event = permissionCheck.rows[0];
    const isAllowed = req.user.role === "ADMIN" || event.created_by === req.user.sub;
    if (!isAllowed) {
      throw new HttpError(403, "Participants are visible only to organizer or admin");
    }

    const result = await pool.query(
      `SELECT u.id, u.display_name, u.email, er.created_at
       FROM event_registrations er
       JOIN users u ON u.id = er.user_id
       WHERE er.event_id = $1
       ORDER BY er.created_at ASC`,
      [eventId]
    );
    return res.json({ items: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.get("/:eventId", optionalAuth, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const result = await pool.query(
      `SELECT
          e.id, e.title, e.description, e.address, e.latitude, e.longitude, e.image_url,
          e.organizer_name, e.organizer_contact, e.starts_at, e.ends_at,
          e.event_type, e.moderation_status, e.moderation_comment, e.created_by, e.created_at,
          c.id AS category_id, c.name AS category_name,
          d.id AS district_id, d.name AS district_name,
          COALESCE(reg.registrations_count, 0) AS registrations_count
       FROM events e
       JOIN categories c ON c.id = e.category_id
       JOIN districts d ON d.id = e.district_id
       LEFT JOIN (
         SELECT event_id, COUNT(*)::int AS registrations_count
         FROM event_registrations
         GROUP BY event_id
       ) reg ON reg.event_id = e.id
       WHERE e.id = $1`,
      [eventId]
    );
    if (result.rowCount === 0) {
      throw new HttpError(404, "Event not found");
    }
    const item = result.rows[0];
    const isOwner = req.user?.sub === item.created_by;
    const isAdmin = req.user?.role === "ADMIN";
    if (item.moderation_status !== "APPROVED" && !isOwner && !isAdmin) {
      throw new HttpError(403, "Event is not public");
    }
    return res.json({ item });
  } catch (error) {
    return next(error);
  }
});

router.post("/", requireAuth, validate(createEventSchema), async (req, res, next) => {
  try {
    const input = req.validated.body;
    const userRole = req.user.role;
    const userId = req.user.sub;
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    if (startsAt > endsAt) {
      throw new HttpError(400, "startsAt must be earlier than endsAt");
    }

    const status =
      input.eventType === "OFFICIAL" && userRole === "ADMIN" ? "APPROVED" : "PENDING";

    const result = await pool.query(
      `INSERT INTO events (
          title, description, category_id, district_id, address, latitude, longitude,
          image_url, organizer_name, organizer_contact, starts_at, ends_at, event_type,
          moderation_status, created_by
       )
       VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15
       )
       RETURNING *`,
      [
        input.title,
        input.description || "",
        input.categoryId,
        input.districtId,
        input.address,
        input.latitude ?? null,
        input.longitude ?? null,
        input.imageUrl || "",
        input.organizerName,
        input.organizerContact || "",
        input.startsAt,
        input.endsAt,
        input.eventType,
        status,
        userId
      ]
    );

    return res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:eventId", requireAuth, validate(updateEventSchema), async (req, res, next) => {
  try {
    const { eventId } = req.validated.params;
    const input = req.validated.body;
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    if (startsAt > endsAt) {
      throw new HttpError(400, "startsAt must be earlier than endsAt");
    }

    const existingResult = await pool.query(
      "SELECT id, created_by, event_type, moderation_status FROM events WHERE id = $1",
      [eventId]
    );
    if (existingResult.rowCount === 0) {
      throw new HttpError(404, "Event not found");
    }

    const existing = existingResult.rows[0];
    const isOwner = existing.created_by === req.user.sub;
    const isAdmin = req.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      throw new HttpError(403, "Only organizer or admin can edit event");
    }

    let nextStatus = existing.moderation_status;
    if (existing.event_type === "COMMUNITY" && !isAdmin) {
      nextStatus = "PENDING";
    } else if (existing.event_type === "OFFICIAL" && isAdmin) {
      nextStatus = "APPROVED";
    } else if (existing.event_type === "COMMUNITY" && isAdmin && existing.moderation_status === "APPROVED") {
      nextStatus = "APPROVED";
    }

    const result = await pool.query(
      `UPDATE events
       SET title = $1,
           description = $2,
           category_id = $3,
           district_id = $4,
           address = $5,
           latitude = $6,
           longitude = $7,
           image_url = $8,
           organizer_name = $9,
           organizer_contact = $10,
           starts_at = $11,
           ends_at = $12,
           event_type = $13,
           moderation_status = $14,
           moderation_comment = CASE WHEN $14 = 'PENDING' THEN '' ELSE moderation_comment END,
           updated_at = NOW()
       WHERE id = $15
       RETURNING *`,
      [
        input.title,
        input.description || "",
        input.categoryId,
        input.districtId,
        input.address,
        input.latitude ?? null,
        input.longitude ?? null,
        input.imageUrl || "",
        input.organizerName,
        input.organizerContact || "",
        input.startsAt,
        input.endsAt,
        input.eventType,
        nextStatus,
        eventId
      ]
    );

    return res.json({ item: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:eventId", requireAuth, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const result = await pool.query("SELECT id, created_by FROM events WHERE id = $1", [eventId]);
    if (result.rowCount === 0) {
      throw new HttpError(404, "Event not found");
    }
    const event = result.rows[0];
    const canDelete = req.user.role === "ADMIN" || event.created_by === req.user.sub;
    if (!canDelete) {
      throw new HttpError(403, "Only organizer or moderator can delete event");
    }
    await pool.query("DELETE FROM events WHERE id = $1", [eventId]);
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
