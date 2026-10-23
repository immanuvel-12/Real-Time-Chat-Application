import jwt from "jsonwebtoken";

export const TOKEN_COOKIE_NAME = "chatconnect_token";

/**
 * Sign a JWT for a user id. Secret comes from the environment only.
 */
export function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured. Set it in backend/.env.");
  }
  return jwt.sign({ sub: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

/**
 * Verify a JWT and return the decoded payload, or null when invalid/expired.
 */
export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret || !token) return null;
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

/**
 * Cookie options for the auth token. Secure + SameSite are configurable
 * through the environment for production deployments.
 */
export function getAuthCookieOptions() {
  const secure = String(process.env.COOKIE_SECURE || "false") === "true";
  let sameSite = process.env.COOKIE_SAMESITE || (secure ? "None" : "Lax");
  sameSite = sameSite.toLowerCase() === "none" ? "none" : sameSite.toLowerCase() === "strict" ? "strict" : "lax";

  return {
    httpOnly: true,
    secure, // true in production (HTTPS) so the cookie is never sent over plain HTTP
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, aligned with JWT_EXPIRES_IN default
    path: "/",
  };
}

export function setAuthCookie(res, token) {
  res.cookie(TOKEN_COOKIE_NAME, token, getAuthCookieOptions());
}

export function clearAuthCookie(res) {
  const options = getAuthCookieOptions();
  res.clearCookie(TOKEN_COOKIE_NAME, { ...options, maxAge: undefined });
}
