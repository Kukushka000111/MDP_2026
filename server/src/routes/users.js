const express = require("express");
const pool = require("../db/pool");
const { optionalAuth } = require("../middleware/auth");
const HttpError = require("../utils/http-error");

const router = express.Router();

router.get("/:userId", optionalAuth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT
          u.id, u.login, u.first_name, u.last_name, u.display_name,
          u.phone, u.avatar_url, u.vk_url, u.telegram, u.bio, u.gender,
          u.role, u.email, u.created_at,
          COALESCE(ev.cnt, 0)::int AS events_organized_count
       FROM users u
       LEFT JOIN (
         SELECT created_by, COUNT(*)::int AS cnt
         FROM events
         WHERE moderation_status = 'APPROVED'
         GROUP BY created_by
       ) ev ON ev.created_by = u.id
       WHERE u.id = $1`,
      [userId]
    );
    if (result.rowCount === 0) {
      throw new HttpError(404, "Пользователь не найден");
    }

    const row = result.rows[0];
    const isSelf = req.user?.sub === row.id;
    const isAdmin = req.user?.role === "ADMIN";

    const item = {
      id: row.id,
      login: row.login,
      first_name: row.first_name,
      last_name: row.last_name,
      display_name: row.display_name,
      phone: row.phone,
      avatar_url: row.avatar_url,
      vk_url: row.vk_url,
      telegram: row.telegram,
      bio: row.bio,
      gender: row.gender,
      created_at: row.created_at,
      events_organized_count: row.events_organized_count,
      organizer_verified:
        Boolean(row.phone?.trim())
        && (Boolean(row.telegram?.trim()) || Boolean(row.vk_url?.trim()))
    };

    if (isSelf || isAdmin) {
      item.email = row.email;
      item.role = row.role;
      item.is_self = isSelf;
    }

    return res.json({ item });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
