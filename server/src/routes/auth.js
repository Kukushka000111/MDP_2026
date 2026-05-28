const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");
const env = require("../config/env");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const {
  registerSchema,
  loginSchema,
  checkAvailabilitySchema
} = require("../schemas/auth");
const HttpError = require("../utils/http-error");
const { createCaptcha, verifyCaptcha } = require("../utils/captcha-store");

const router = express.Router();

router.get("/captcha", (_req, res) => {
  return res.json(createCaptcha());
});

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    login: row.login,
    first_name: row.first_name,
    last_name: row.last_name,
    display_name: row.display_name,
    gender: row.gender,
    role: row.role
  };
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email, login: user.login },
    env.jwtSecret,
    { expiresIn: "1d" }
  );
}

router.get("/check-availability", validate(checkAvailabilitySchema), async (req, res, next) => {
  try {
    const { field, value } = req.validated.query;
    const normalized =
      field === "email" ? value.trim().toLowerCase() : value.trim().toLowerCase();

    const column = field === "email" ? "email" : "login";
    const result = await pool.query(`SELECT id FROM users WHERE ${column} = $1`, [normalized]);

    return res.json({ available: result.rowCount === 0, field });
  } catch (error) {
    return next(error);
  }
});

router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      login,
      password,
      gender,
      captchaId,
      captchaAnswer
    } = req.validated.body;

    if (!verifyCaptcha(captchaId, captchaAnswer)) {
      throw new HttpError(400, "Неверный ответ на капчу");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedLogin = login.trim().toLowerCase();
    const displayName = `${firstName.trim()} ${lastName.trim()}`;

    const dup = await pool.query(
      `SELECT
         EXISTS(SELECT 1 FROM users WHERE email = $1) AS email_taken,
         EXISTS(SELECT 1 FROM users WHERE login = $2) AS login_taken`,
      [normalizedEmail, normalizedLogin]
    );
    if (dup.rows[0].email_taken) {
      throw new HttpError(409, "Этот email уже занят");
    }
    if (dup.rows[0].login_taken) {
      throw new HttpError(409, "Этот логин уже занят");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const role = env.adminEmails.includes(normalizedEmail) ? "ADMIN" : "USER";

    const result = await pool.query(
      `INSERT INTO users (
          email, login, password_hash, first_name, last_name, display_name,
          gender, is_adult, rules_accepted, role
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, TRUE, $8)
       RETURNING id, email, login, first_name, last_name, display_name, gender, role, created_at`,
      [
        normalizedEmail,
        normalizedLogin,
        passwordHash,
        firstName.trim(),
        lastName.trim(),
        displayName,
        gender,
        role
      ]
    );

    const user = result.rows[0];
    const token = signToken(user);

    return res.status(201).json({ token, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { login, password } = req.validated.body;
    const normalizedLogin = login.trim().toLowerCase();

    const result = await pool.query(
      `SELECT id, email, login, display_name, first_name, last_name, gender, role, password_hash
       FROM users
       WHERE login = $1`,
      [normalizedLogin]
    );

    if (result.rowCount === 0) {
      throw new HttpError(401, "Неверный логин или пароль");
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new HttpError(401, "Неверный логин или пароль");
    }

    const token = signToken(user);

    return res.json({
      token,
      user: publicUser(user)
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, email, login, first_name, last_name, display_name,
              phone, avatar_url, vk_url, telegram, gender, is_adult, role, created_at
       FROM users WHERE id = $1`,
      [req.user.sub]
    );

    if (result.rowCount === 0) {
      throw new HttpError(404, "Пользователь не найден");
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
