// src/ui/js/residentes/residentes_dom.js
export function makeInput(value, maxLen) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value || '';
  input.maxLength = maxLen;

  // Solo limitar longitud, sin regex complejo
  input.addEventListener('input', e => {
    e.target.value = e.target.value.slice(0, maxLen);
  });

  return input;
}

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

// Para selects con valores estáticos, ej: sexo
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
