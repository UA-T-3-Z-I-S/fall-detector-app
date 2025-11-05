import { createSelect, createStaticSelect, makeInput } from './dom.js';
import { getStaffData, updateStaff } from './service.js';

const DIAS = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo"
};

function makeTimeInput(value) {
  const input = document.createElement('input');
  input.type = "time";
  input.value = value || "";
  input.required = false;
  input.style.minWidth = "90px";
  return input;
}

function validarHorario(ini, fin) {
  if (!ini || !fin) return true;
  return ini < fin;
}

function haySolape(staff, index, dia, ini, fin) {
  if (!ini || !fin) return false;
  return staff.horarios.some((h, i) =>
    i !== index &&
    h.dia === dia &&
    ini < h.hora_fin &&
    fin > h.hora_inicio
  );
}

export function makeRowEditable(tr, staff) {
  const { tiposMap } = getStaffData();

  if (!Array.isArray(staff.horarios) || staff.horarios.length === 0) {
    if (Array.isArray(staff.horario) && staff.horario.length) {
      staff.horarios = staff.horario.map(h => ({
        dia: h.dia ? h.dia.toUpperCase() : "LUNES",
        hora_inicio: h.hora_inicio || h.inicio || "",
        hora_fin: h.hora_fin || h.fin || ""
      }));
    } else {
      staff.horarios = [];
    }
  }

  const originalHTML = tr.outerHTML;
  const parent = tr.parentElement;

  const cells = tr.querySelectorAll('td');
  const [cNom, cApe, cDni, cTel, cTipo, cEst, , cTest, cHor, cAct] = cells;

  const inputNombre = makeInput(staff.nombre, 30, /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/);
  const inputApellido = makeInput(staff.apellido, 30, /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/);
  const inputDni = makeInput(staff.dni, 8, /^\d{0,8}$/);
  const inputTel = makeInput(staff.telefono, 9, /^\d{0,9}$/);

  cNom.innerHTML = ''; cNom.append(inputNombre);
  cApe.innerHTML = ''; cApe.append(inputApellido);
  cDni.innerHTML = ''; cDni.append(inputDni);
  cTel.innerHTML = ''; cTel.append(inputTel);

  cTipo.innerHTML = ''; cTipo.append(createSelect(tiposMap, staff.tipo));
  cEst.innerHTML = ''; cEst.append(createStaticSelect({ true: 'Activo', false: 'Inactivo' }, staff.estado));
  cTest.innerHTML = ''; cTest.append(createStaticSelect({ true: 'Sí', false: 'No' }, staff.test));

  renderEditableHorarios(cHor, staff);

  cAct.innerHTML = `
    <button class="save-btn">Guardar</button>
    <button class="cancel-btn">Cancelar</button>
  `;

  cAct.querySelector('.save-btn').addEventListener('click', async () => {
    // Conversión explícita a boolean
    const estadoValue = cEst.querySelector('select').value === 'true';
    const testValue = cTest.querySelector('select').value === 'true';

    await updateStaff(staff._id, {
      ...staff,
      nombre: inputNombre.value.trim(),
      apellido: inputApellido.value.trim(),
      dni: inputDni.value.trim(),
      telefono: inputTel.value.trim(),
      horarios: staff.horarios,
      estado: estadoValue,
      test: testValue
    });

    document.dispatchEvent(new Event('staff-updated'));
  });

  cAct.querySelector('.cancel-btn').addEventListener('click', () => {
    const restored = document.createElement('tr');
    restored.innerHTML = originalHTML.replace(/^<tr>|<\/tr>$/g, '');
    parent.replaceChild(restored, tr);
    restoreRowEvents(restored, staff);
  });
}

function restoreRowEvents(tr, staff) {
  tr.querySelector('.edit-btn')?.addEventListener('click', () =>
    makeRowEditable(tr, staff)
  );

  tr.querySelector('.toggle-btn')?.addEventListener('click', async () => {
    // Conversión a boolean antes de enviar
    staff.estado = !Boolean(staff.estado);
    await updateStaff(staff._id, { ...staff });
    document.dispatchEvent(new Event('staff-updated'));
  });
}

function renderEditableHorarios(container, staff) {
  container.innerHTML = "";
  container.classList.add("horario-edit-wrapper");

  const horarios = Array.isArray(staff.horarios) ? staff.horarios : [];
  staff.horarios = horarios;

  horarios.forEach((hor, i) => {
    const row = document.createElement('div');
    row.className = 'horario-row';

    const selDia = createStaticSelect(DIAS, hor.dia);
    const ini = makeTimeInput(hor.hora_inicio);
    const fin = makeTimeInput(hor.hora_fin);

    const del = document.createElement('button');
    del.textContent = "Eliminar";
    del.className = "toggle-btn";

    const msg = document.createElement("div");
    msg.className = "horario-row-error";

    const validate = () => {
      const horaValida = validarHorario(ini.value, fin.value);
      const solapa = haySolape(staff, i, selDia.value, ini.value, fin.value);

      if (!horaValida) {
        msg.style.display = "block";
        msg.textContent = "⛔ Fin debe ser mayor al Inicio";
      } else if (solapa) {
        msg.style.display = "block";
        msg.textContent = "🚫 Solapa con otro horario del día";
      } else {
        msg.style.display = "none";
        hor.dia = selDia.value;
        hor.hora_inicio = ini.value;
        hor.hora_fin = fin.value;
      }
    };

    selDia.addEventListener("change", validate);
    ini.addEventListener("input", validate);
    fin.addEventListener("input", validate);

    del.addEventListener("click", () => {
      staff.horarios.splice(i, 1);
      renderEditableHorarios(container, staff);
    });

    row.append(selDia, ini, fin, del);
    container.append(row, msg);
  });

  const add = document.createElement("button");
  add.textContent = "+ Agregar horario";
  add.className = "edit-btn";
  add.style.marginTop = "6px";

  add.addEventListener("click", () => {
    staff.horarios.push({ dia: "LUNES", hora_inicio: "", hora_fin: "" });
    renderEditableHorarios(container, staff);
  });

  container.append(add);
}
