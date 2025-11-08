import { MongoClient, ServerApiVersion } from 'mongodb';
import fs from 'fs';
import path from 'path';

let CONFIG_PATH = path.join(__dirname, '..', 'system_local.json');

let mongoConfig;
try {
  const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
  mongoConfig = JSON.parse(configData);
} catch (err) {
  console.error('[DB] Error leyendo system_local.json:', err);
  process.exit(1);
}

const uri = mongoConfig.MONGO_URI;
const dbName = mongoConfig.MONGO_DB_NAME;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

let db;

export async function initDB() {
  if (!db) {
    await client.connect();
    db = client.db(dbName);
    console.log(`✅ MongoDB inicializada (DB: ${dbName})`);
  }
  return db;
}

export function getDB() {
  if (!db) throw new Error('MongoDB aún no inicializada');
  return db;
}
