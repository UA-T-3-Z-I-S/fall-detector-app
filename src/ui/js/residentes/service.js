// src/ui/js/residentes/service.js

export let pabellonesMap = {};
export let allResidents = [];

/**
 * Carga los tipos de pabellón desde MongoDB
 */
export async function loadPabellones() {
  const pabellones = await window.api.queryMongo('tipos_pabellon');
  pabellonesMap = {};
  pabellones.forEach(p => pabellonesMap[p.id] = p.nombre);
}

/**
 * Carga todos los residentes
 */
export async function loadResidents() {
  allResidents = await window.api.queryMongo('residentes_albergue');
}

/**
 * Actualiza un residente en MongoDB y en memoria
 */
export async function updateResident(_id, data) {
  await window.api.updateMongo('residentes_albergue', _id, data);

  const index = allResidents.findIndex(r => r._id === _id);
  if (index > -1) allResidents[index] = { ...allResidents[index], ...data };
}

/**
 * Devuelve datos en memoria
 */
export function getResidentData() {
  return { allResidents, pabellonesMap };
}
