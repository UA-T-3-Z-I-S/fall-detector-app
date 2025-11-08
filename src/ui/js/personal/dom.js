// src/ui/js/personal/personal_dom.js
export function makeInput(value, maxLen, regex) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value || '';
  input.maxLength = maxLen;
  input.addEventListener('input', e => {
    if (!regex.test(e.target.value)) {
      e.target.value = e.target.value.replace(/[^\w\sáéíóúÁÉÍÓÚñÑ]/g, '');
    }
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
