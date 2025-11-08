/** const { v4: uuidv4 } = require("uuid");
const { connectDB } = require("../config/database");

async function insertTiposPersonal() {
  try {
    const db = await connectDB();
    const collection = db.collection("tipos_personal");

    const tipos = [
      "tec enfermeria",
      "lic enfermeria",
      "cuidador",
      "coordinador de enf",
      "medico"
    ];

    // Preparar documentos con uuid
    const documentos = tipos.map(nombre => ({
      id: uuidv4(),
      nombre
    }));

    const result = await collection.insertMany(documentos);
    console.log(`✅ Insertados ${result.insertedCount} tipos de personal`);

  } catch (err) {
    console.error("❌ Error insertando tipos_personal:", err);
  } finally {
    process.exit(0); // termina el script
  }
}

insertTiposPersonal(); */
