// src/ui/js/caidas/edit/save.js
import { idToString } from './utils.js';

export async function saveRecord(ctx) {
  const { notification, userField, professionalsField, residentsField,
    caidaSelect, severitySelect, obsInput, timeInput } = ctx;

  const now = new Date().toISOString();
  const isCaida = caidaSelect.value === 'Sí';

  const newRecord = {
    userId: userField.getId(), // <-- CORREGIDO
    professionals: isCaida ? professionalsField.getSelected() : [],
    residents: isCaida ? residentsField.getSelected() : [],
    caida: isCaida,
    severity: isCaida ? severitySelect.value : '',
    comments: isCaida ? obsInput.value : '',
    interventionTime: isCaida ? (timeInput.value ? new Date(timeInput.value).toISOString() : now) : null,
    notificationId: notification._id,
    updated_at: now
  };

  if (!notification.regId) {
    await window.api.insertMongo('registro_caidas_albergue', newRecord);
  } else {
    await window.api.updateMongo('registro_caidas_albergue', notification.regId, newRecord);
  }
}

export async function deleteRecord(ctx) {
  const { notification } = ctx;
  const matches = await window.api.queryMongo('registro_caidas_albergue', { notificationId: notification._id }) || [];

  for (const reg of matches) {
    const id = idToString(reg._id);
    await window.api.deleteMongo('registro_caidas_albergue', id);
  }
}
