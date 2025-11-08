// edit/utils.js
export const normalize = t => (t || '').toString()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-\u036f]/g, '');

export function idToString(id) {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (id._bsontype === 'ObjectID') return id.toHexString();
  if (id.buffer) return Array.from(id.buffer).map(b => b.toString(16).padStart(2, '0')).join('');
  return '';
}

export function toLocalDateTimeInputString(date) {
  if (!date) return '';
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function formatTime(date) {
  return date
    ? new Date(date).toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    : '-';
}

export function formatDateTime(date) {
  return date
    ? new Date(date).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    : '-';
}
