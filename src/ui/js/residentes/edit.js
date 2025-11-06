// src/ui/js/residentes/edit.js
import { createSelect, makeInput } from './dom.js';
import { getResidentData, updateResident } from './service.js';

export function makeRowEditable(tr, resident) {
  const { pabellonesMap } = getResidentData();

  const originalHTML = tr.outerHTML;
  const parent = tr.parentElement;
  const cells = tr.querySelectorAll('td');
  const [cNom, cApe, cDni, cSexo, cFnac, cEdad, cPab, cEst, cAct] = cells;

  const inputNombre = makeInput(resident.nombre, 30);
  const inputApellido = makeInput(resident.apellido, 30);
  const inputDni = makeInput(resident.dni, 8);
  const selectSexo = createSelect({ M: 'Masculino', F: 'Femenino' }, resident.sexo);

  // Bloquear números mientras escriben
  [inputNombre, inputApellido].forEach(input => {
    input.addEventListener('keypress', (e) => {
      const char = String.fromCharCode(e.which);
      if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ\s]/.test(char)) {
        e.preventDefault();
      }
    });
  });

  // Input fecha de nacimiento
  const inputFnac = document.createElement('input');
  inputFnac.type = 'date';
  inputFnac.value = resident.fecha_nacimiento ? resident.fecha_nacimiento.slice(0, 10) : '';
  inputFnac.max = new Date().toISOString().slice(0, 10);

  const selectPab = createSelect(pabellonesMap, resident.pabellon || '');

  // Mostrar edad dinámicamente
  function calcularEdad(fnac) {
    if (!fnac) return '';
    const diff = new Date() - new Date(fnac);
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }
  function updateEdad() {
    cEdad.textContent = calcularEdad(inputFnac.value);
  }
  inputFnac.addEventListener('change', updateEdad);
  updateEdad();

  // Reemplazar celdas con inputs/selects
  cNom.innerHTML = ''; cNom.append(inputNombre);
  cApe.innerHTML = ''; cApe.append(inputApellido);
  cDni.innerHTML = ''; cDni.append(inputDni);
  cSexo.innerHTML = ''; cSexo.append(selectSexo);
  cFnac.innerHTML = ''; cFnac.append(inputFnac);
  cPab.innerHTML = ''; cPab.append(selectPab);

  cAct.innerHTML = `
    <button class="save-btn">Guardar</button>
    <button class="cancel-btn">Cancelar</button>
  `;

  // Guardar cambios
  cAct.querySelector('.save-btn').addEventListener('click', async () => {
    const nombre = inputNombre.value.trim();
    const apellido = inputApellido.value.trim();
    const dni = inputDni.value.trim();
    const fecha = inputFnac.value;

    // Validación nombres y apellidos
    const nameRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
    if (!nameRegex.test(nombre)) { alert("El nombre solo puede contener letras y espacios"); return; }
    if (!nameRegex.test(apellido)) { alert("El apellido solo puede contener letras y espacios"); return; }

    // Validación fecha
    if (!fecha) { alert("La fecha de nacimiento es obligatoria"); return; }
    if (fecha > new Date().toISOString().slice(0, 10)) { alert("La fecha de nacimiento no puede ser futura"); return; }

    // --- 🔑 Validación DNI único ---
    const dniExists = await window.api.queryMongo('residentes_albergue', { dni });
    if (dniExists.some(r => r._id !== resident._id)) {
      alert('⛔ DNI ya registrado');
      return;
    }

    await updateResident(resident._id, {
      ...resident,
      nombre,
      apellido,
      dni,
      sexo: selectSexo.value,
      fecha_nacimiento: fecha,
      pabellon: selectPab.value
    });

    document.dispatchEvent(new Event('resident-updated'));
  });

  // Cancelar edición
  cAct.querySelector('.cancel-btn').addEventListener('click', () => {
    const restored = document.createElement('tr');
    restored.innerHTML = originalHTML.replace(/^<tr>|<\/tr>$/g, '');
    parent.replaceChild(restored, tr);
    restoreRowEvents(restored, resident);
  });
}

// Restaurar eventos de fila
function restoreRowEvents(tr, resident) {
  tr.querySelector('.edit-btn')?.addEventListener('click', () =>
    makeRowEditable(tr, resident)
  );

  tr.querySelector('.toggle-btn')?.addEventListener('click', async () => {
    resident.estado = !resident.estado;
    await updateResident(resident._id, { ...resident });
    document.dispatchEvent(new Event('resident-updated'));
  });
}
