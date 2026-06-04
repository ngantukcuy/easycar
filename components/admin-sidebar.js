// =====================================================
// EASYCAR — ADMIN SIDEBAR v3 (Mobile Fix)
// CSS class-based toggle — tidak pakai inline transform
// =====================================================

const ADMIN_SIDEBAR_HTML = `
<aside id="sidebar" class="ec-admin-sidebar">
  <!-- Brand -->
  <div class="asb-brand">
    <div class="asb-brand-icon"><i class='bx bxs-car'></i></div>
    <div>
      <div class="asb-brand-name">Easy<span>Car</span></div>
      <div class="asb-brand-sub">Panel Admin</div>
    </div>
    <!-- Close btn (mobile only) -->
    <button class="asb-close-btn" onclick="closeSidebar()" aria-label="Tutup menu">
      <i class='bx bx-x'></i>
    </button>
  </div>

  <!-- Nav -->
  <nav class="asb-nav sidebar-scroll">
    <div class="asb-section-label">Menu Utama</div>

    <a href="/pages/admin/dashboard.html"  class="sb-link" data-page="dashboard">
      <i class='bx bxs-home'></i><span>Dashboard</span>
    </a>
    <a href="/pages/admin/book-view.html"  class="sb-link" data-page="book-views">
      <i class='bx bxs-calendar-check'></i><span>Manajemen Booking</span>
    </a>
    <a href="/pages/admin/booking.html"    class="sb-link" data-page="booking">
      <i class='bx bxs-calendar-plus'></i><span>Buat Booking</span>
    </a>

    <div class="asb-section-label" style="margin-top:0.5rem;">Kelola Data</div>

    <a href="/pages/admin/vehicles.html"   class="sb-link" data-page="vehicles">
      <i class='bx bxs-car'></i><span>Kendaraan</span>
    </a>
    <a href="/pages/admin/users.html"      class="sb-link" data-page="users">
      <i class='bx bxs-user-account'></i><span>Pengguna</span>
    </a>
    <a href="/pages/admin/promos.html"     class="sb-link" data-page="promos">
      <i class='bx bxs-tag'></i><span>Promo</span>
    </a>

    <div class="asb-section-label" style="margin-top:0.5rem;">Laporan</div>

    <a href="/pages/admin/reports.html"    class="sb-link" data-page="reports">
      <i class='bx bxs-report'></i><span>Laporan</span>
    </a>
    <a href="/pages/admin/settings.html"   class="sb-link" data-page="settings">
      <i class='bx bxs-cog'></i><span>Pengaturan</span>
    </a>
  </nav>

  <!-- Admin footer -->
  <div class="asb-footer">
    <div id="sbAvatar" class="asb-avatar">A</div>
    <div class="asb-user-info">
      <div id="sbName" class="asb-user-name">Memuat...</div>
      <div class="asb-user-role">Administrator</div>
    </div>
    <button onclick="handleLogout()" title="Keluar" class="asb-logout-btn">
      <i class='bx bx-log-out'></i>
    </button>
  </div>
</aside>

<!-- Overlay (mobile) -->
<div id="sbOverlay" class="asb-overlay" onclick="closeSidebar()"></div>

<!-- Hamburger (mobile) -->
<button id="hamburgerBtn" class="asb-hamburger" onclick="toggleSidebar()" aria-label="Buka menu">
  <i class='bx bx-menu'></i>
</button>
`;

