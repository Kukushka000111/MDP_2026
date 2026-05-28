const express = require("express");
const pool = require("../db/pool");
const validate = require("../middleware/validate");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const {
  createEventSchema,
  updateEventSchema,
  listEventsSchema,
  reportEventSchema
} = require("../schemas/events");
const HttpError = require("../utils/http-error");
const { getOrganizerFromUser } = require("../utils/organizer-from-user");
const { ORGANIZER_JOIN, ORGANIZER_SELECT } = require("../utils/event-queries");
const { attendEventSchema, reviewRegistrationSchema } = require("../schemas/registrations");
const { createNotification } = require("../utils/notifications");

const router = express.Router();

const APPROVED_REG_COUNT_SUBQUERY = `
  SELECT event_id, COUNT(*)::int AS registrations_count
  FROM event_registrations
  WHERE status = 'APPROVED'
  GROUP BY event_id
`;

router.get("/", validate(listEventsSchema), async (req, res, next) => {
  try {
    const { q, categoryId, type, dateFrom, dateTo, page, limit } = req.validated.query;
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
      `SELECT COUNT(*)::int AS total FROM events e WHERE ${where.join(" AND ")}`,
      values
    );
    const total = countResult.rows[0]?.total || 0;

    values.push(limit, offset);
    const result = await pool.query(
      `SELECT
          e.id, e.title, e.description, e.address, e.address_public, e.latitude, e.longitude,
          e.image_url,
          e.organizer_name, e.organizer_contact, e.organizer_phone, e.organizer_telegram, e.organizer_vk,
          e.starts_at, e.ends_at, e.max_participants,
          e.event_type, e.moderation_status, e.created_by, e.created_at,
          c.id AS category_id, c.name AS category_name,
          COALESCE(reg.registrations_count, 0) AS registrations_count,
          ${ORGANIZER_SELECT}
       FROM events e
       JOIN categories c ON c.id = e.category_id
       ${ORGANIZER_JOIN}
       LEFT JOIN (${APPROVED_REG_COUNT_SUBQUERY}) reg ON reg.event_id = e.id
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

router.post("/:eventId/attend", requireAuth, validate(attendEventSchema), async (req, res, next) => {
  try {
    const { eventId } = req.validated.params;
    const { message } = req.validated.body;

    const eventResult = await pool.query(
      `SELECT e.id, e.title, e.moderation_status, e.max_participants, e.created_by,
              COALESCE(reg.cnt, 0)::int AS registrations_count
       FROM events e
       LEFT JOIN (
         SELECT event_id, COUNT(*) AS cnt
         FROM event_registrations
         WHERE status = 'APPROVED'
         GROUP BY event_id
       ) reg ON reg.event_id = e.id
       WHERE e.id = $1`,
      [eventId]
    );
    if (eventResult.rowCount === 0) {
      throw new HttpError(404, "Мероприятие не найдено");
    }
    const eventRow = eventResult.rows[0];
    if (eventRow.moderation_status !== "APPROVED") {
      throw new HttpError(400, "Запись доступна только для опубликованных мероприятий");
    }
    if (eventRow.created_by === req.user.sub) {
      throw new HttpError(400, "Организатор не может записаться на своё мероприятие");
    }
    if (
      eventRow.max_participants != null
      && eventRow.registrations_count >= eventRow.max_participants
    ) {
      throw new HttpError(409, "Свободных мест нет");
    }

    const existing = await pool.query(
      "SELECT status FROM event_registrations WHERE user_id = $1 AND event_id = $2",
      [req.user.sub, eventId]
    );
    if (existing.rowCount > 0) {
      throw new HttpError(409, "Вы уже подали заявку на это мероприятие");
    }

    await pool.query(
      `INSERT INTO event_registrations (user_id, event_id, message, status)
       VALUES ($1, $2, $3, 'PENDING')`,
      [req.user.sub, eventId, message || ""]
    );

    if (eventRow.created_by !== req.user.sub) {
      await createNotification({
        userId: eventRow.created_by,
        type: "REGISTRATION_REQUEST",
        title: "Новая заявка на участие",
        body: `Поступила заявка на «${eventRow.title}».`,
        eventId
      });
    }

    return res.status(201).json({ ok: true, status: "PENDING" });
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

router.get("/:eventId/attendees", requireAuth, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const eventResult = await pool.query(
      "SELECT id, created_by FROM events WHERE id = $1",
      [eventId]
    );
    if (eventResult.rowCount === 0) {
      throw new HttpError(404, "Мероприятие не найдено");
    }
    const event = eventResult.rows[0];
    const isOrganizer = event.created_by === req.user.sub;
    const isAdmin = req.user.role === "ADMIN";

    if (!isOrganizer && !isAdmin) {
      const reg = await pool.query(
        `SELECT 1 FROM event_registrations
         WHERE user_id = $1 AND event_id = $2 AND status = 'APPROVED'`,
        [req.user.sub, eventId]
      );
      if (reg.rowCount === 0) {
        throw new HttpError(403, "Список участников доступен после одобрения заявки");
      }
    }

    const result = await pool.query(
      `SELECT u.id, u.display_name, u.login, u.avatar_url
       FROM event_registrations er
       JOIN users u ON u.id = er.user_id
       WHERE er.event_id = $1 AND er.status = 'APPROVED'
       ORDER BY er.created_at ASC`,
      [eventId]
    );
    return res.json({ items: result.rows });
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
      `SELECT u.id, u.login, u.display_name, u.email, u.phone, u.avatar_url, u.vk_url, u.telegram,
              er.message, er.status, er.created_at, er.reviewed_at
       FROM event_registrations er
       JOIN users u ON u.id = er.user_id
       WHERE er.event_id = $1
       ORDER BY
         CASE er.status WHEN 'PENDING' THEN 0 WHEN 'APPROVED' THEN 1 ELSE 2 END,
         er.created_at ASC`,
      [eventId]
    );
    return res.json({ items: result.rows });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:eventId/registrations/:userId", requireAuth, async (req, res, next) => {
  try {
    const { eventId, userId } = req.params;

    const eventResult = await pool.query(
      "SELECT id, title, created_by FROM events WHERE id = $1",
      [eventId]
    );
    if (eventResult.rowCount === 0) {
      throw new HttpError(404, "Мероприятие не найдено");
    }
    const event = eventResult.rows[0];
    const isAllowed = req.user.role === "ADMIN" || event.created_by === req.user.sub;
    if (!isAllowed) {
      throw new HttpError(403, "Только организатор может исключать участников");
    }
    if (String(userId) === String(req.user.sub)) {
      throw new HttpError(400, "Нельзя исключить себя");
    }

    const regResult = await pool.query(
      "SELECT status FROM event_registrations WHERE user_id = $1 AND event_id = $2",
      [userId, eventId]
    );
    if (regResult.rowCount === 0) {
      throw new HttpError(404, "Участник не найден");
    }

    await pool.query(
      "DELETE FROM event_registrations WHERE user_id = $1 AND event_id = $2",
      [userId, eventId]
    );

    await createNotification({
      userId,
      type: "REGISTRATION_REMOVED",
      title: "Исключение с мероприятия",
      body: `Организатор исключил вас из «${event.title}».`,
      eventId
    });

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});

router.patch(
  "/:eventId/registrations/:userId",
  requireAuth,
  validate(reviewRegistrationSchema),
  async (req, res, next) => {
    try {
      const { eventId, userId } = req.validated.params;
      const { status } = req.validated.body;

      const eventResult = await pool.query(
        "SELECT id, title, created_by, max_participants FROM events WHERE id = $1",
        [eventId]
      );
      if (eventResult.rowCount === 0) {
        throw new HttpError(404, "Мероприятие не найдено");
      }
      const event = eventResult.rows[0];
      const isAllowed = req.user.role === "ADMIN" || event.created_by === req.user.sub;
      if (!isAllowed) {
        throw new HttpError(403, "Только организатор может одобрять заявки");
      }

      const regResult = await pool.query(
        "SELECT status FROM event_registrations WHERE user_id = $1 AND event_id = $2",
        [userId, eventId]
      );
      if (regResult.rowCount === 0) {
        throw new HttpError(404, "Заявка не найдена");
      }
      if (regResult.rows[0].status !== "PENDING") {
        throw new HttpError(400, "Заявка уже рассмотрена");
      }

      if (status === "APPROVED" && event.max_participants != null) {
        const countResult = await pool.query(
          `SELECT COUNT(*)::int AS cnt FROM event_registrations
           WHERE event_id = $1 AND status = 'APPROVED'`,
          [eventId]
        );
        if (countResult.rows[0].cnt >= event.max_participants) {
          throw new HttpError(409, "Нет свободных мест для одобрения");
        }
      }

      await pool.query(
        `UPDATE event_registrations
         SET status = $1, reviewed_at = NOW()
         WHERE user_id = $2 AND event_id = $3`,
        [status, userId, eventId]
      );

      await createNotification({
        userId,
        type: status === "APPROVED" ? "REGISTRATION_APPROVED" : "REGISTRATION_REJECTED",
        title: status === "APPROVED" ? "Заявка одобрена" : "Заявка отклонена",
        body:
          status === "APPROVED"
            ? `Организатор одобрил вашу заявку на «${event.title}».`
            : `Организатор отклонил вашу заявку на «${event.title}».`,
        eventId
      });

      return res.json({ ok: true, status });
    } catch (error) {
      return next(error);
    }
  }
);

router.post("/:eventId/report", requireAuth, validate(reportEventSchema), async (req, res, next) => {
  try {
    const { eventId } = req.validated.params;
    const { reason } = req.validated.body;

    const eventResult = await pool.query(
      "SELECT id, moderation_status FROM events WHERE id = $1",
      [eventId]
    );
    if (eventResult.rowCount === 0) {
      throw new HttpError(404, "Мероприятие не найдено");
    }
    if (eventResult.rows[0].moderation_status !== "APPROVED") {
      throw new HttpError(400, "Жалоба доступна только на опубликованные мероприятия");
    }

    await pool.query(
      `INSERT INTO event_reports (event_id, user_id, reason)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, event_id) DO UPDATE SET reason = EXCLUDED.reason, created_at = NOW()`,
      [eventId, req.user.sub, reason || "Без комментария"]
    );

    return res.status(201).json({ ok: true, message: "Жалоба принята" });
  } catch (error) {
    return next(error);
  }
});

router.get("/:eventId", optionalAuth, async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.sub || null;
    const result = await pool.query(
      `SELECT
          e.id, e.title, e.description, e.address, e.address_public, e.latitude, e.longitude, e.image_url,
          e.organizer_name, e.organizer_contact, e.organizer_phone, e.organizer_telegram, e.organizer_vk,
          e.starts_at, e.ends_at, e.max_participants,
          e.event_type, e.moderation_status, e.moderation_comment, e.created_by, e.created_at,
          c.id AS category_id, c.name AS category_name,
          COALESCE(reg.registrations_count, 0) AS registrations_count,
          my_reg.status AS my_registration_status,
          my_reg.message AS my_registration_message,
          ${ORGANIZER_SELECT}
       FROM events e
       JOIN categories c ON c.id = e.category_id
       ${ORGANIZER_JOIN}
       LEFT JOIN (${APPROVED_REG_COUNT_SUBQUERY}) reg ON reg.event_id = e.id
       LEFT JOIN event_registrations my_reg
         ON my_reg.event_id = e.id AND my_reg.user_id = $2
       WHERE e.id = $1`,
      [eventId, userId]
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
      throw new HttpError(400, "Дата окончания должна быть не раньше даты начала");
    }

    const status =
      input.eventType === "OFFICIAL" && userRole === "ADMIN" ? "APPROVED" : "PENDING";
    const organizer = await getOrganizerFromUser(userId);

    const result = await pool.query(
      `INSERT INTO events (
          title, description, category_id, address, address_public, latitude, longitude,
          image_url, organizer_name, organizer_contact, organizer_phone, organizer_telegram, organizer_vk,
          starts_at, ends_at, max_participants, event_type,
          moderation_status, created_by
       )
       VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17,
          $18, $19
       )
       RETURNING *`,
      [
        input.title,
        input.description || "",
        input.categoryId,
        input.address,
        Boolean(input.addressPublic),
        input.latitude ?? null,
        input.longitude ?? null,
        input.imageUrl || "",
        organizer.organizerName,
        organizer.organizerContact,
        organizer.organizerPhone,
        organizer.organizerTelegram,
        organizer.organizerVk,
        input.startsAt,
        input.endsAt,
        input.maxParticipants ?? null,
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
      throw new HttpError(400, "Дата окончания должна быть не раньше даты начала");
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

    const organizer = await getOrganizerFromUser(req.user.sub);

    const result = await pool.query(
      `UPDATE events
       SET title = $1,
           description = $2,
           category_id = $3,
           address = $4,
           address_public = $5,
           latitude = $6,
           longitude = $7,
           image_url = $8,
           organizer_name = $9,
           organizer_contact = $10,
           organizer_phone = $11,
           organizer_telegram = $12,
           organizer_vk = $13,
           starts_at = $14,
           ends_at = $15,
           max_participants = $16,
           event_type = $17,
           moderation_status = $18,
           moderation_comment = CASE WHEN $19 = 'PENDING' THEN '' ELSE moderation_comment END,
           updated_at = NOW()
       WHERE id = $20
       RETURNING *`,
      [
        input.title,
        input.description || "",
        input.categoryId,
        input.address,
        Boolean(input.addressPublic),
        input.latitude ?? null,
        input.longitude ?? null,
        input.imageUrl || "",
        organizer.organizerName,
        organizer.organizerContact,
        organizer.organizerPhone,
        organizer.organizerTelegram,
        organizer.organizerVk,
        input.startsAt,
        input.endsAt,
        input.maxParticipants ?? null,
        input.eventType,
        nextStatus,
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
