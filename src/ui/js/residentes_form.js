import { generateUUID } from '../../services/uuidv4.js';

export async function openResidentFormModal() {
  try {
    let modal = document.getElementById('modal-resident-form');

    function limpiarFormulario() {
      const form = modal.querySelector('form');
      form.reset();
      form.querySelectorAll('.error-msg').forEach(span => {
        span.textContent = '';
        span.style.display = 'none';
      });
    }

    if (modal) {
      limpiarFormulario();
      modal.classList.remove('hidden');
      return;
    }

    const res = await fetch('./ui/components/residentes_form.html');
    const html = await res.text();
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    modal = document.getElementById('modal-resident-form');
    const closeBtn = document.getElementById('close-form-btn');
    const form = document.getElementById('resident-form');
    const sexoDropdown = document.getElementById('sexo-dropdown');
    const pabellonDropdown = document.getElementById('pabellon-dropdown');

    closeBtn?.addEventListener('click', () => {
      modal.classList.add('hidden');
      limpiarFormulario();
    });

    const inputs = {
      nombre: form.querySelector('input[name="nombre"]'),
      apellido: form.querySelector('input[name="apellido"]'),
      dni: form.querySelector('input[name="dni"]'),
      fecha_nacimiento: form.querySelector('input[name="fecha_nacimiento"]')
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

    // Validaciones
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

    // Sexo (select fijo)
    ['Masculino', 'Femenino'].forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      sexoDropdown.appendChild(opt);
    });

    // Pabellones (desde DB)
    const pabellones = await window.api.queryMongo('tipos_pabellon');
    pabellones.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.nombre;
      pabellonDropdown.appendChild(opt);
    });

    // Enviar formulario
    form?.addEventListener('submit', async e => {
      e.preventDefault();
      let hasError = false;

      ['nombre','apellido','dni','sexo','pabellon','fecha_nacimiento'].forEach(f => {
        const input = form.querySelector(`[name="${f}"]`);
        if(!input.value.trim()){ showError(input,'Campo obligatorio'); hasError=true;}
        else clearError(input);
      });
      if(hasError) return;

      const newResident = {
        id: generateUUID(),
        nombre: inputs.nombre.value.trim(),
        apellido: inputs.apellido.value.trim(),
        dni: inputs.dni.value.trim(),
        sexo: sexoDropdown.value,
        fecha_nacimiento: inputs.fecha_nacimiento.value,
        pabellon: pabellonDropdown.value,
        estado: true,
        created_at: new Date(),
        updated_at: new Date()
      };

      await window.api.insertMongo('residentes_albergue', newResident);
      console.log('✅ Nuevo residente agregado', newResident);

      modal.classList.add('hidden');
      limpiarFormulario();
      document.dispatchEvent(new Event('resident-updated'));
    });

    modal.classList.remove('hidden');

  } catch(err) {
    console.error('Error abriendo modal de residente:',err);
  }
}
