const pool = require("../db/pool");

const MODERATION_MESSAGES = {
  APPROVED: {
    title: "Мероприятие одобрено",
    body: "Ваше мероприятие одобрено модератором и опубликовано в ленте."
  },
  NEEDS_EDIT: {
    title: "Нужны правки",
    body: "Модератор запросил правки по вашему мероприятию."
  },
  REJECTED: {
    title: "Мероприятие отклонено",
    body: "Ваше мероприятие отклонено модератором."
  }
};

async function createNotification({ userId, type, title, body, eventId = null }) {
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, body, event_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, type, title, body, eventId]
  );
}

async function notifyModerationResult(eventId, status, eventTitle) {
  const eventResult = await pool.query(
    "SELECT created_by, title FROM events WHERE id = $1",
    [eventId]
  );
  if (eventResult.rowCount === 0) return;

  const template = MODERATION_MESSAGES[status];
  if (!template) return;

  const title = eventTitle || eventResult.rows[0].title;
  await createNotification({
    userId: eventResult.rows[0].created_by,
    type: `MODERATION_${status}`,
    title: template.title,
    body: `${template.body} «${title}».`,
    eventId
  });
}

async function syncEventReminders(userId) {
  const result = await pool.query(
    `SELECT e.id, e.title, e.starts_at
     FROM event_registrations er
     JOIN events e ON e.id = er.event_id
     WHERE er.user_id = $1
       AND e.moderation_status = 'APPROVED'
       AND e.starts_at >= date_trunc('day', NOW() + interval '1 day')
       AND e.starts_at < date_trunc('day', NOW() + interval '2 days')
       AND NOT EXISTS (
         SELECT 1 FROM notifications n
         WHERE n.user_id = $1 AND n.event_id = e.id AND n.type = 'EVENT_REMINDER'
       )`,
    [userId]
  );

  for (const row of result.rows) {
    await createNotification({
      userId,
      type: "EVENT_REMINDER",
      title: "Напоминание о мероприятии",
      body: `Завтра: «${row.title}» в ${new Date(row.starts_at).toLocaleString("ru-RU")}.`,
      eventId: row.id
    });
  }
}

module.exports = {
  createNotification,
  notifyModerationResult,
  syncEventReminders
};
