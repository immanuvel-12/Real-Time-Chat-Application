import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import { notFoundHandler, errorMiddleware } from "./middleware/errorMiddleware.js";

const app = express();

// CORS: the frontend origin comes from the environment. Credentials are
// required so the httpOnly auth cookie travels with every request.
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // allow non-browser tools (curl, Postman) with no origin header
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . keys from user input (NoSQL injection)

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true, name: "ChatConnect API" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

app.use(notFoundHandler);
app.use(errorMiddleware);

export default app;
