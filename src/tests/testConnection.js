// src/tests/testConnection.js
const path = require('path');
const { connectDB } = require(path.join(__dirname, '..', 'config', 'database.js'));

async function testConnection() {
  try {
    const db = await connectDB();
    const collections = await db.listCollections().toArray();
    console.log("Colecciones disponibles:", collections.map(c => c.name));
  } catch (error) {
    console.error("Error al conectar:", error);
  } finally {
    process.exit(0); // cerramos el proceso al final
  }
}

testConnection();
