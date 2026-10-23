import mongoose from "mongoose";

let isConnected = false;

/**
 * Connect to MongoDB Atlas with Mongoose.
 * Reads MONGODB_URI from the environment (never hardcoded, never logged).
 */
export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      "[db] MONGODB_URI is not set. Copy backend/.env.example to backend/.env " +
        "and paste your MongoDB Atlas connection string, then restart the server."
    );
    process.exit(1);
  }

  if (isConnected) return mongoose.connection;

  mongoose.set("strictQuery", true);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    isConnected = true;
    console.log(`[db] MongoDB connected -> ${conn.connection.name || "default database"}`);

    mongoose.connection.on("error", (err) => {
      console.error("[db] MongoDB runtime error:", err.message);
    });
    mongoose.connection.on("disconnected", () => {
      console.warn("[db] MongoDB disconnected. Mongoose will try to reconnect.");
    });

    return conn;
  } catch (err) {
    console.error("[db] Could not connect to MongoDB Atlas.");
    console.error("[db] Check that:");
    console.error("     1. The MONGODB_URI in backend/.env is correct and complete.");
    console.error("     2. The database user exists and the password is correct");
    console.error("        (URL-encode special characters in the password, e.g. @ -> %40).");
    console.error("     3. Atlas -> Network Access allows your current IP (0.0.0.0/0 for dev).");
    console.error("     4. The user has read/write permissions on the target database.");
    console.error(`[db] Reason: ${err.message}`);
    process.exit(1);
  }
}

export function getDBConnection() {
  return mongoose.connection;
}
