import cookie from "cookie";
import { verifyToken, TOKEN_COOKIE_NAME } from "../utils/token.js";
import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";
import { Message, MESSAGE_MAX_LENGTH } from "../models/Message.js";

/**
 * Socket.io handler: presence, real-time messaging, typing indicators and
 * read receipts.
 *
 * Security model:
 *  - Every socket is authenticated at handshake time from the JWT httpOnly
 *    cookie (or auth.token fallback). Unauthenticated sockets are rejected.
 *  - The sender of a message is ALWAYS derived from the authenticated socket
 *    identity — client-provided senderId is never trusted.
 *  - Conversation membership is verified server-side before any join, send,
 *    typing or read action.
 */

const onlineSockets = new Map(); // userId -> Set of socket ids

function getOnlineUserIds() {
  return [...onlineSockets.keys()];
}

function parseCookieToken(socket) {
  const header = socket.handshake.headers?.cookie;
  if (header) {
    const cookies = cookie.parse(header);
    if (cookies[TOKEN_COOKIE_NAME]) return cookies[TOKEN_COOKIE_NAME];
  }
  return socket.handshake.auth?.token ?? null;
}

export function registerSocketHandlers(io) {
  // ---- Handshake authentication ----
  io.use(async (socket, next) => {
    try {
      const token = parseCookieToken(socket);
      const decoded = verifyToken(token);
      if (!decoded?.sub) {
        return next(new Error("Authentication required"));
      }
      const user = await User.findById(decoded.sub).select("username email profileImage");
      if (!user) return next(new Error("Authentication required"));

      socket.data.user = {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      };
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.data.user;
    const userId = user._id;
    console.log(`[socket] connected: ${user.username} (${socket.id})`);

    // Personal room: lets the server notify a user across all their devices.
    socket.join(userId);

    // Track presence per user (multiple tabs/devices supported).
    const wasOffline = !onlineSockets.has(userId);
    if (!onlineSockets.has(userId)) onlineSockets.set(userId, new Set());
    onlineSockets.get(userId).add(socket.id);

    if (wasOffline) {
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() }).catch(() => {});
      socket.broadcast.emit("userOnline", { userId });
    }

    // Give the fresh client the current presence snapshot.
    socket.emit("onlineUsers", { onlineUserIds: getOnlineUserIds() });

    // Re-sync presence snapshot after a client reconnect.
    socket.on("resyncPresence", () => {
      socket.emit("onlineUsers", { onlineUserIds: getOnlineUserIds() });
    });

    // ---- Join a conversation room (membership verified) ----
    socket.on("joinConversation", async ({ conversationId }, ack) => {
      try {
        if (!isObjectId(conversationId)) {
          return ackOrEmit(socket, ack, { ok: false, message: "Invalid conversation id." });
        }
        const conversation = await Conversation.findById(conversationId).select("participants").lean();
        if (!conversation) {
          return ackOrEmit(socket, ack, { ok: false, message: "Conversation not found." });
        }
        const isParticipant = conversation.participants.some((p) => p.toString() === userId);
        if (!isParticipant) {
          return ackOrEmit(socket, ack, { ok: false, message: "Not a participant." });
        }
        socket.join(conversationId);
        ackOrEmit(socket, ack, { ok: true });
      } catch {
        ackOrEmit(socket, ack, { ok: false, message: "Could not join conversation." });
      }
    });

    socket.on("leaveConversation", ({ conversationId } = {}) => {
      if (isObjectId(conversationId)) socket.leave(conversationId);
    });

    // ---- Send a message ----
    socket.on("sendMessage", async ({ conversationId, message, tempId } = {}, ack) => {
      try {
        if (!isObjectId(conversationId)) {
          return ackOrEmit(socket, ack, { ok: false, message: "Invalid conversation id." });
        }
        const text = String(message ?? "").trim();
        if (!text) {
          return ackOrEmit(socket, ack, { ok: false, message: "Message text is required." });
        }
        if (text.length > MESSAGE_MAX_LENGTH) {
          return ackOrEmit(socket, ack, {
            ok: false,
            message: `Message must be at most ${MESSAGE_MAX_LENGTH} characters.`,
          });
        }

        const conversation = await Conversation.findById(conversationId).select("participants").lean();
        if (!conversation) {
          return ackOrEmit(socket, ack, { ok: false, message: "Conversation not found." });
        }
        const participants = conversation.participants.map((p) => p.toString());
        if (!participants.includes(userId)) {
          return ackOrEmit(socket, ack, { ok: false, message: "Not a participant." });
        }

        // Persist BEFORE confirming delivery.
        const created = await Message.create({
          conversationId,
          senderId: userId,
          message: text,
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: {
            senderId: userId,
            content: text.slice(0, 120),
            createdAt: created.createdAt,
          },
          updatedAt: new Date(),
        });

        const payload = { ...created.toJSON(), tempId: tempId ?? null };

        // Everyone in the conversation room (including the sender's other tabs).
        io.to(conversationId).emit("receiveMessage", payload);
        // Sidebar preview update for the other participant.
        const otherId = participants.find((p) => p !== userId);
        io.to(otherId).emit("conversationUpdated", { conversationId });

        ackOrEmit(socket, ack, { ok: true, message: payload });
      } catch {
        ackOrEmit(socket, ack, { ok: false, message: "Could not send message." });
      }
    });

    // ---- Typing indicators (only visible to other participants) ----
    socket.on("typing", async ({ conversationId } = {}) => {
      if (!isObjectId(conversationId)) return;
      const ok = await isMember(conversationId, userId);
      if (ok) socket.to(conversationId).emit("typing", { conversationId, userId });
    });

    socket.on("stopTyping", ({ conversationId } = {}) => {
      if (isObjectId(conversationId)) {
        socket.to(conversationId).emit("stopTyping", { conversationId, userId });
      }
    });

    // ---- Read receipts ----
    socket.on("messageRead", async ({ conversationId } = {}) => {
      try {
        if (!isObjectId(conversationId)) return;
        const ok = await isMember(conversationId, userId);
        if (!ok) return;

        const now = new Date();
        await Message.updateMany(
          { conversationId, senderId: { $ne: userId }, readAt: null },
          { readAt: now }
        );
        io.to(conversationId).emit("messageRead", {
          conversationId,
          readerId: userId,
          readAt: now.toISOString(),
        });
      } catch {
        // read receipts are best-effort
      }
    });

    // ---- Disconnect: update lastSeen and presence ----
    socket.on("disconnect", async () => {
      const sockets = onlineSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineSockets.delete(userId);
          const lastSeen = new Date();
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen }).catch(() => {});
          socket.broadcast.emit("userOffline", { userId, lastSeen: lastSeen.toISOString() });
        }
      }
      console.log(`[socket] disconnected: ${user.username} (${socket.id})`);
    });
  });
}

function isObjectId(value) {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

async function isMember(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId).select("participants").lean();
  if (!conversation) return false;
  return conversation.participants.some((p) => p.toString() === userId);
}

// Supports both callback-style and fire-and-forget event handlers.
function ackOrEmit(socket, ack, payload) {
  if (typeof ack === "function") ack(payload);
  else socket.emit("socketError", payload);
}
