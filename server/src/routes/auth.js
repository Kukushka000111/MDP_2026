const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db/pool");
const env = require("../config/env");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { registerSchema, loginSchema } = require("../schemas/auth");
const HttpError = require("../utils/http-error");

const router = express.Router();

router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, displayName } = req.validated.body;
    const normalizedEmail = email.toLowerCase();

    const exists = await pool.query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (exists.rowCount > 0) {
      throw new HttpError(409, "Email is already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const role = env.adminEmails.includes(normalizedEmail) ? "ADMIN" : "USER";

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, display_name, role, created_at`,
      [normalizedEmail, passwordHash, displayName, role]
    );

    const user = result.rows[0];
    const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.jwtSecret, {
      expiresIn: "1d"
    });

    return res.status(201).json({ token, user });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;

    const result = await pool.query(
      `SELECT id, email, display_name, role, password_hash
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rowCount === 0) {
      throw new HttpError(401, "Invalid credentials");
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new HttpError(401, "Invalid credentials");
    }

    const token = jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.jwtSecret, {
      expiresIn: "1d"
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.sub;
    const result = await pool.query(
      "SELECT id, email, display_name, role, created_at FROM users WHERE id = $1",
      [userId]
    );

    if (result.rowCount === 0) {
      throw new HttpError(404, "User not found");
    }

    return res.json({ user: result.rows[0] });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
