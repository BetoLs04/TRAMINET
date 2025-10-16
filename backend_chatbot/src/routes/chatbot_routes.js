import express from "express";
import { handleUserMessage } from "../services/chatbot_services.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { message, context, session } = req.body;
    const response = await handleUserMessage(message, context, session);
    res.json(response);
  } catch (error) {
    console.error("❌ Error en chatbot:", error);
    res.status(500).json({ reply: "Error interno del servidor." });
  }
});

export default router;
