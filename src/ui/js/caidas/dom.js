// src/ui/js/caidas/dom.js

/**
 * Input de texto con longitud máxima y opcional regex
 */
export function makeInput(value, maxLen, regex) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value || '';
  input.maxLength = maxLen;

  input.addEventListener('input', e => {
    if (regex && !regex.test(e.target.value)) {
      e.target.value = e.target.value.replace(/[^\w\sáéíóúÁÉÍÓÚñÑ.,]/g, '');
    }
    e.target.value = e.target.value.slice(0, maxLen);
  });

  return input;
}

/**
 * Textarea con longitud máxima y opcional regex
 */
export function makeTextarea(value, maxLen, regex) {
  const ta = document.createElement('textarea');
  ta.value = value || '';
  ta.maxLength = maxLen;

  ta.addEventListener('input', e => {
    if (regex && !regex.test(e.target.value)) {
      e.target.value = e.target.value.replace(/[^\w\sáéíóúÁÉÍÓÚñÑ.,]/g, '');
    }
    e.target.value = e.target.value.slice(0, maxLen);
  });

  return ta;
}

/**
 * Select dinámico para arrays: profesionales/residents
 * map: { id: 'Nombre' }
 * selected: id por defecto
 */
export function createSelect(map, selected) {
  const select = document.createElement('select');
  Object.entries(map).forEach(([value, text]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = text;
    if (value == selected) opt.selected = true;
    select.appendChild(opt);
  });
  return select;
}

/**
 * Select estático: caida o severidad
 * map: { valor: 'Texto' }
 */
export function createStaticSelect(map, selected) {
  const select = document.createElement('select');
  Object.entries(map).forEach(([value, text]) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = text;
    if (String(value) === String(selected)) opt.selected = true;
    select.appendChild(opt);
  });
  return select;
}

/**
 * Input datetime-local para interventionTime
 * value: ISOString opcional
 */
export function makeDatetimeInput(value) {
  const input = document.createElement('input');
  input.type = 'datetime-local';
  if (value) {
    input.value = new Date(value).toISOString().slice(0, 16);
  }
  return input;
}

/**
 * Contenedor dinámico de selects para arrays (profesionales/residents)
 * addBtnText: texto del botón +1
 * map: { id: 'Nombre' }
 * values: array de ids por defecto
 */
export function createDynamicSelectArray(map, values = [], addBtnText = '+') {
  const container = document.createElement('div');
  values.forEach(id => {
    const sel = createSelect(map, id);
    container.appendChild(sel);
  });

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.textContent = addBtnText;
  addBtn.addEventListener('click', () => {
    const sel = createSelect(map, '');
    container.appendChild(sel);
  });

  container.appendChild(addBtn);
  return container;
}
