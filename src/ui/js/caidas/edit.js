// src/ui/js/caidas/edit/edit.js
import { injectStyles } from './edit/styles.js';
import { buildFields, toggleUI } from './edit/fields.js';
import { validateBeforeSave } from './edit/rules.js';
import { saveRecord, deleteRecord } from './edit/save.js';
import { restoreRow } from './edit/restore.js';

injectStyles();

export async function makeRowEditable(tr, notification) {
  if (!tr || !notification) return;

  tr.dataset.editing = "true";
  const ctx = buildFields(tr, notification);

  const { caidaSelect, saveBtn, cancelBtn, inlineError } = ctx;

  toggleUI(ctx);

  caidaSelect.addEventListener('change', () => {
    toggleUI(ctx);
  });

  saveBtn.addEventListener('click', async () => {
    const validation = await validateBeforeSave(ctx);
    if (!validation.ok) {
      inlineError.textContent = validation.msg;
      inlineError.style.display = 'block';
      return;
    }

    try {
      if (validation.mode === 'delete') {
        await deleteRecord(ctx);
      } else {
        await saveRecord(ctx);
      }
    } catch (err) {
      console.error('Error guardando/eliminando registro:', err);
      inlineError.textContent = 'Ocurrió un error al guardar/eliminar.';
      inlineError.style.display = 'block';
      return;
    }

    tr.removeAttribute('data-editing');
    restoreRow(ctx);
    document.dispatchEvent(new Event('caidas-updated'));
  });

  cancelBtn.addEventListener('click', () => {
    tr.removeAttribute('data-editing');
    restoreRow(ctx, true);
    document.dispatchEvent(new Event('caidas-updated'));
  });
}
