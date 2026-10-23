import { User } from "../models/User.js";
import { Conversation, pairKey } from "../models/Conversation.js";
import mongoose from "mongoose";

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * GET /api/users
 * All users except the current one (for starting new chats).
 */
export async function getAllUsers(req, res, next) {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("username email profileImage isOnline lastSeen")
      .sort({ username: 1 })
      .limit(200)
      .lean();
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/search?q=searchTerm
 * Case-insensitive search on username and email.
 */
export async function searchUsers(req, res, next) {
  try {
    const q = String(req.query?.q ?? "").trim();
    if (!q) return res.json({ users: [] });

    const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(escape(q), "i");

    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ username: rx }, { email: rx }],
    })
      .select("username email profileImage isOnline lastSeen")
      .limit(20)
      .lean();

    res.json({ users });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/:id
 */
export async function getUserById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid user id." });
    }
    const user = await User.findById(id)
      .select("username email profileImage isOnline lastSeen createdAt")
      .lean();
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/users/profile
 * Body: { username?, profileImage? }
 * profileImage must be a validated image URL (http/https, .png/.jpg/.jpeg/.gif/.webp)
 */
export async function updateProfile(req, res, next) {
  try {
    const updates = {};

    if (req.body?.username !== undefined) {
      const username = String(req.body.username).trim();
      if (!/^[a-zA-Z0-9_.-]{2,30}$/.test(username)) {
        return res.status(400).json({
          message: "Username must be 2-30 characters (letters, numbers, dots, dashes or underscores).",
        });
      }
      updates.username = username;
    }

    if (req.body?.profileImage !== undefined) {
      const url = String(req.body.profileImage).trim();
      if (url === "") {
        updates.profileImage = "";
      } else if (/^https?:\/\/\S+\.(png|jpe?g|gif|webp|svg)(\?\S*)?$/i.test(url) && url.length <= 1000) {
        updates.profileImage = url;
      } else {
        return res.status(400).json({
          message: "Profile image must be an https:// or http:// URL ending in .png, .jpg, .jpeg, .gif, .webp or .svg.",
        });
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "Nothing to update." });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/conversations
 * Body: { participantId }
 * Creates (or returns the existing) direct conversation with another user.
 * Lives here because it needs the pairKey helper.
 */
export async function createConversation(req, res, next) {
  try {
    const participantId = String(req.body?.participantId ?? "");
    if (!mongoose.isValidObjectId(participantId)) {
      return res.status(400).json({ message: "Invalid participant id." });
    }
    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot start a conversation with yourself." });
    }

    const participant = await User.findById(participantId)
      .select("username email profileImage isOnline lastSeen")
      .lean();
    if (!participant) return res.status(404).json({ message: "User not found." });

    const key = pairKey(req.user._id, participantId);
    let conversation = await Conversation.findOne({ key }).lean();
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, participantId],
      });
    }

    res.status(201).json({ conversation, participant });
  } catch (err) {
    next(err);
  }
}
