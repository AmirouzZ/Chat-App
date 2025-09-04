import express from "express";
import authRoutes from "./auth.js";
import chatRoutes from "./chat.js";

const router = express.Router();

router.use("/api", authRoutes);
router.use("/", chatRoutes);

export default router;