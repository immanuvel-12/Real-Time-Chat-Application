import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    // Deterministic, sorted "userIdA|userIdB" pair key.
    // The unique index on this field reliably prevents duplicate
    // direct conversations between the same two users.
    key: {
      type: String,
      required: true,
      unique: true,
    },
    lastMessage: {
      type: {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content: { type: String, default: "" },
        createdAt: { type: Date },
      },
      default: null,
      _id: false,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
    toJSON: {
      transform(_doc, ret) {
        delete ret.key;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Build the deterministic pair key before validation so the unique index works.
conversationSchema.pre("validate", function buildPairKey(next) {
  if (!Array.isArray(this.participants) || this.participants.length !== 2) {
    this.invalidate("participants", "A conversation must have exactly two participants");
    return next();
  }
  const [a, b] = this.participants.map((p) => p.toString());
  if (a === b) {
    this.invalidate("participants", "A conversation needs two different users");
    return next();
  }
  this.participants = [a, b];
  this.key = [a, b].sort().join("|");
  next();
});

// Build the sorted pair key for a lookup (does not depend on input order).
export function pairKey(a, b) {
  return [a.toString(), b.toString()].sort().join("|");
}

export const Conversation = mongoose.model("Conversation", conversationSchema);
