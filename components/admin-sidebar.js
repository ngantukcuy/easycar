// =====================================================
// EASYCAR — ADMIN SIDEBAR v4 (Sama persis user sidebar)
// =====================================================

const ADMIN_SIDEBAR_HTML = `
<aside id="sidebar" class="ec-sidebar ec-admin-sidebar">
  <div class="sb-brand">
    <div class="sb-brand-icon"><i class='bx bxs-car'></i></div>
    <div>
      <div class="sb-brand-name">Easy<span>Car</span></div>
      <div class="sb-brand-sub">Panel Admin</div>
    </div>
  </div>

  <nav class="sb-nav">
    <div class="sb-section-label">Menu Utama</div>
    <a href="/pages/admin/dashboard.html"  class="sb-link" data-page="dashboard">
      <i class='bx bxs-home'></i><span>Dashboard</span>
    </a>
    <a href="/pages/admin/book-view.html"  class="sb-link" data-page="book-views">
      <i class='bx bxs-calendar-check'></i><span>Manajemen Booking</span>
      <span class="sb-notif-badge" id="sbAdminBadge" style="display:none;">0</span>
    </a>
    <a href="/pages/admin/booking.html"    class="sb-link" data-page="booking">
      <i class='bx bxs-calendar-plus'></i><span>Buat Booking</span>
    </a>

    <div class="sb-section-label" style="margin-top:0.5rem;">Kelola Data</div>
    <a href="/pages/admin/vehicles.html"   class="sb-link" data-page="vehicles">
      <i class='bx bxs-car'></i><span>Kendaraan</span>
    </a>
    <a href="/pages/admin/users.html"      class="sb-link" data-page="users">
      <i class='bx bxs-user-account'></i><span>Pengguna</span>
    </a>
    <a href="/pages/admin/promos.html"     class="sb-link" data-page="promos">
      <i class='bx bxs-tag'></i><span>Promo</span>
    </a>

    <div class="sb-section-label" style="margin-top:0.5rem;">Laporan</div>
    <a href="/pages/admin/reports.html"    class="sb-link" data-page="reports">
      <i class='bx bxs-report'></i><span>Laporan</span>
    </a>
    <a href="/pages/admin/settings.html"   class="sb-link" data-page="settings">
      <i class='bx bxs-cog'></i><span>Pengaturan</span>
    </a>
  </nav>

  <div class="sb-user-footer">
    <div id="sbAvatar" class="sb-avatar">A</div>
    <div class="sb-user-info">
      <div id="sbName" class="sb-user-name">Memuat...</div>
      <div class="sb-user-role">Administrator</div>
    </div>
    <button onclick="handleLogout()" title="Keluar" class="sb-logout-btn">
      <i class='bx bx-log-out'></i>
    </button>
  </div>
</aside>

<div id="sbOverlay" onclick="closeSidebar()"></div>

<button id="hamburgerBtn" onclick="toggleSidebar()" class="sb-hamburger" aria-label="Buka menu">
  <i class='bx bx-menu'></i>
</button>
`;

