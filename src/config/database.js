// main/database.js
import fs from 'fs';
import path from 'path';
import { MongoClient, ServerApiVersion } from 'mongodb';

let CONFIG_PATH = path.join(__dirname, '..', 'system_local.json');

let mongoConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

const client = new MongoClient(mongoConfig.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;
export async function getDB() {
  if (!db) {
    await client.connect();
    db = client.db(mongoConfig.MONGO_DB_NAME);
    console.log(`✅ Conectado a MongoDB Atlas (DB: ${mongoConfig.MONGO_DB_NAME})`);
  }
  return db;
}
