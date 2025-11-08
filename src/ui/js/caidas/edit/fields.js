// src/ui/js/caidas/edit/fields.js
import { allStaff, allResidents } from '../service.js';
import { idToString, toLocalDateTimeInputString } from './utils.js';
import { createAutocompleteSingle, createAutocompleteMultiSelect } from './autocomplete.js';

export function buildFields(tr, notification) {
  const parent = tr.parentElement;
  const originalHTML = tr.outerHTML;
  const cells = tr.querySelectorAll('td');
  const [, cUser, cProf, cRes, cCaida, cSev, cObs, cTime, cAct] = cells;

  // Opciones para los selects
  const staffOpts = (allStaff || [])
    .filter(s => s.estado !== false)
    .map(s => ({ _id: idToString(s._id), name: `${s.nombre} ${s.apellido}` }));

  const residentOpts = (allResidents || [])
    .filter(r => r.estado !== false)
    .map(r => ({ _id: idToString(r._id), name: `${r.nombre} ${r.apellido}` }));

  // Normalizar responsables: si viene string, buscar en staffOpts
  let userObj = null;
  if (notification.userId) {
    userObj = staffOpts.find(s => s._id === notification.userId || s.name === notification.userId) || null;
  } else if (notification.user) {
    userObj = staffOpts.find(s => s.name === notification.user) || null;
  }

  // Normalizar profesionales: array seguro de objetos { _id, name }
  const professionalsArray = Array.isArray(notification.professionals)
    ? notification.professionals
    : (notification.professionals ? notification.professionals.split(',').map(s => s.trim()) : []);

  const professionalsInitial = professionalsArray.map(p => {
    const match = staffOpts.find(s => s._id === p || s.name === p);
    return match ? match : null;
  }).filter(Boolean);

  // Normalizar residentes: array seguro de objetos { _id, name }
  const residentsArray = Array.isArray(notification.residents)
    ? notification.residents
    : (notification.residents ? notification.residents.split(',').map(s => s.trim()) : []);

  const residentsInitial = residentsArray.map(r => {
    const match = residentOpts.find(res => res._id === r || res.name === r);
    return match ? match : null;
  }).filter(Boolean);

  // Responsable (single select)
  const userField = createAutocompleteSingle(staffOpts, userObj?._id, 'Responsable...');
  cUser.innerHTML = '';
  cUser.appendChild(userField.container);

  // Profesionales (multi select)
  const professionalsField = createAutocompleteMultiSelect(staffOpts, professionalsInitial);
  cProf.innerHTML = '';
  cProf.appendChild(professionalsField.container);

  // Residentes (multi select)
  const residentsField = createAutocompleteMultiSelect(residentOpts, residentsInitial);
  cRes.innerHTML = '';
  cRes.appendChild(residentsField.container);

  // Caída
  const caidaSelect = document.createElement('select');
  ['-', 'Sí', 'No'].forEach(v => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = v;
    if ((notification.caida === true && v === 'Sí') ||
        (notification.caida === false && v === 'No')) o.selected = true;
    caidaSelect.appendChild(o);
  });
  cCaida.innerHTML = '';
  cCaida.appendChild(caidaSelect);

  // Severidad
  const severitySelect = document.createElement('select');
  ['-', 'leve', 'moderada', 'grave'].forEach(v => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = v;
    if (notification.severity === v) o.selected = true;
    severitySelect.appendChild(o);
  });
  cSev.innerHTML = '';
  cSev.appendChild(severitySelect);

  // Observación
  const obsInput = document.createElement('input');
  obsInput.type = 'text';
  obsInput.value = notification.comments || '';
  cObs.innerHTML = '';
  cObs.appendChild(obsInput);

  // Fecha/Hora intervención
  const timeInput = document.createElement('input');
  timeInput.type = 'datetime-local';
  timeInput.value = toLocalDateTimeInputString(notification.interventionTime);
  cTime.innerHTML = '';
  cTime.appendChild(timeInput);

  // Acciones
  cAct.innerHTML = '';
  const controls = document.createElement('div');
  controls.className = 'inline-controls';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Guardar';
  saveBtn.className = 'save-btn';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.className = 'cancel-btn';

  controls.append(saveBtn, cancelBtn);
  cAct.appendChild(controls);

  const inlineError = document.createElement('div');
  inlineError.className = 'field-error';
  cAct.appendChild(inlineError);

  // Marcar fila como en edición
  tr.dataset.editing = 'true';

  return {
    tr,
    parent,
    originalHTML,
    notification,
    userField,
    professionalsField,
    residentsField,
    caidaSelect,
    severitySelect,
    obsInput,
    timeInput,
    saveBtn,
    cancelBtn,
    inlineError
  };
}

export function toggleUI({
  caidaSelect,
  professionalsField,
  residentsField,
  severitySelect,
  obsInput,
  timeInput,
  userField
}) {
  const v = caidaSelect.value;
  const enableFields = v === 'Sí';
  const disableFields = v === 'No';
  const emptyFields = v === '-';

  if (enableFields) {
    professionalsField.container.style.display = 'flex';
    residentsField.container.style.display = 'flex';
    severitySelect.disabled = false;
    obsInput.disabled = false;
    timeInput.disabled = false;
    userField.input.disabled = false;
  } else if (disableFields) {
    professionalsField.container.style.display = 'none';
    residentsField.container.style.display = 'none';
    severitySelect.disabled = true;
    obsInput.disabled = true;
    timeInput.disabled = true;
    userField.input.disabled = false;
  } else if (emptyFields) {
    professionalsField.container.style.display = 'none';
    residentsField.container.style.display = 'none';
    severitySelect.disabled = true;
    obsInput.disabled = true;
    timeInput.disabled = true;
    userField.input.disabled = true;
  }
}
