/**
 * 404 handler for unknown API routes.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/**
 * Central error middleware. Keeps internal details out of client responses
 * while logging them server-side.
 */
export function errorMiddleware(err, _req, res, _next) {
  const status = err?.statusCode || 500;

  // Mongoose validation / cast / duplicate errors -> readable 400s
  if (err?.name === "ValidationError" && status === 500) {
    const first = Object.values(err.errors || {})[0];
    return res.status(400).json({ message: first?.message || "Invalid data." });
  }
  if (err?.name === "CastError") {
    return res.status(400).json({ message: "Invalid id." });
  }
  if (err?.code === 11000) {
    return res.status(409).json({ message: "This value already exists." });
  }

  if (status >= 500) {
    console.error("[error]", err?.stack || err);
  }

  res.status(status).json({
    message: status >= 500 ? "Something went wrong on the server." : err?.message || "Request failed.",
  });
}
