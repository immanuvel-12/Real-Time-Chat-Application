import { Message, MESSAGE_MAX_LENGTH } from "../models/Message.js";
import { Conversation } from "../models/Conversation.js";
import mongoose from "mongoose";

const PAGE_SIZE = 30;

/**
 * GET /api/messages/:conversationId?before=<ISO date>&limit=<n>
 * Cursor-based pagination: `before` is the createdAt cursor of the oldest
 * already-loaded message. Returns messages oldest -> newest.
 * Only participants may read a conversation's messages.
 */
export async function getMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id." });
    }

    const conversation = await Conversation.findById(conversationId).select("participants").lean();
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "You are not a participant of this conversation." });
    }

    const limit = Math.min(Math.max(parseInt(req.query?.limit, 10) || PAGE_SIZE, 1), 50);
    const beforeRaw = req.query?.before;
    const query = { conversationId };
    if (beforeRaw) {
      const before = new Date(String(beforeRaw));
      if (!Number.isNaN(before.getTime())) {
        query.createdAt = { $lt: before };
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // newest first, then reversed for the UI
      .limit(limit)
      .lean();

    messages.reverse();

    res.json({
      messages,
      hasMore: messages.length === limit,
      nextCursor: messages.length > 0 ? messages[0].createdAt : null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/messages
 * Body: { conversationId, message }
 * Persists a message, updates the conversation preview, and broadcasts it
 * through Socket.io to conversation participants only.
 * The sender is always taken from the authenticated user, never the body.
 */
export async function sendMessage(req, res, next) {
  try {
    const { conversationId, message } = req.body ?? {};

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id." });
    }
    const text = String(message ?? "").trim();
    if (!text) return res.status(400).json({ message: "Message text is required." });
    if (text.length > MESSAGE_MAX_LENGTH) {
      return res
        .status(400)
        .json({ message: `Message must be at most ${MESSAGE_MAX_LENGTH} characters.` });
    }

    const conversation = await Conversation.findById(conversationId).select("participants").lean();
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "You are not a participant of this conversation." });
    }

    const created = await Message.create({
      conversationId,
      senderId: req.user._id,
      message: text,
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        senderId: req.user._id,
        content: text.slice(0, 120),
        createdAt: created.createdAt,
      },
      updatedAt: new Date(),
    });

    // Broadcast to the conversation room via the running Socket.io server.
    const io = req.app.get("io");
    if (io) {
      io.to(conversationId).emit("receiveMessage", {
        ...created.toJSON(),
        tempId: req.body?.tempId ?? null,
      });
      // Notify the other participant's personal room so their sidebar updates.
      const otherId = conversation.participants
        .find((p) => p.toString() !== req.user._id.toString())
        .toString();
      io.to(otherId).emit("conversationUpdated", { conversationId });
    }

    res.status(201).json({ message: created });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/messages/read/:conversationId
 * Marks all of the other user's messages in the conversation as read.
 * Emits messageRead so the sender sees the receipt.
 */
export async function markRead(req, res, next) {
  try {
    const { conversationId } = req.params;
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id." });
    }

    const conversation = await Conversation.findById(conversationId).select("participants").lean();
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "You are not a participant of this conversation." });
    }

    const now = new Date();
    const result = await Message.updateMany(
      { conversationId, senderId: { $ne: req.user._id }, readAt: null },
      { readAt: now }
    );

    if (result.modifiedCount > 0) {
      const io = req.app.get("io");
      if (io) {
        io.to(conversationId).emit("messageRead", {
          conversationId,
          readerId: req.user._id.toString(),
          readAt: now.toISOString(),
        });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
