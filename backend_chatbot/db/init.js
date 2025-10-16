import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import fs from "fs";

const dbPath = path.resolve("./db/database.sqlite");

async function init() {
  try {
    // Crear carpeta si no existe
    if (!fs.existsSync("./db")) {
      fs.mkdirSync("./db", { recursive: true });
      console.log("📁 Carpeta 'db' creada.");
    }

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS sugerencias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mensaje TEXT NOT NULL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log(`✅ Base de datos inicializada correctamente en: ${dbPath}`);
    await db.close();
  } catch (error) {
    console.error("❌ Error al inicializar la base de datos:", error);
  }
}

init();
