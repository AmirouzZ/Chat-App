import express from "express";
import { renderChatPage, healthCheck } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/", renderChatPage);
router.get("/health", healthCheck);

export default router;