// ── STYLES ─────────────────────────────────────────
const ADMIN_SB_STYLES = `
<style id="ecAdminSidebarStyles">
  /* ══ SIDEBAR BASE ══ */
  .ec-admin-sidebar {
    position: fixed;
    left: 0; top: 0;
    width: 260px;
    height: 100%;           /* 100% bukan 100vh — fix iOS bounce */
    background: linear-gradient(180deg, #0f2347 0%, #1a3060 100%);
    display: flex;
    flex-direction: column;
    z-index: 100;
    box-shadow: 4px 0 24px rgba(0,0,0,0.18);
    overflow: hidden;
    /* posisi diatur CSS, bukan JS inline */
  }

  /* ══ BRAND ══ */
  .asb-brand {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 1.375rem 1.25rem;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
  }
  .asb-brand-icon {
    width: 38px; height: 38px; background: #e85d04; border-radius: 10px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(232,93,4,0.4);
  }
  .asb-brand-icon i { color: #fff; font-size: 1.25rem; }
  .asb-brand-name { color: #fff; font-weight: 800; font-size: 1.1rem; line-height: 1.2; }
  .asb-brand-name span { color: #fb923c; }
  .asb-brand-sub  { color: rgba(255,255,255,0.4); font-size: 0.7rem; }
  .asb-close-btn {
    display: none;            /* hidden desktop */
    margin-left: auto;
    background: rgba(255,255,255,0.08); border: none; cursor: pointer;
    width: 28px; height: 28px; border-radius: 8px;
    align-items: center; justify-content: center; flex-shrink: 0;
    color: rgba(255,255,255,0.6);
  }
  .asb-close-btn i { font-size: 1.1rem; }

  /* ══ NAV ══ */
  .asb-nav {
    flex: 1; padding: 0.875rem 0;
    overflow-y: auto; overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    min-height: 0;            /* critical for flex scroll */
  }
  .asb-section-label {
    padding: 0 1.25rem 0.375rem;
    color: rgba(255,255,255,0.3);
    font-size: 0.625rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em;
    margin-top: 0.25rem;
  }
  .sb-link {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.6rem 0.875rem; margin: 0.1rem 0.625rem;
    border-radius: 10px;
    color: rgba(255,255,255,0.55);
    font-size: 0.8125rem; font-weight: 500;
    text-decoration: none;
    border-left: 2px solid transparent;
    transition: all 0.18s;
  }
  .sb-link:hover  { color: #fff; background: rgba(255,255,255,0.07); }
  .sb-link.active { color: #fff; background: rgba(232,93,4,0.15); border-left-color: #e85d04; font-weight: 600; }
  .sb-link i { font-size: 1.1rem; flex-shrink: 0; }

  /* ══ FOOTER ══ */
  .asb-footer {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.875rem 1.125rem;
    border-top: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
  }
  .asb-avatar {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #e85d04, #ff7733);
    border-radius: 10px; display: flex; align-items: center;
    justify-content: center; color: #fff; font-weight: 700;
    font-size: 0.9rem; flex-shrink: 0;
  }
  .asb-user-info  { flex: 1; min-width: 0; }
  .asb-user-name  { color: #fff; font-size: 0.8125rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .asb-user-role  { color: rgba(255,255,255,0.35); font-size: 0.7rem; }
  .asb-logout-btn {
    background: none; border: none; cursor: pointer;
    color: rgba(255,255,255,0.3); padding: 4px;
    display: flex; align-items: center; transition: color 0.15s;
  }
  .asb-logout-btn:hover { color: #fb923c; }
  .asb-logout-btn i { font-size: 1.1rem; }

  /* ══ OVERLAY ══ */
  .asb-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(2px);
    z-index: 99;
  }
  .asb-overlay.visible { display: block; }

  /* ══ HAMBURGER ══ */
  .asb-hamburger {
    display: none;
    position: fixed; top: 0.875rem; left: 0.875rem;
    z-index: 101;
    width: 40px; height: 40px;
    background: #0f2347; border: none; border-radius: 10px;
    align-items: center; justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    transition: background 0.15s;
  }
  .asb-hamburger:hover { background: #1a3c6e; }
  .asb-hamburger i { color: #fff; font-size: 1.25rem; }

  /* ══ DESKTOP ══ */
  @media (min-width: 1024px) {
    .ec-admin-sidebar { transform: translateX(0) !important; }
    .asb-hamburger    { display: none !important; }
    .asb-overlay      { display: none !important; }
    .asb-close-btn    { display: none !important; }
    .page-wrapper     { margin-left: 260px; }
  }

  /* ══ MOBILE ══ */
  @media (max-width: 1023px) {
    .page-wrapper        { margin-left: 0 !important; }
    .asb-hamburger       { display: flex; }
    .asb-close-btn       { display: flex; }

    /* Sidebar tersembunyi by default */
    .ec-admin-sidebar {
      transform: translateX(-100%);
      transition: transform 0.28s cubic-bezier(.4,0,.2,1);
    }
    /* Saat open, geser masuk */
    .ec-admin-sidebar.asb-open {
      transform: translateX(0);
      box-shadow: 6px 0 32px rgba(0,0,0,0.28);
    }
  }
</style>
`;

// ── INIT ───────────────────────────────────────────
function initAdminSidebar(activePage, user) {
  // Inject styles sekali saja
  if (!document.getElementById("ecAdminSidebarStyles")) {
    document.head.insertAdjacentHTML("beforeend", ADMIN_SB_STYLES);
  }

  // Inject sidebar HTML
  const wrapper = document.createElement("div");
  wrapper.innerHTML = ADMIN_SIDEBAR_HTML.trim();
  // Append each child (aside, overlay, hamburger) ke body paling atas
  const children = [...wrapper.children];
  children.reverse().forEach(el => document.body.insertBefore(el, document.body.firstChild));

  // Set active link + close sidebar on mobile click
  document.querySelectorAll(".sb-link").forEach(link => {
    if (activePage && link.dataset.page === activePage) link.classList.add("active");
    link.addEventListener("click", () => {
      if (window.innerWidth < 1024) closeSidebar();
    });
  });

  // Fill user info
  if (user) {
    const name    = user.full_name || user.email || "Admin";
    const initial = name.charAt(0).toUpperCase();
    const nameEl  = document.getElementById("sbName");
    const avatarEl= document.getElementById("sbAvatar");
    if (nameEl)    nameEl.textContent   = name;
    if (avatarEl)  avatarEl.textContent = initial;
  }

  // Resize handler — tutup sidebar saat resize ke desktop
  function onResize() {
    if (window.innerWidth >= 1024) {
      const sb = document.getElementById("sidebar");
      const ov = document.getElementById("sbOverlay");
      if (sb) sb.classList.remove("asb-open");
      if (ov) ov.classList.remove("visible");
    }
  }
  window.addEventListener("resize", onResize);
}

// ── TOGGLE / CLOSE ─────────────────────────────────
function toggleSidebar() {
  const sb = document.getElementById("sidebar");
  const ov = document.getElementById("sbOverlay");
  if (!sb) return;
  const isOpen = sb.classList.contains("asb-open");
  if (isOpen) {
    sb.classList.remove("asb-open");
    if (ov) ov.classList.remove("visible");
  } else {
    sb.classList.add("asb-open");
    if (ov) ov.classList.add("visible");
  }
}

function closeSidebar() {
  const sb = document.getElementById("sidebar");
  const ov = document.getElementById("sbOverlay");
  if (sb) sb.classList.remove("asb-open");
  if (ov) ov.classList.remove("visible");
}
