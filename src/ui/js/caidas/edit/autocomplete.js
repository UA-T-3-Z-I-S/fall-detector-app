// edit/autocomplete.js
import { normalize, idToString } from './utils.js';

/* ==========================================================
 ✅ SINGLE AUTOCOMPLETE (Responsable)
========================================================== */
export function createAutocompleteSingle(options, initialId, placeholder = 'Responsable...') {
  const container = document.createElement('div');
  container.className = 'auto-single-container';

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'auto-input';
  input.placeholder = placeholder;

  const selected = options.find(o => idToString(o._id) === idToString(initialId));
  input.value = selected ? selected.name : '';

  let suggestions = null;
  let selectedId = initialId || '';

  function closeSug() {
    suggestions?.remove();
    suggestions = null;
  }

  function openSug(matches) {
    closeSug();
    suggestions = document.createElement('div');
    suggestions.className = 'auto-suggestions';

    const rect = input.getBoundingClientRect();
    suggestions.style.top = rect.bottom + 'px';
    suggestions.style.left = rect.left + 'px';
    suggestions.style.width = rect.width + 'px';

    matches.forEach(opt => {
      const item = document.createElement('div');
      item.className = 'auto-item';
      item.textContent = opt.name;
      item.addEventListener('click', () => {
        input.value = opt.name;
        selectedId = opt._id;
        closeSug();
      });
      suggestions.appendChild(item);
    });

    document.body.appendChild(suggestions);
  }

  input.addEventListener('input', () => {
    const q = normalize(input.value);
    const matches = q ? options.filter(o => normalize(o.name).includes(q)) : [];
    matches.length ? openSug(matches) : closeSug();
  });

  input.addEventListener('blur', () => setTimeout(closeSug, 200));

  container.appendChild(input);

  return {
    container,
    input,
    getId: () => selectedId,
  };
}

/* ==========================================================
 ✅ MULTI AUTOCOMPLETE (Profesionales & Residentes)
========================================================== */
export function createAutocompleteMultiSelect(options, initialList = []) {
  const container = document.createElement('div');
  container.className = 'auto-multi-container';

  const entries = [];

  function addEntry(initialItem) {
    const entry = document.createElement('div');
    entry.className = 'auto-entry';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'auto-input';
    input.placeholder = 'Seleccionar...';
    if (initialItem?.name) input.value = initialItem.name;

    let suggestions = null;
    let selectedId = initialItem?._id ? idToString(initialItem._id) : '';

    function closeSug() {
      suggestions?.remove();
      suggestions = null;
    }

    function openSug(matches) {
      closeSug();
      suggestions = document.createElement('div');
      suggestions.className = 'auto-suggestions';

      const rect = input.getBoundingClientRect();
      suggestions.style.top = rect.bottom + 'px';
      suggestions.style.left = rect.left + 'px';
      suggestions.style.width = rect.width + 'px';

      matches.forEach(opt => {
        const item = document.createElement('div');
        item.className = 'auto-item';
        item.textContent = opt.name;
        item.addEventListener('click', () => {
          input.value = opt.name;
          selectedId = opt._id;
          closeSug();
        });
        suggestions.appendChild(item);
      });

      document.body.appendChild(suggestions);
    }

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();

      // 🔹 Filtrar opciones ya seleccionadas
      const selectedIds = entries.map(e => e.getId()).filter(Boolean);
      const availableOptions = options.filter(o => !selectedIds.includes(o._id));

      const matches = q
        ? availableOptions.filter(o => o.name.toLowerCase().includes(q))
        : availableOptions;

      matches.length ? openSug(matches) : closeSug();
    });

    input.addEventListener('blur', () => setTimeout(closeSug, 200));

    const delBtn = document.createElement('button');
    delBtn.className = 'auto-remove';
    delBtn.textContent = '✖';
    delBtn.addEventListener('click', () => {
      entry.remove();
      const i = entries.indexOf(entryObj);
      if (i >= 0) entries.splice(i, 1);
    });

    entry.append(input, delBtn);
    container.insertBefore(entry, addBtn); // siempre antes del addBtn

    const entryObj = { input, getId: () => selectedId };
    entries.push(entryObj);
  }

  const addBtn = document.createElement('button');
  addBtn.className = 'auto-add';
  addBtn.textContent = '+ Añadir';
  addBtn.addEventListener('click', () => addEntry());
  container.appendChild(addBtn);

  // Inicializar entradas
  initialList.forEach(i => addEntry(i));

  return {
    container,
    getSelected: () => entries.map(e => e.getId()).filter(Boolean)
  };
}
