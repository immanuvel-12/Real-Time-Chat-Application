import { Router } from "express";
import { getMessages, sendMessage, markRead } from "../controllers/messageController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/:conversationId", requireAuth, getMessages);
router.post("/", requireAuth, sendMessage); // POST /api/messages
router.put("/read/:conversationId", requireAuth, markRead);

export default router;
