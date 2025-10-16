import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

async function getDB() {
  return open({
    filename: path.resolve("./db/database.sqlite"),
    driver: sqlite3.Database,
  });
}

export async function handleUserMessage(message, context = "inicio") {
  const text = message.toLowerCase().trim();

  console.log("📥 Mensaje recibido:", text);
  console.log("🧭 Contexto actual:", context);

  // 🔁 Si el usuario escribe "menú" o "menu" en cualquier momento
  if (text === "menu" || text === "menú") {
    console.log("🔄 Regresando al menú principal...");
    return {
      message:
        "Has regresado al menú principal.\n\n¿En qué puedo ayudarte hoy?",
      options: [
        "1️⃣ Consultar CURP",
        "2️⃣ Descargar Acta de Nacimiento",
        "3️⃣ Realizar un Pago",
        "4️⃣ Contactar Soporte",
      ],
      nextContext: "menu_principal",
    };
  }

  switch (context) {
    // ======== INICIO ========
    case "inicio":
      return {
        message:
          "👋 ¡Hola! Bienvenido a TramiNet, tu asistente para guiarte paso a paso en trámites digitales.\n\nPuedes escribir “menú” en cualquier momento para volver al inicio.\n\n¿Cómo puedo ayudarte hoy?",
        options: [
          "1️⃣ Consultar CURP",
          "2️⃣ Descargar Acta de Nacimiento",
          "3️⃣ Realizar un Pago",
          "4️⃣ Contactar Soporte",
        ],
        nextContext: "menu_principal",
      };

    case "menu_principal":
      if (text.includes("1")) {
        return {
          message:
            "🪪 *Guía para consultar tu CURP:*\n1️⃣ Ingresa a: https://www.gob.mx/curp\n2️⃣ Escribe tu nombre completo y fecha de nacimiento.\n3️⃣ Descarga tu CURP en PDF o recíbela en tu correo electrónico o bien dirígete al módulo correspondiente dentro del sistema.",
          nextContext: "menu_retorno",
        };
      }


      if (text.includes("2")) {
        return {
          message:
            "📄 *Guía para descargar tu Acta de Nacimiento:*\n1️⃣ Ingresa a tu cuenta dentro del sistema TramiNet.\n2️⃣ Dirígete al módulo Acta de Nacimiento.\n3️⃣ Completa la solicitud con tus datos personales.\n4️⃣ El sistema procesará tu solicitud y te permitirá descargar el acta directamente en formato PDF.\n\n✅ No necesitas salir de la plataforma.",
          nextContext: "menu_retorno",
        };
      }

      // ✅ Pagos con Mercado Pago
      if (text.includes("3")) {
        return {
          message:
            "💳 Guía para realizar un pago de trámite:\n1️⃣ Ingresa al módulo de Pagos dentro del sistema TramiNet.\n2️⃣ Introduce tu número de referencia o selecciona el trámite a pagar.\n3️⃣ Elige la opción de Mercado Pago como método de pago.\n4️⃣ Accede con tu cuenta o introduce los datos de tu tarjeta directamente en la plataforma de Mercado Pago.\n5️⃣ Una vez confirmado el pago, guarda el comprobante.\n6️⃣ Luego da clic en Verificar Pago para confirmar y obtener tu documento.\n\n✅ Recibirás una notificación cuando el pago sea verificado.",
          nextContext: "menu_retorno",
        };
      }

      if (text.includes("4")) {
        return {
          message:
            "📬 *Buzón de sugerencias TramiNet:*\nPor favor, escribe tu sugerencia, comentario o problema. Nuestro equipo la revisará y tomará en cuenta para futuras mejoras.\n\n💡 (Escribe “menú” en cualquier momento para volver al inicio.)",
          nextContext: "buzon_sugerencias",
        };
      }

      return {
        message:
          "No entendí esa opción 😅. Por favor, elige una de las siguientes o escribe “menú” para regresar:",
        options: [
          "1️⃣ Consultar CURP",
          "2️⃣ Descargar Acta de Nacimiento",
          "3️⃣ Realizar un Pago",
          "4️⃣ Buzon de sugerencias",
        ],
        nextContext: "menu_principal",
      };

    // ======== BUZÓN DE SUGERENCIAS ========
    case "buzon_sugerencias":
      try {
        const db = await getDB();
        await db.run("INSERT INTO sugerencias (mensaje) VALUES (?)", [message]);
        await db.close();
        console.log("📝 Sugerencia guardada en la base de datos:", message);

        return {
          message:
            "¡Gracias por tu sugerencia! La hemos recibido correctamente.\n\nPuedes escribir “menú” para volver al inicio o seguir escribiendo otra idea.",
          nextContext: "menu_retorno",
        };
      } catch (error) {
        console.error("Error al guardar la sugerencia:", error);
        return {
          message:
            "⚠️ Ocurrió un error al guardar tu sugerencia. Inténtalo de nuevo o escribe “menú” para volver al inicio.",
          nextContext: "menu_retorno",
        };
      }

    // ======== MENÚ DE RETORNO ========
    case "menu_retorno":
      return {
        message:
          "¿Deseas hacer otra consulta? Puedes escribir “menú” para volver al inicio o hacer otra pregunta.",
        nextContext: "menu_principal",
      };

    // ======== DEFAULT ========
    default:
      return {
        message:
          "No entendí eso 😅. Escribe “menú” para volver al inicio o selecciona una opción.",
        nextContext: "menu_principal",
      };
  }
}
