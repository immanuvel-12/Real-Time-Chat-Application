import { verifyToken } from "../utils/token.js";
import { TOKEN_COOKIE_NAME } from "../utils/token.js";
import { User } from "../models/User.js";

/**
 * Authentication middleware for Express APIs.
 * Reads the JWT from the httpOnly cookie (Authorization: Bearer also accepted
 * for tools/testing). Attaches the user document to req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    let token = req.cookies?.[TOKEN_COOKIE_NAME];

    if (!token) {
      const header = req.headers?.authorization;
      if (header?.startsWith("Bearer ")) token = header.slice(7);
    }

    const decoded = verifyToken(token);
    if (!decoded?.sub) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const user = await User.findById(decoded.sub).select("+password");
    if (!user) return res.status(401).json({ message: "Authentication required." });

    // Never send the hash further along the request
    user.password = undefined;
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
