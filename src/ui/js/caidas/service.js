// src/ui/js/caidas/service.js

// Datos en memoria
export let allNotifications = [];
export let allCaidas = [];
export let allStaff = [];
export let allResidents = [];

// Mapas rápidos _id → nombre completo
export let allStaffMap = {};
export let allResidentsMap = {};

/**
 * Convierte ObjectId o string a hexadecimal
 */
function idToString(id) {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (id._bsontype === 'ObjectID') return id.toHexString();
  if (id.buffer) {
    return Array.from(id.buffer).map(b => b.toString(16).padStart(2,'0')).join('');
  }
  return '';
}

/**
 * Carga todos los datos desde Mongo y prepara los mapas
 */
export async function loadAllData() {
  allNotifications = await window.api.queryMongo('notificaciones_albergue') || [];
  allCaidas = await window.api.queryMongo('registro_caidas_albergue') || [];
  allStaff = await window.api.queryMongo('personal_albergue') || [];
  allResidents = await window.api.queryMongo('residentes_albergue') || [];

  console.log('All Notifications:', allNotifications);
  console.log('All Caidas:', allCaidas);       // <--- revisa aquí los documentos
  console.log('All Staff:', allStaff);
  console.log('All Residents:', allResidents);

  // Mapas rápidos
  allStaffMap = allStaff.reduce((acc, s) => {
    if (s._id) acc[idToString(s._id)] = `${s.nombre} ${s.apellido}`;
    return acc;
  }, {});

  allResidentsMap = allResidents.reduce((acc, r) => {
    if (r._id) acc[idToString(r._id)] = `${r.nombre} ${r.apellido}`;
    return acc;
  }, {});
}

export async function initData() {
  await loadAllData();                      // Espera a que se carguen los datos
  console.log('Preparadas:', getPreparedNotifications());
}
/**
 * Devuelve todas las notificaciones ya combinadas con caídas, staff y residentes
 */
export function getPreparedNotifications() {
  const prepared = allNotifications.map(n => {
    const nId = idToString(n._id);
    const reg = allCaidas.find(c => idToString(c.notificationId) === nId) || {};

    const userName = allStaffMap[idToString(reg.userId)] || '';
    const professionals = (reg.professionals || [])
      .map(id => allStaffMap[idToString(id)] || '')
      .filter(Boolean)
      .join(', ');
    const residents = (reg.residents || [])
      .map(id => allResidentsMap[idToString(id)] || '')
      .filter(Boolean)
      .join(', ');

    return {
      _id: nId,
      camara: n.camara,
      timestamp: n.timestamp,
      user: userName,
      professionals,
      residents,
      caida: reg.caida || false,
      severity: reg.severity || '',
      comments: reg.comments || '',
      interventionTime: reg.interventionTime || '',
      regId: reg._id ? idToString(reg._id) : null
    };
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  console.log('Prepared Notifications:', prepared);

  return prepared;
}
