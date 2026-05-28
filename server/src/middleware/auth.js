const jwt = require("jsonwebtoken");
const env = require("../config/env");
const HttpError = require("../utils/http-error");

function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next(new HttpError(401, "Authentication required"));
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch (_error) {
    return next(new HttpError(401, "Invalid or expired token"));
  }
}

function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== "ADMIN") {
    return next(new HttpError(403, "Admin access required"));
  }
  return next();
}

module.exports = {
  requireAuth,
  requireAdmin
};
