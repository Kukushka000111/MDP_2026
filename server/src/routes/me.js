const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { updateProfileSchema } = require("../schemas/me");
const HttpError = require("../utils/http-error");

const router = express.Router();

router.use(requireAuth);

const profileFields = `id, email, login, first_name, last_name, display_name,
  phone, avatar_url, vk_url, telegram, bio, gender, is_adult, role, created_at`;

router.get("/profile", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ${profileFields} FROM users WHERE id = $1`,
      [req.user.sub]
    );
    return res.json({ item: result.rows[0] || null });
  } catch (error) {
    return next(error);
  }
});

router.patch("/profile", validate(updateProfileSchema), async (req, res, next) => {
  try {
    const { firstName, lastName, phone, avatarUrl, vkUrl, telegram, bio } = req.validated.body;
    const displayName = `${firstName.trim()} ${lastName.trim()}`;

    const result = await pool.query(
      `UPDATE users
       SET first_name = $1,
           last_name = $2,
           display_name = $3,
           phone = $4,
           avatar_url = $5,
           vk_url = $6,
           telegram = $7,
           bio = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING ${profileFields}`,
      [
        firstName.trim(),
        lastName.trim(),
        displayName,
        phone || "",
        avatarUrl || "",
        vkUrl || "",
        telegram || "",
        bio || "",
        req.user.sub
      ]
    );

    if (result.rowCount === 0) {
      throw new HttpError(404, "Пользователь не найден");
    }

    return res.json({ item: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.get("/created-events", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.*, c.name AS category_name,
              COALESCE(reg.registrations_count, 0) AS registrations_count
       FROM events e
       JOIN categories c ON c.id = e.category_id
       LEFT JOIN (
         SELECT event_id, COUNT(*)::int AS registrations_count
         FROM event_registrations
         WHERE status = 'APPROVED'
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
      `SELECT e.*, c.name AS category_name,
              er.status AS registration_status,
              er.message AS registration_message,
              COALESCE(reg.registrations_count, 0) AS registrations_count
       FROM event_registrations er
       JOIN events e ON e.id = er.event_id
       JOIN categories c ON c.id = e.category_id
       LEFT JOIN (
         SELECT event_id, COUNT(*)::int AS registrations_count
         FROM event_registrations
         WHERE status = 'APPROVED'
         GROUP BY event_id
       ) reg ON reg.event_id = e.id
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