const ADMIN_SB_STYLES = `
<style id="ecAdminSidebarStyles">
  /* ── SIDEBAR BASE ── */
  .ec-admin-sidebar {
    position: fixed;
    left: 0; top: 0;
    width: 260px;
    height: 100%;
    background: linear-gradient(180deg, #0f2347 0%, #1a3060 100%);
    display: flex;
    flex-direction: column;
    z-index: 100;
    box-shadow: 4px 0 24px rgba(0,0,0,0.18);
    overflow: hidden;
  }

  /* Brand */
  .ec-admin-sidebar .sb-brand {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 1.375rem 1.25rem;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
  }
  .ec-admin-sidebar .sb-brand-icon {
    width: 38px; height: 38px;
    background: #e85d04;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(232,93,4,0.4);
  }
  .ec-admin-sidebar .sb-brand-icon i { color: #fff; font-size: 1.25rem; }
  .ec-admin-sidebar .sb-brand-name { color: #fff; font-weight: 800; font-size: 1.1rem; line-height: 1.2; }
  .ec-admin-sidebar .sb-brand-name span { color: #fb923c; }
  .ec-admin-sidebar .sb-brand-sub { color: rgba(255,255,255,0.4); font-size: 0.7rem; }

  /* Nav — kunci scroll tidak negantung */
  .ec-admin-sidebar .sb-nav {
    flex: 1;
    min-height: 0;          /* WAJIB agar flex child bisa scroll */
    padding: 0.875rem 0;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }
  .ec-admin-sidebar .sb-nav::-webkit-scrollbar { width: 3px; }
  .ec-admin-sidebar .sb-nav::-webkit-scrollbar-track { background: transparent; }
  .ec-admin-sidebar .sb-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }

  .ec-admin-sidebar .sb-section-label {
    padding: 0 1.25rem 0.375rem;
    color: rgba(255,255,255,0.3);
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 0.25rem;
  }

  .ec-admin-sidebar .sb-link {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.6rem 0.875rem;
    margin: 0.1rem 0.625rem;
    border-radius: 10px;
    color: rgba(255,255,255,0.55);
    font-size: 0.8125rem; font-weight: 500;
    text-decoration: none;
    border-left: 2px solid transparent;
    transition: all 0.18s;
    position: relative;
  }
  .ec-admin-sidebar .sb-link:hover { color: #fff; background: rgba(255,255,255,0.07); }
  .ec-admin-sidebar .sb-link.active { color: #fff; background: rgba(232,93,4,0.15); border-left-color: #e85d04; font-weight: 600; }
  .ec-admin-sidebar .sb-link i { font-size: 1.1rem; flex-shrink: 0; }

  /* Notif badge */
  .ec-admin-sidebar .sb-notif-badge {
    margin-left: auto;
    min-width: 18px; height: 18px;
    background: #e85d04;
    border-radius: 9px;
    font-size: 0.65rem; font-weight: 700;
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    padding: 0 5px;
  }

  /* Footer */
  .ec-admin-sidebar .sb-user-footer {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.875rem 1.125rem;
    border-top: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
  }
  .ec-admin-sidebar .sb-avatar {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #e85d04, #ff7733);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 700; font-size: 0.9rem;
    flex-shrink: 0;
  }
  .ec-admin-sidebar .sb-user-info { flex: 1; min-width: 0; }
  .ec-admin-sidebar .sb-user-name { color: #fff; font-size: 0.8125rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ec-admin-sidebar .sb-user-role { color: rgba(255,255,255,0.35); font-size: 0.7rem; }
  .ec-admin-sidebar .sb-logout-btn {
    background: none; border: none; cursor: pointer;
    color: rgba(255,255,255,0.3);
    padding: 4px; transition: color 0.15s;
    display: flex; align-items: center;
  }
  .ec-admin-sidebar .sb-logout-btn:hover { color: #fb923c; }
  .ec-admin-sidebar .sb-logout-btn i { font-size: 1.1rem; }

  /* Overlay */
  #sbOverlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.55);
    z-index: 99;
    backdrop-filter: blur(2px);
  }
  #sbOverlay.visible { display: block; }

  /* Hamburger */
  .sb-hamburger {
    display: none;
    position: fixed; top: 0.875rem; left: 0.875rem;
    z-index: 101;
    width: 40px; height: 40px;
    background: #0f2347;
    border: none; border-radius: 10px;
    align-items: center; justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    transition: background 0.15s;
  }
  .sb-hamburger:hover { background: #1a3c6e; }
  .sb-hamburger i { color: #fff; font-size: 1.25rem; }

  /* Desktop */
  @media (min-width: 1024px) {
    .ec-admin-sidebar { transform: translateX(0) !important; }
    .sb-hamburger     { display: none !important; }
    #sbOverlay        { display: none !important; }
    .page-wrapper     { margin-left: 260px; }
  }

  /* Mobile */
  @media (max-width: 1023px) {
    .page-wrapper       { margin-left: 0 !important; }
    .sb-hamburger       { display: flex; }
    .ec-admin-sidebar {
      transform: translateX(-100%);
      transition: transform 0.28s cubic-bezier(.4,0,.2,1);
    }
    .ec-admin-sidebar.sb-open {
      transform: translateX(0);
      box-shadow: 6px 0 32px rgba(0,0,0,0.28);
    }
  }
</style>
`;

function initAdminSidebar(activePage, user) {
  if (!document.getElementById("ecAdminSidebarStyles")) {
    document.head.insertAdjacentHTML("beforeend", ADMIN_SB_STYLES);
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = ADMIN_SIDEBAR_HTML;
  document.body.insertBefore(wrapper.firstElementChild, document.body.firstChild); // aside
  while (wrapper.firstElementChild) {
    document.body.insertBefore(wrapper.firstElementChild, document.body.firstChild);
  }

  // Set active link + close sidebar on mobile click
  document.querySelectorAll(".ec-admin-sidebar .sb-link").forEach(link => {
    if (activePage && link.dataset.page === activePage) link.classList.add("active");
    link.addEventListener("click", () => {
      if (window.innerWidth < 1024) closeSidebar();
    });
  });

  // Fill user info
  if (user) {
    const name     = user.full_name || user.email || "Admin";
    const initial  = name.charAt(0).toUpperCase();
    const nameEl   = document.getElementById("sbName");
    const avatarEl = document.getElementById("sbAvatar");
    if (nameEl)   nameEl.textContent   = name;
    if (avatarEl) avatarEl.textContent = initial;
  }

  function handleResize() {
    if (window.innerWidth >= 1024) {
      const sb = document.getElementById("sidebar");
      const ov = document.getElementById("sbOverlay");
      if (sb) sb.classList.remove("sb-open");
      if (ov) ov.classList.remove("visible");
    }
  }
  window.addEventListener("resize", handleResize);
  handleResize();
}

function toggleSidebar() {
  const sb = document.getElementById("sidebar");
  const ov = document.getElementById("sbOverlay");
  if (!sb) return;
  const isOpen = sb.classList.contains("sb-open");
  if (isOpen) {
    sb.classList.remove("sb-open");
    if (ov) ov.classList.remove("visible");
  } else {
    sb.classList.add("sb-open");
    if (ov) ov.classList.add("visible");
  }
}

function closeSidebar() {
  const sb = document.getElementById("sidebar");
  const ov = document.getElementById("sbOverlay");
  if (sb) sb.classList.remove("sb-open");
  if (ov) ov.classList.remove("visible");
}
