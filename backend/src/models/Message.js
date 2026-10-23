import mongoose from "mongoose";

const MAX_MESSAGE_LENGTH = 2000;

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
      minlength: 1,
      maxlength: [MAX_MESSAGE_LENGTH, `Message must be at most ${MAX_MESSAGE_LENGTH} characters`],
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for fast history queries: history is always
// conversationId + createdAt ordered, newest last / paged backwards.
messageSchema.index({ conversationId: 1, createdAt: 1 });
messageSchema.index({ conversationId: 1, readAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
export const MESSAGE_MAX_LENGTH = MAX_MESSAGE_LENGTH;
