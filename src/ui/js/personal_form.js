import { generateUUID } from '../../services/uuidv4.js';

export async function openStaffFormModal() {
  try {
    let modal = document.getElementById('modal-staff-form');

    function limpiarFormulario() {
      const form = modal.querySelector('form');
      form.reset();
      form.querySelectorAll('.error-msg, .horario-error').forEach(span => {
        span.textContent = '';
        span.style.display = 'none';
      });

      const horarioContainer = modal.querySelector('#horario-container');
      Array.from(horarioContainer.children).slice(1).forEach(r => r.remove());
    }

    if (modal) {
      limpiarFormulario();
      modal.classList.remove('hidden');
      return;
    }

    const res = await fetch('./ui/components/personal_form.html');
    const html = await res.text();
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    modal = document.getElementById('modal-staff-form');
    const closeBtn = document.getElementById('close-form-btn');
    const form = document.getElementById('staff-form');
    const tipoDropdown = document.getElementById('tipo-dropdown');
    const horarioContainer = document.getElementById('horario-container');
    const addHorarioBtn = document.getElementById('add-horario-btn');

    closeBtn?.addEventListener('click', () => {
      modal.classList.add('hidden');
      limpiarFormulario();
    });

    const inputs = {
      nombre: form.querySelector('input[name="nombre"]'),
      apellido: form.querySelector('input[name="apellido"]'),
      dni: form.querySelector('input[name="dni"]'),
      telefono: form.querySelector('input[name="telefono"]')
    };

    function createErrorSpan(input) {
      let span = input.nextElementSibling;
      if (!span || !span.classList.contains('error-msg')) {
        span = document.createElement('span');
        span.className = 'error-msg';
        span.style.color = '#f44336';
        span.style.fontSize = '0.85em';
        span.style.display = 'none';
        input.after(span);
      }
      return span;
    }

    function showError(input, msg) {
      const span = createErrorSpan(input);
      span.textContent = msg;
      span.style.display = 'block';
    }

    function clearError(input) {
      const span = createErrorSpan(input);
      span.textContent = '';
      span.style.display = 'none';
    }

    inputs.nombre.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g,'');
      e.target.value.trim() ? clearError(e.target) : showError(e.target,'Nombre obligatorio');
    });
    inputs.apellido.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g,'');
      e.target.value.trim() ? clearError(e.target) : showError(e.target,'Apellido obligatorio');
    });
    inputs.dni.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g,'').slice(0,8);
      e.target.value.length===8 ? clearError(e.target) : showError(e.target,'DNI debe tener 8 dígitos');
    });
    inputs.telefono.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g,'').slice(0,9);
      clearError(e.target);
    });

    const tipos = await window.api.queryMongo('tipos_personal');
    tipos.forEach(tipo => {
      const opt = document.createElement('option');
      opt.value = tipo.id;
      opt.textContent = tipo.nombre;
      tipoDropdown.appendChild(opt);
    });

    function crearFilaHorario() {
      const wrapper = horarioContainer.firstElementChild.cloneNode(true);
      wrapper.querySelectorAll('input, select').forEach(el => el.value = '');
      const spanFila = wrapper.querySelector('.horario-error');
      spanFila.textContent = '';
      spanFila.style.display='none';

      const delBtn = wrapper.querySelector('.delete-horario-btn');
      delBtn.addEventListener('click', () => {
        if (horarioContainer.children.length>1) wrapper.remove();
        else { 
          spanFila.textContent='Debe haber al menos un horario';
          spanFila.style.display='block';
        }
      });

      return wrapper;
    }

    addHorarioBtn?.addEventListener('click', () => {
      horarioContainer.appendChild(crearFilaHorario());
    });

    function validarHorarios(horarios){
      const mapDias = {};
      let valid = true;
      horarios.forEach((h,i)=>{
        const wrapper = horarioContainer.children[i];
        const span = wrapper.querySelector('.horario-error');
        span.textContent='';
        span.style.display='none';

        if(!h.dia || !h.hora_inicio || !h.hora_fin || h.hora_inicio>=h.hora_fin){
          span.textContent='Horario vacío o mal formateado';
          span.style.display='block';
          valid=false;
        }

        if(!mapDias[h.dia]) mapDias[h.dia]=[];
        for(let exist of mapDias[h.dia]){
          if(h.hora_inicio<exist.hora_fin && h.hora_fin>exist.hora_inicio){
            span.textContent='Horario solapado';
            span.style.display='block';
            valid=false;
          }
        }
        mapDias[h.dia].push({...h});
      });
      return valid;
    }

    form?.addEventListener('submit', async e=>{
      e.preventDefault();
      let hasError=false;

      ['nombre','apellido','dni','tipo'].forEach(f=>{
        const input=form.querySelector(`[name="${f}"]`);
        if(!input.value.trim()){ showError(input,'Campo obligatorio'); hasError=true;}
        else clearError(input);
      });

      const horarios = Array.from(horarioContainer.children).map(wrapper=>({
        dia: wrapper.querySelector('select[name="dia"]').value,
        hora_inicio: wrapper.querySelector('input[name="hora_inicio"]').value,
        hora_fin: wrapper.querySelector('input[name="hora_fin"]').value
      }));

      if(!validarHorarios(horarios)) hasError=true;
      if(hasError) return;

      const newStaff={
        id: generateUUID(),
        nombre: inputs.nombre.value.trim(),
        apellido: inputs.apellido.value.trim(),
        dni: inputs.dni.value.trim(),
        telefono: inputs.telefono.value.trim(),
        tipo: tipoDropdown.value,
        estado:true,
        test:false,
        horario:horarios,
        pwas:[],
        created_at:new Date(),
        updated_at:new Date()
      };

      await window.api.insertMongo('personal_albergue',newStaff);
      console.log('✅ Nuevo personal agregado', newStaff);

      modal.classList.add('hidden');
      limpiarFormulario();
      document.dispatchEvent(new Event('staff-updated'));
    });

    modal.classList.remove('hidden');

  } catch(err){
    console.error('Error abriendo modal de staff:',err);
  }
}
