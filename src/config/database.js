// src/config/database.js
const fs = require("fs");
const path = require("path");
const { MongoClient, ServerApiVersion } = require("mongodb");

// === RUTA DEL JSON DE CONFIGURACIÓN ===
let CONFIG_PATH;

// Si está empaquetado (modo producción / .exe)
if (process.defaultApp === false || process.env.NODE_ENV === "production") {
  // busca junto al ejecutable
  CONFIG_PATH = path.join(process.cwd(), "system_local.json");
} else {
  // modo desarrollo
  CONFIG_PATH = path.join(__dirname, "..", "..", "system_local.json");
}

// === CARGAR CONFIGURACIÓN ===
let mongoConfig;
try {
  const configData = fs.readFileSync(CONFIG_PATH, "utf-8");
  mongoConfig = JSON.parse(configData);
} catch (err) {
  console.error("[DB] Error leyendo system_local.json:", err);
  process.exit(1);
}

const uri = mongoConfig.MONGO_URI;
const dbName = mongoConfig.MONGO_DB_NAME;

// === CONEXIÓN MONGO ===
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

async function connectDB() {
  try {
    if (!db) {
      await client.connect();
      db = client.db(dbName);
      console.log(`✅ Conectado a MongoDB Atlas (DB: ${dbName})`);
    }
    return db;
  } catch (err) {
    console.error("❌ Error al conectar a MongoDB:", err);
    throw err;
  }
}

module.exports = { connectDB };
