import { signToken, setAuthCookie, clearAuthCookie, verifyToken } from "../utils/token.js";
import { User } from "../models/User.js";

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{2,30}$/;

/**
 * POST /api/auth/register
 * Body: { username, email, password, confirmPassword }
 */
export async function register(req, res, next) {
  try {
    const username = String(req.body?.username ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    const confirmPassword = String(req.body?.confirmPassword ?? "");

    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({
        message: "Username must be 2-30 characters (letters, numbers, dots, dashes or underscores).",
      });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const existing = await User.findOne({ email }).select("_id").lean();
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({ username, email, password });

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);

    res.status(201).json({ user });
  } catch (err) {
    // Mongo duplicate key (race between two registrations)
    if (err && err.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login(req, res, next) {
  try {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");

    if (!EMAIL_RE.test(email) || !password) {
      return res.status(400).json({ message: "Please provide a valid email and password." });
    }

    // password is excluded by default, so select it explicitly here
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const matches = await user.comparePassword(password);
    if (!matches) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = signToken(user._id.toString());
    setAuthCookie(res, token);

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout  (auth required)
 * Clears the auth cookie and marks the user offline.
 */
export async function logout(req, res, next) {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date(),
    });
    clearAuthCookie(res);
    res.json({ message: "Logged out successfully." });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me  (auth required)
 * Returns the authenticated user's profile.
 */
export async function me(req, res, next) {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
}

export { verifyToken };
