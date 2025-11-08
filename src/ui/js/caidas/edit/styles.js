// edit/styles.js
export function injectStyles() {
  if (document.getElementById('caidas-edit-styles')) return;
  const css = `
  .auto-multi-container { display:flex; flex-direction:column; gap:6px; }
  .auto-entry { display:flex; gap:6px; align-items:center; }
  .auto-input { flex:1; padding:6px 8px; min-width:140px; box-sizing:border-box; }
  .auto-input.invalid { border:1px solid #e03a3a; }
  .auto-remove, .auto-add { padding:4px 8px; cursor:pointer; }
  .auto-add { margin-top:6px; align-self:flex-start; }
  .auto-suggestions { background:#fff; border:1px solid #ccc; max-height:260px; overflow:auto; box-shadow:0 4px 10px rgba(0,0,0,0.08); z-index:99999; position:fixed; }
  .auto-item { padding:6px 8px; cursor:pointer; }
  .auto-item:hover { background:#f2f2f2; }
  .field-error { color:#e03a3a; font-size:12px; margin-top:6px; display:none; }
  .inline-controls { display:flex; gap:8px; align-items:center; }
  `;
  const s = document.createElement('style');
  s.id = 'caidas-edit-styles';
  s.textContent = css;
  document.head.appendChild(s);
}
