const express = require("express");
const pool = require("../db/pool");
const { requireAuth } = require("../middleware/auth");
const { syncEventReminders } = require("../utils/notifications");

const router = express.Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    await syncEventReminders(req.user.sub);

    const result = await pool.query(
      `SELECT id, type, title, body, event_id, read_at, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.sub]
    );

    const unread = await pool.query(
      `SELECT COUNT(*)::int AS count FROM notifications
       WHERE user_id = $1 AND read_at IS NULL`,
      [req.user.sub]
    );

    return res.json({
      items: result.rows,
      unreadCount: unread.rows[0]?.count || 0
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/read-all", async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE notifications SET read_at = NOW()
       WHERE user_id = $1 AND read_at IS NULL`,
      [req.user.sub]
    );
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:notificationId/read", async (req, res, next) => {
  try {
    await pool.query(
      `UPDATE notifications SET read_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [req.params.notificationId, req.user.sub]
    );
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
