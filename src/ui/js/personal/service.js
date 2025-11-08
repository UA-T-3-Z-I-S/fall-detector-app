export let tiposMap = {};
export let allStaff = [];

export async function loadTipos() {
  const tipos = await window.api.queryMongo('tipos_personal');
  tiposMap = {};
  tipos.forEach(t => tiposMap[t.id] = t.nombre);
}

export async function loadStaff() {
  allStaff = await window.api.queryMongo('personal_albergue');
}

// updateStaff apunta a _id, no a id
export async function updateStaff(_id, data) {
  await window.api.updateMongo('personal_albergue', _id, data);

  const index = allStaff.findIndex(s => s._id === _id);
  if (index > -1) allStaff[index] = { ...allStaff[index], ...data };
}

export function getStaffData() {
  return { allStaff, tiposMap };
}
