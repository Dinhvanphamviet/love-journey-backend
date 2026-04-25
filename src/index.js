import express from "express";
import cors from "cors";
import "dotenv/config";
import { authRoutes } from "./routes/authRoutes.js";
import { journeyRoutes } from "./routes/journeyRoutes.js";
import { memoryRoutes } from "./routes/memoryRoutes.js";

const app = express();
const port = process.env.PORT || 5000;
const allowedOrigins =
  process.env.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) || [];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowedDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
      if (allowedOrigins.includes(origin) || isAllowedDevOrigin) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", name: "Couple Journey API" });
});

app.use("/auth", authRoutes);
app.use("/journey", journeyRoutes);
app.use(memoryRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, _req, res, _next) => {
  const status = error.status || 500;
  const message = status === 500 ? "Internal server error" : error.message;

  if (status === 500) {
    console.error(error);
  }

  res.status(status).json({ message });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
