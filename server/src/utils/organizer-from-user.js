const pool = require("../db/pool");
const HttpError = require("./http-error");

async function getOrganizerFromUser(userId) {
  const result = await pool.query(
    `SELECT first_name, last_name, display_name, phone, telegram, vk_url
     FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rowCount === 0) {
    throw new HttpError(404, "Пользователь не найден");
  }

  const user = result.rows[0];
  const organizerName =
    `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.display_name;

  if (!organizerName) {
    throw new HttpError(
      400,
      "Заполните имя и фамилию в профиле — они используются как данные организатора"
    );
  }

  const organizerPhone = user.phone || "";
  const organizerTelegram = user.telegram || "";
  const organizerVk = user.vk_url || "";
  const contactSummary = [organizerPhone, organizerTelegram, organizerVk]
    .filter(Boolean)
    .join(" · ");

  return {
    organizerName,
    organizerPhone,
    organizerTelegram,
    organizerVk,
    organizerContact: contactSummary
  };
}

module.exports = { getOrganizerFromUser };
