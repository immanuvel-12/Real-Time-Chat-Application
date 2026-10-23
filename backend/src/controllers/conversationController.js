import { Conversation } from "../models/Conversation.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";

/**
 * GET /api/conversations
 * The authenticated user's conversations with the other participant
 * populated and the lastMessage preview.
 */
export async function getConversations(req, res, next) {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate("participants", "username email profileImage isOnline lastSeen")
      .populate("lastMessage.senderId", "username")
      .sort({ updatedAt: -1 })
      .lean();

    // Shape the response: include the "other" user directly for the UI.
    const shaped = conversations.map((c) => {
      const other = (c.participants || []).find(
        (p) => p._id.toString() !== req.user._id.toString()
      );
      return {
        _id: c._id,
        participants: c.participants,
        other: other || null,
        lastMessage: c.lastMessage
          ? {
              content: c.lastMessage.content,
              senderId: c.lastMessage.senderId,
              createdAt: c.lastMessage.createdAt,
              isMine: c.lastMessage.senderId
                ? c.lastMessage.senderId._id?.toString() === req.user._id.toString()
                : false,
            }
          : null,
        updatedAt: c.updatedAt,
      };
    });

    res.json({ conversations: shaped });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/conversations/:id
 * Single conversation. Only participants may read it.
 */
export async function getConversationById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid conversation id." });
    }

    const conversation = await Conversation.findById(id)
      .populate("participants", "username email profileImage isOnline lastSeen")
      .lean();

    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "You are not a participant of this conversation." });
    }

    const other = conversation.participants.find(
      (p) => p._id.toString() !== req.user._id.toString()
    );

    res.json({ conversation: { ...conversation, other: other || null } });
  } catch (err) {
    next(err);
  }
}
