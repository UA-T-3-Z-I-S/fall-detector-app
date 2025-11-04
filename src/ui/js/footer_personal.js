// src/ui/js/footer_personal.js
import { openStaffFormModal } from './personal_form.js';

export async function initModalPersonal() {
  try {
    const res = await fetch('./ui/components/modal_personal.html');
    const html = await res.text();
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    const modalPersonal = document.getElementById('modal-personal');
    const closeBtn = document.getElementById('close-modal-btn');
    const addStaffBtn = document.getElementById('add-staff-btn');
    const personalTableBody = modalPersonal.querySelector('#personal-table tbody');
    const searchInput = modalPersonal.querySelector('#search-input');
    const paginationContainer = modalPersonal.querySelector('.pagination');

    const ITEMS_PER_PAGE = 10;
    let currentPage = 1;
    let allStaff = [];
    let tiposMap = {};

    async function loadTipos() {
      const tipos = await window.api.queryMongo('tipos_personal');
      tiposMap = {};
      tipos.forEach(tipo => tiposMap[tipo.id] = tipo.nombre);
    }

    async function loadStaff() {
      allStaff = await window.api.queryMongo('staff');
      renderTable();
    }

    function renderTable(page = 1, filter = '') {
      filter = filter.toLowerCase?.() || '';
      let filtered = allStaff.filter(s => {
        const tipoNombre = (tiposMap[s.tipo] || s.tipo || '').toLowerCase();
        return (
          (s.nombre || '').toLowerCase().includes(filter) ||
          (s.apellido || '').toLowerCase().includes(filter) ||
          (s.dni || '').includes(filter) ||
          tipoNombre.includes(filter) ||
          (s.estado ? 'activo' : 'inactivo').includes(filter) ||
          (s.test ? 'sí' : 'no').includes(filter)
        );
      });

      const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
      if (page > totalPages) page = totalPages;
      if (page < 1) page = 1;
      currentPage = page;

      personalTableBody.innerHTML = '';
      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;

      filtered.slice(start, end).forEach(staff => {
        const tr = document.createElement('tr');

        const horarioStr = (staff.horario || [])
          .map(h => `${h.dia} ${h.hora_inicio}-${h.hora_fin}`)
          .join('<br>');

        tr.innerHTML = `
          <td class="td-nombre" data-field="nombre">${escapeHtml(staff.nombre || '')}</td>
          <td class="td-apellido" data-field="apellido">${escapeHtml(staff.apellido || '')}</td>
          <td class="td-dni" data-field="dni">${escapeHtml(staff.dni || '')}</td>
          <td class="td-telefono" data-field="telefono">${escapeHtml(staff.telefono || '')}</td>
          <td data-field="tipo">${escapeHtml(tiposMap[staff.tipo] || staff.tipo || '')}</td>
          <td data-field="estado">${staff.estado ? 'Activo' : 'Inactivo'}</td>
          <td>${(staff.pwas || []).length}</td>
          <td data-field="test">${staff.test ? 'Sí' : 'No'}</td>
          <td data-field="horario">${horarioStr}</td>
          <td class="td-actions">
            <button class="edit-btn">Editar</button>
            <button class="toggle-btn">${staff.estado ? 'Deshabilitar' : 'Habilitar'}</button>
          </td>
        `;

        const editBtn = tr.querySelector('.edit-btn');
        const toggleBtn = tr.querySelector('.toggle-btn');

        editBtn.addEventListener('click', () => {
          if (editBtn.textContent === 'Editar') {
            makeRowEditable(tr, staff, editBtn);
          }
        });

        toggleBtn.addEventListener('click', async () => {
          staff.estado = !staff.estado;
          if (window.api.updateMongo) {
            await window.api.updateMongo('staff', staff.id, { ...staff });
          }
          await loadStaff();
        });

        personalTableBody.appendChild(tr);
      });

      renderPagination(totalPages);
    }

    function escapeHtml(s) {
      return String(s || '').replace(/[&<>"']/g, m =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
      );
    }

    function validarHorariosArray(horarios) {
      const map = {};
      for (let i = 0; i < horarios.length; i++) {
        const h = horarios[i];
        if (!h.dia || !h.hora_inicio || !h.hora_fin)
          return { ok: false, msg: 'Faltan campos en horario', index: i };
        if (h.hora_inicio >= h.hora_fin)
          return { ok: false, msg: 'Hora inicio >= hora fin', index: i };
        if (!map[h.dia]) map[h.dia] = [];
        for (const ex of map[h.dia]) {
          if (h.hora_inicio < ex.hora_fin && h.hora_fin > ex.hora_inicio)
            return { ok: false, msg: 'Horarios solapados', index: i };
        }
        map[h.dia].push(h);
      }
      return { ok: true };
    }

    function makeRowEditable(tr, staff) {
      const original = JSON.parse(JSON.stringify(staff));

      const tdNombre = tr.querySelector('[data-field="nombre"]');
      const tdApellido = tr.querySelector('[data-field="apellido"]');
      const tdDni = tr.querySelector('[data-field="dni"]');
      const tdTel = tr.querySelector('[data-field="telefono"]');
      const tdTipo = tr.querySelector('[data-field="tipo"]');
      const tdEstado = tr.querySelector('[data-field="estado"]');
      const tdTest = tr.querySelector('[data-field="test"]');
      const tdHorario = tr.querySelector('[data-field="horario"]');
      const btnCell = tr.querySelector('.td-actions');

      const inputNombre = makeInput(staff.nombre, 30, /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/);
      const inputApellido = makeInput(staff.apellido, 30, /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/);
      const inputDNI = makeInput(staff.dni, 8, /^\d+$/);
      const inputTel = makeInput(staff.telefono, 9, /^\d+$/);

      const tipoSelect = createSelect(tiposMap, staff.tipo);
      const estadoSelect = createStaticSelect({ true: 'Activo', false: 'Inactivo' }, staff.estado);
      const testSelect = createStaticSelect({ true: 'Sí', false: 'No' }, staff.test);

      tdNombre.innerHTML = ''; tdNombre.appendChild(inputNombre);
      tdApellido.innerHTML = ''; tdApellido.appendChild(inputApellido);
      tdDni.innerHTML = ''; tdDni.appendChild(inputDNI);
      tdTel.innerHTML = ''; tdTel.appendChild(inputTel);
      tdTipo.innerHTML = ''; tdTipo.appendChild(tipoSelect);
      tdEstado.innerHTML = ''; tdEstado.appendChild(estadoSelect);
      tdTest.innerHTML = ''; tdTest.appendChild(testSelect);

      tdHorario.innerHTML = '';
      const horarioWrapper = document.createElement('div');
      horarioWrapper.className = 'horario-edit-wrapper';

      (staff.horario || []).forEach(h => {
        horarioWrapper.appendChild(makeEditableHorarioRow(h));
      });

      const addHrBtn = document.createElement('button');
      addHrBtn.textContent = '+ Horario';
      addHrBtn.type = 'button';
      addHrBtn.addEventListener('click', () => {
        horarioWrapper.appendChild(makeEditableHorarioRow({ dia: 'lunes', hora_inicio: '', hora_fin: '' }));
      });

      tdHorario.appendChild(horarioWrapper);
      tdHorario.appendChild(addHrBtn);

      btnCell.innerHTML = '';
      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Guardar';
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancelar';
      btnCell.appendChild(saveBtn);
      btnCell.appendChild(cancelBtn);

      cancelBtn.addEventListener('click', () => loadStaff());

      saveBtn.addEventListener('click', async () => {
        const updatedStaff = {
          ...staff,
          nombre: inputNombre.value.trim(),
          apellido: inputApellido.value.trim(),
          dni: inputDNI.value.trim(),
          telefono: inputTel.value.trim(),
          tipo: tipoSelect.value,
          estado: estadoSelect.value === 'true',
          test: testSelect.value === 'true',
          horario: Array.from(horarioWrapper.children).map(row => ({
            dia: row.querySelector('.hr-dia').value,
            hora_inicio: row.querySelector('.hr-hi').value,
            hora_fin: row.querySelector('.hr-hf').value,
          })),
          updated_at: new Date()
        };

        const vh = validarHorariosArray(updatedStaff.horario);
        if (!vh.ok) return alert('Corrige horarios antes de guardar.');

        await window.api.updateMongo('staff', staff.id, updatedStaff);
        await loadStaff();
      });
    }

    function makeEditableHorarioRow(h) {
      const row = document.createElement('div');
      row.className = 'horario-row';

      const diaSelect = createStaticSelect(
        { lunes: 'lunes', martes: 'martes', miercoles: 'miercoles', jueves: 'jueves', viernes: 'viernes', sabado: 'sabado', domingo: 'domingo' },
        h.dia
      );
      diaSelect.classList.add('hr-dia');

      const hi = document.createElement('input');
      hi.type = 'time';
      hi.value = h.hora_inicio || '';
      hi.className = 'hr-hi';

      const hf = document.createElement('input');
      hf.type = 'time';
      hf.value = h.hora_fin || '';
      hf.className = 'hr-hf';

      const del = document.createElement('button');
      del.textContent = 'Eliminar';
      del.addEventListener('click', () => row.remove());

      row.appendChild(diaSelect);
      row.appendChild(hi);
      row.appendChild(hf);
      row.appendChild(del);

      return row;
    }

    function makeInput(value, maxLen, regex) {
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

    function createSelect(map, selected) {
      const select = document.createElement('select');
      Object.entries(map).forEach(([value, text]) => {
        const opt = document.createElement('option');
        opt.value = value;
        opt.textContent = text;
        if (value === selected) opt.selected = true;
        select.appendChild(opt);
      });
      return select;
    }

    function createStaticSelect(map, selected) {
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

    function renderPagination(totalPages) {
      paginationContainer.innerHTML = '';
      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn';
        btn.textContent = i;
        btn.disabled = i === currentPage;
        btn.addEventListener('click', () =>
          renderTable(i, searchInput.value.toLowerCase())
        );
        paginationContainer.appendChild(btn);
      }
    }

    searchInput.addEventListener('input', e => {
      renderTable(1, e.target.value.toLowerCase());
    });

    closeBtn?.addEventListener('click', () => {
      modalPersonal.classList.add('hidden');
      loadStaff();
    });

    addStaffBtn?.addEventListener('click', () => openStaffFormModal());

    document.addEventListener('staff-updated', loadStaff);

    await loadTipos();
    await loadStaff();

    return modalPersonal;
  } catch (err) {
    console.error('Error cargando modal_personal:', err);
    return null;
  }
}
