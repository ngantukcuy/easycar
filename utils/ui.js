// =====================================================
// EASYCAR — UI UTILITIES
// Toast, Modal, Loading helpers
// =====================================================

// ─── TOAST ───────────────────────────────────────────

let _toastContainer = null;
function _getToastContainer() {
  if (!_toastContainer || !document.contains(_toastContainer)) {
    _toastContainer = document.createElement("div");
    _toastContainer.style.cssText = "position:fixed;top:1.25rem;right:1.25rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none;";
    document.body.appendChild(_toastContainer);
  }
  return _toastContainer;
}

function showToast(message, type = "info", duration = 3500) {
  const icons = {
    success: "<i class='bx bxs-check-circle' style='color:#4ade80;font-size:1.125rem;'></i>",
    error:   "<i class='bx bxs-x-circle' style='color:#f87171;font-size:1.125rem;'></i>",
    warning: "<i class='bx bxs-error' style='color:#fbbf24;font-size:1.125rem;'></i>",
    info:    "<i class='bx bxs-info-circle' style='color:#60a5fa;font-size:1.125rem;'></i>",
  };

  const t = document.createElement("div");
  t.style.cssText = `
    pointer-events:auto;display:flex;align-items:center;gap:0.75rem;
    background:rgba(15,35,71,0.97);backdrop-filter:blur(8px);
    color:#fff;font-family:var(--font-body);font-size:0.8125rem;font-weight:500;
    padding:0.75rem 1rem;border-radius:12px;
    box-shadow:0 8px 32px rgba(0,0,0,0.25);
    border:1px solid rgba(255,255,255,0.08);
    transform:translateX(120%);transition:transform 0.3s cubic-bezier(.4,0,.2,1);
    max-width:320px;
  `;
  t.innerHTML = `
    <span style="flex-shrink:0;">${icons[type] || icons.info}</span>
    <span style="flex:1;">${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:rgba(255,255,255,0.35);cursor:pointer;padding:0 0 0 0.25rem;font-size:1rem;line-height:1;">✕</button>
  `;

  _getToastContainer().appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    t.style.transform = "translateX(0)";
  }));

  setTimeout(() => {
    t.style.transform = "translateX(120%)";
    setTimeout(() => t.remove(), 320);
  }, duration);
}

// ─── MODAL ───────────────────────────────────────────

function showModal({ title = "Konfirmasi", message = "", confirmText = "Ya", cancelText = "Batal", type = "default" }) {
  return new Promise(resolve => {
    const btnColors = { danger: "#dc2626", success: "#16a34a", warning: "#d97706", default: "#1a3c6e" };
    const btnColor  = btnColors[type] || btnColors.default;

    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);z-index:9998;display:flex;align-items:center;justify-content:center;padding:1rem;";
    overlay.innerHTML = `
      <div id="_modalBox" style="background:#fff;border-radius:20px;box-shadow:0 24px 64px rgba(0,0,0,0.2);width:100%;max-width:420px;transform:scale(0.92);transition:transform 0.2s ease;overflow:hidden;">
        <div style="padding:1.5rem 1.5rem 1rem;">
          <h3 style="font-family:var(--font-body);font-size:1rem;font-weight:700;color:#1e2d4a;margin:0 0 0.5rem;">${title}</h3>
          <p style="font-family:var(--font-body);font-size:0.875rem;color:#7a8fac;margin:0;line-height:1.6;">${message}</p>
        </div>
        <div style="padding:0 1.5rem 1.5rem;display:flex;gap:0.75rem;justify-content:flex-end;">
          <button id="_modalCancel" style="padding:0.6rem 1.25rem;border-radius:10px;border:1.5px solid #e8edf5;background:#fff;font-family:var(--font-body);font-size:0.875rem;font-weight:600;color:#7a8fac;cursor:pointer;">${cancelText}</button>
          <button id="_modalConfirm" style="padding:0.6rem 1.25rem;border-radius:10px;border:none;background:${btnColor};color:#fff;font-family:var(--font-body);font-size:0.875rem;font-weight:600;cursor:pointer;">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.getElementById("_modalBox").style.transform = "scale(1)";
    }));

    const finish = (val) => { overlay.remove(); resolve(val); };
    document.getElementById("_modalConfirm").onclick = () => finish(true);
    document.getElementById("_modalCancel").onclick  = () => finish(false);
    overlay.onclick = e => { if (e.target === overlay) finish(false); };
  });
}

// ─── LOADING ─────────────────────────────────────────

function showLoading(message = "Memuat data...") {
  let el = document.getElementById("_globalLoader");
  if (!el) {
    el = document.createElement("div");
    el.id = "_globalLoader";
    el.style.cssText = "position:fixed;inset:0;background:rgba(255,255,255,0.85);backdrop-filter:blur(4px);z-index:9997;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;";
    el.innerHTML = `
      <div style="width:44px;height:44px;border:3px solid #e8edf5;border-top-color:#1a3c6e;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
      <p id="_loaderMsg" style="font-family:var(--font-body);font-size:0.875rem;font-weight:500;color:#7a8fac;">${message}</p>
      <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `;
    document.body.appendChild(el);
  } else {
    const m = document.getElementById("_loaderMsg");
    if (m) m.textContent = message;
    el.style.display = "flex";
  }
}

function hideLoading() {
  const el = document.getElementById("_globalLoader");
  if (el) el.style.display = "none";
}

// ─── BUTTON LOADING ──────────────────────────────────

function setButtonLoading(btn, loading) {
  if (loading) {
    btn.dataset.orig = btn.innerHTML;
    btn.innerHTML = `<span style="width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;display:inline-block;animation:spin 0.7s linear infinite;margin-right:6px;"></span>Memproses...`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.orig || "Submit";
    btn.disabled  = false;
  }
}
