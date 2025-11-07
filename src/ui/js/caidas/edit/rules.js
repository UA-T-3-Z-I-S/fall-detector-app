export async function validateBeforeSave(ctx) {
  const { caidaSelect, userField, professionalsField, residentsField, severitySelect, inlineError } = ctx;

  inlineError.style.display = 'none';

  const val = caidaSelect.value;
  const user = userField.getId();        // <-- CORREGIDO
  const profs = professionalsField.getSelected();
  const res = residentsField.getSelected();

  if (val === '-') {
    return { ok: true, mode: 'delete' };
  }

  if (val === 'No') {
    if (!user) return { ok: false, msg: 'Selecciona un responsable válido.' };
    return { ok: true, mode: 'save-no' };
  }

  if (val === 'Sí') {
    if (!user) return { ok: false, msg: 'Selecciona responsable.' };
    if (!profs.length) return { ok: false, msg: 'Agrega al menos un profesional.' };
    if (!res.length) return { ok: false, msg: 'Agrega al menos un residente.' };
    if (severitySelect.value === '-') return { ok: false, msg: 'Selecciona severidad.' };
    return { ok: true, mode: 'save-si' };
  }

  return { ok: false, msg: 'Estado inválido.' };
}
