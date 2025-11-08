// edit/restore.js
// src/ui/js/caidas/edit/restore.js
export function restoreRow(ctx, canceled = false) {
  const { tr, originalHTML } = ctx;
  tr.innerHTML = originalHTML;
  tr.removeAttribute('data-editing');

  if (canceled) {
    // No guardar cambios
  }
}
