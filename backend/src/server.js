import "dotenv/config";
import http from "http";
import { Server } from "socket.io";

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { registerSocketHandlers } from "./socket/socketHandler.js";

const PORT = Number(process.env.PORT) || 4000;

async function bootstrap() {
  await connectDB();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((o) => o.trim()),
      credentials: true,
    },
  });

  registerSocketHandlers(io);
  // REST controllers broadcast through app.get("io")
  app.set("io", io);

  server.listen(PORT, () => {
    console.log(`[server] ChatConnect backend listening on http://localhost:${PORT}`);
    console.log(`[server] Allowed client origin: ${process.env.CLIENT_ORIGIN || "http://localhost:5173"}`);
  });
}

bootstrap().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});
