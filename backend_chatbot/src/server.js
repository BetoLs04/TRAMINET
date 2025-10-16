import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import chatbotRoutes from "./routes/chatbot_routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ruta del chatbot
app.use("/chatbot", chatbotRoutes);

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`🤖 Servidor del chatbot corriendo en http://localhost:${PORT}`);
});

