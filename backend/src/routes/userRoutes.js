import { Router } from "express";
import { getAllUsers, searchUsers, getUserById, updateProfile, createConversation } from "../controllers/userController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, getAllUsers);
router.get("/search", requireAuth, searchUsers);
router.get("/:id", requireAuth, getUserById);
router.put("/profile", requireAuth, updateProfile);

export default router;
