const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const adminRoutes = require("./routes/admin");
const metaRoutes = require("./routes/meta");
const favoriteRoutes = require("./routes/favorites");
const reviewRoutes = require("./routes/reviews");
const meRoutes = require("./routes/me");
const userRoutes = require("./routes/users");
const notificationRoutes = require("./routes/notifications");
const errorHandler = require("./middleware/error-handler");

const app = express();

app.use(cors());
app.use(express.json({ limit: "8mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/meta", metaRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/me", meRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);

module.exports = app;
