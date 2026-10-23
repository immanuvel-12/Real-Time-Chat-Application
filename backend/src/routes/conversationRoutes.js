import { Router } from "express";
import { getConversations, getConversationById } from "../controllers/conversationController.js";
import { createConversation } from "../controllers/userController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/", requireAuth, createConversation); // POST /api/conversations
router.get("/", requireAuth, getConversations);
router.get("/:id", requireAuth, getConversationById);

export default router;
