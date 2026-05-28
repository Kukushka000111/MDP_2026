const crypto = require("crypto");

const store = new Map();
const TTL_MS = 10 * 60 * 1000;

function prune() {
  const now = Date.now();
  for (const [id, entry] of store.entries()) {
    if (entry.expiresAt <= now) store.delete(id);
  }
}

function createCaptcha() {
  prune();
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const captchaId = crypto.randomUUID();
  store.set(captchaId, {
    answer: a + b,
    expiresAt: Date.now() + TTL_MS
  });
  return { captchaId, question: `Сколько будет ${a} + ${b}?` };
}

function verifyCaptcha(captchaId, answerRaw) {
  prune();
  if (!captchaId) return false;
  const entry = store.get(captchaId);
  store.delete(captchaId);
  if (!entry || entry.expiresAt <= Date.now()) return false;
  const answer = Number(String(answerRaw).trim());
  return Number.isFinite(answer) && answer === entry.answer;
}

module.exports = { createCaptcha, verifyCaptcha };
