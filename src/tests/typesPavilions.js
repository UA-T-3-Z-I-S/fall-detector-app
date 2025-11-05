/** Script para insertar tipos de pabellón */

const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");

const MONGO_URI = "mongodb+srv://paredes175_db_user:EZ3Wa3RxtN9xDHW1@bd-albergue.q4kzwzm.mongodb.net/?appName=BD-Albergue";
const DB_NAME = "Sistema_Albergue";

async function insertTiposPabellon() {
  const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection("tipos_pabellon");

    const tipos = ["Funcional", "Dependiente"];

    // Preparar documentos con uuid
    const documentos = tipos.map(nombre => ({
      id: uuidv4(),
      nombre
    }));

    const result = await collection.insertMany(documentos);
    console.log(`✅ Insertados ${result.insertedCount} tipos de pabellón`);

  } catch (err) {
    console.error("❌ Error insertando tipos_pabellon:", err);
  } finally {
    await client.close();
    process.exit(0); // termina el script
  }
}

insertTiposPabellon();
