// =====================================================
// EASYCAR — ADMIN SIDEBAR COMPONENT (v2 — Fixed)
// =====================================================

const ADMIN_SIDEBAR_HTML = `
<aside id="sidebar" class="ec-sidebar">
  <div class="sb-brand">
    <div class="sb-brand-icon"><i class='bx bxs-car'></i></div>
    <div>
      <div class="sb-brand-name">Easy<span>Car</span></div>
      <div class="sb-brand-sub">Rental Kendaraan</div>
    </div>
  </div>

  <nav class="sb-nav">
    <div class="sb-section-label">Menu</div>
    <a href="/pages/admin/dashboard.html" class="sb-link" data-page="dashboard">
      <i class='bx bxs-home'></i><span>Dashboard</span>
    </a>
    <a href="/pages/admin/booking.html" class="sb-link" data-page="booking">
      <i class='bx bxs-calendar-plus'></i><span>Booking Baru</span>
    </a>
    <a href="/pages/admin/book-view.html" class="sb-link" data-page="book-view">
      <i class='bx bxs-receipt'></i><span>Manajemen Booking</span>
      <span class="sb-notif-badge" id="sbOrderBadge" style="display:none;">0</span>
    </a>
    <div class="sb-section-label">Data Master</div>
    <a href="/pages/admin/vehicles.html" class="sb-link" data-page="vehicles">
      <i class='bx bxs-car'></i><span>Manajemen Kendaraan</span>
    </a>
    <a href="/pages/admin/users.html" class="sb-link" data-page="users"></a>
      <i class='bx bxs-user-account'></i><span>Manajemen Pelanggan</span>
    </a>
    <div class="sb-section-label">Laporan</div>
    <a href="/pages/admin/reports.html" class="sb-link" data-page="reports">
      <i class='bx bxs-bar-chart-alt-2'></i><span>Laporan Penjualan</span>
    </a>
    <a href="/pages/admin/promos.html" class="sb-link" data-page="promos"></a>
      <i class='bx bxs-comment-detail'></i><span>Promo</span>
    </a>
    <div class="sb-section-label" style="margin-top:0.5rem;">Akun</div>
    <a href="/pages/admin/settings.html" class="sb-link" data-page="settings">
      <i class='bx bxs-user'></i><span>Profil Saya</span>
    </a>
  </nav>

  <div class="sb-user-footer">
    <div id="sbAvatar" class="sb-avatar">U</div>
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

const SB_STYLES = `
<style id="ecSidebarStyles">
  /* ── SIDEBAR BASE ── */
  .ec-sidebar {
    position: fixed;
    left: 0; top: 0;
    width: 260px;
    height: 100%;           /* pakai % bukan 100vh — fix iOS bounce */
    background: linear-gradient(180deg, #0f2347 0%, #1a3060 100%);
    display: flex;
    flex-direction: column;
    z-index: 100;
    box-shadow: 4px 0 24px rgba(0,0,0,0.18);
    overflow: hidden;
    /* Tidak pakai transform di sini; diatur JS */
  }

  /* Brand */
  .sb-brand {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 1.375rem 1.25rem;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
  }
  .sb-brand-icon {
    width: 38px; height: 38px;
    background: #e85d04;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(232,93,4,0.4);
  }
  .sb-brand-icon i { color: #fff; font-size: 1.25rem; }
  .sb-brand-name { color: #fff; font-weight: 800; font-size: 1.1rem; line-height: 1.2; }
  .sb-brand-name span { color: #fb923c; }
  .sb-brand-sub { color: rgba(255,255,255,0.4); font-size: 0.7rem; }

  /* Nav */
  .sb-nav {
    flex: 1;
    padding: 0.875rem 0;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }
  .sb-nav::-webkit-scrollbar { width: 3px; }
  .sb-nav::-webkit-scrollbar-track { background: transparent; }
  .sb-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }

  .sb-section-label {
    padding: 0 1.25rem 0.375rem;
    color: rgba(255,255,255,0.3);
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-top: 0.25rem;
  }

  .sb-link {
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
  .sb-link:hover { color: #fff; background: rgba(255,255,255,0.07); }
  .sb-link.active { color: #fff; background: rgba(232,93,4,0.15); border-left-color: #e85d04; font-weight: 600; }
  .sb-link i { font-size: 1.1rem; flex-shrink: 0; }

  /* Notif badge */
  .sb-notif-badge {
    margin-left: auto;
    min-width: 18px; height: 18px;
    background: #e85d04;
    border-radius: 9px;
    font-size: 0.65rem;
    font-weight: 700;
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    padding: 0 5px;
  }

  /* User footer */
  .sb-user-footer {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.875rem 1.125rem;
    border-top: 1px solid rgba(255,255,255,0.08);
    flex-shrink: 0;
  }
  .sb-avatar {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #e85d04, #ff7733);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; font-weight: 700; font-size: 0.9rem;
    flex-shrink: 0;
  }
  .sb-user-info { flex: 1; min-width: 0; }
  .sb-user-name { color: #fff; font-size: 0.8125rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sb-user-role { color: rgba(255,255,255,0.35); font-size: 0.7rem; }
  .sb-logout-btn {
    background: none; border: none; cursor: pointer;
    color: rgba(255,255,255,0.3);
    padding: 4px; transition: color 0.15s;
    display: flex; align-items: center;
  }
  .sb-logout-btn:hover { color: #fb923c; }
  .sb-logout-btn i { font-size: 1.1rem; }

  /* Mobile overlay */
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

  /* ── LAYOUT INTEGRATION ── */
  /* page-wrapper harus tahu sidebar ada */
  @media (min-width: 1024px) {
    .page-wrapper {
      margin-left: 260px;
    }
    .ec-sidebar {
      transform: translateX(0) !important;
    }
    .sb-hamburger { display: none !important; }
    #sbOverlay    { display: none !important; }
  }
  @media (max-width: 1023px) {
    .page-wrapper { margin-left: 0 !important; }
    .sb-hamburger { display: flex; }
    .ec-sidebar {
      transform: translateX(-100%);
      transition: transform 0.28s cubic-bezier(.4,0,.2,1);
    }
    .ec-sidebar.sb-open {
      transform: translateX(0);
      box-shadow: 6px 0 32px rgba(0,0,0,0.28);
    }
  }
</style>
`;

function initAdminSidebar(activePage, user) {
  // Inject styles only once
  if (!document.getElementById("ecSidebarStyles")) {
    document.head.insertAdjacentHTML("beforeend", SB_STYLES);
  }

  // Inject sidebar
  const wrapper = document.createElement("div");
  wrapper.innerHTML = ADMIN_SIDEBAR_HTML;
  document.body.insertBefore(wrapper.firstElementChild, document.body.firstChild); // aside
  // append overlay & hamburger
  while (wrapper.firstElementChild) {
    document.body.insertBefore(wrapper.firstElementChild, document.body.firstChild);
  }

  // Re-query after DOM insert
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sbOverlay");
  const hamburger = document.getElementById("hamburgerBtn");

  // Set active link + close sidebar on mobile click
  document.querySelectorAll(".sb-link").forEach(link => {
    if (activePage && link.dataset.page === activePage) link.classList.add("active");
    link.addEventListener("click", () => {
      if (window.innerWidth < 1024) closeSidebar();
    });
  });

  // Fill user info
  if (user) {
    const name    = user.full_name || user.email || "User";
    const initial = name.charAt(0).toUpperCase();
    const nameEl  = document.getElementById("sbName");
    const avatarEl = document.getElementById("sbAvatar");
    if (nameEl)   nameEl.textContent   = name;
    if (avatarEl) avatarEl.textContent = initial;
  }

  // Responsive init — hanya set class, bukan inline transform
  function handleResize() {
    if (window.innerWidth >= 1024) {
      sidebar.classList.remove("sb-open");
      overlay.classList.remove("visible");
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
    ov.classList.remove("visible");
  } else {
    sb.classList.add("sb-open");
    ov.classList.add("visible");
  }
}

function closeSidebar() {
  const sb = document.getElementById("sidebar");
  const ov = document.getElementById("sbOverlay");
  if (sb) sb.classList.remove("sb-open");
  if (ov) ov.classList.remove("visible");
}

// Set badge angka di sidebar (pesanan baru / update)
function setSidebarBadge(count) {
  const badge = document.getElementById("sbOrderBadge");
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 9 ? "9+" : count;
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

// ── TOPBAR NOTIF BELL ── inject bell icon ke .page-topbar
function injectTopbarNotifBell({ fetchCount, onOpen } = {}) {
  const topbar = document.querySelector(".page-topbar");
  if (!topbar || document.getElementById("topbarNotifBtn")) return;

  const style = document.createElement("style");
  style.textContent = `
    .topbar-notif-wrap { position:relative; flex-shrink:0; }
    #topbarNotifBtn {
      width:38px; height:38px; border-radius:10px;
      background:var(--color-bg,#f1f5f9); border:1.5px solid var(--color-border,#e2e8f0);
      display:flex; align-items:center; justify-content:center;
      cursor:pointer; transition:all 0.15s; position:relative;
    }
    #topbarNotifBtn:hover { background:var(--color-primary,#0f2347); border-color:var(--color-primary,#0f2347); }
    #topbarNotifBtn:hover i { color:#fff; }
    #topbarNotifBtn i { font-size:1.2rem; color:var(--color-primary,#0f2347); transition:color 0.15s; }
    #topbarNotifDot {
      position:absolute; top:4px; right:4px;
      width:8px; height:8px; border-radius:50%;
      background:#e85d04; border:2px solid var(--color-surface,#fff);
      display:none;
    }
    #topbarNotifDot.visible { display:block; }
    .topbar-notif-panel {
      position:absolute; top:calc(100% + 8px); right:0;
      width:300px; background:#fff; border-radius:14px;
      box-shadow:0 8px 32px rgba(0,0,0,0.15); border:1px solid var(--color-border,#e2e8f0);
      z-index:500; display:none; overflow:hidden;
    }
    .topbar-notif-panel.open { display:block; }
    .topbar-notif-header { padding:0.75rem 1rem; border-bottom:1px solid var(--color-border,#e2e8f0); display:flex; align-items:center; justify-content:space-between; }
    .topbar-notif-header span { font-size:0.8125rem; font-weight:700; color:var(--color-primary,#0f2347); }
    .topbar-notif-body { max-height:280px; overflow-y:auto; }
    .notif-item { display:flex; gap:0.625rem; padding:0.75rem 1rem; border-bottom:1px solid var(--color-bg,#f8fafc); cursor:pointer; transition:background 0.1s; }
    .notif-item:hover { background:var(--color-bg,#f8fafc); }
    .notif-item:last-child { border-bottom:none; }
    .notif-item-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .notif-item-icon.blue { background:#eff6ff; } .notif-item-icon.blue i { color:#2563eb; }
    .notif-item-icon.green { background:#f0fdf4; } .notif-item-icon.green i { color:#16a34a; }
    .notif-item-icon.red { background:#fef2f2; } .notif-item-icon.red i { color:#dc2626; }
    .notif-item-icon.orange { background:#fff7ed; } .notif-item-icon.orange i { color:#e85d04; }
    .notif-item-text { flex:1; min-width:0; }
    .notif-item-title { font-size:0.8rem; font-weight:600; color:var(--color-text,#1e293b); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .notif-item-sub { font-size:0.7rem; color:var(--color-text-muted,#64748b); margin-top:1px; }
    .notif-empty { padding:2rem 1rem; text-align:center; color:var(--color-text-muted,#64748b); font-size:0.8125rem; }
  `;
  document.head.appendChild(style);

  const wrap = document.createElement("div");
  wrap.className = "topbar-notif-wrap";
  wrap.innerHTML = `
    <button id="topbarNotifBtn" title="Notifikasi">
      <i class='bx bx-bell'></i>
      <span id="topbarNotifDot"></span>
    </button>
    <div class="topbar-notif-panel" id="topbarNotifPanel">
      <div class="topbar-notif-header">
        <span>🔔 Notifikasi</span>
        <button onclick="markAllRead()" style="font-size:0.7rem;background:none;border:none;color:var(--color-accent,#e85d04);font-weight:600;cursor:pointer;font-family:inherit;">Tandai dibaca</button>
      </div>
      <div class="topbar-notif-body" id="topbarNotifBody">
        <div class="notif-empty">Memuat...</div>
      </div>
    </div>
  `;
  topbar.appendChild(wrap);

  const btn = document.getElementById("topbarNotifBtn");
  const panel = document.getElementById("topbarNotifPanel");
  const dot = document.getElementById("topbarNotifDot");

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) loadTopbarNotifs();
  });
  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) panel.classList.remove("open");
  });

  async function loadTopbarNotifs() {
    if (onOpen) {
      const items = await onOpen();
      renderNotifItems(items || []);
    } else if (typeof supabase !== "undefined" && typeof currentUser !== "undefined" && currentUser) {
      const { data } = await supabase
        .from("bookings")
        .select("id,kode_booking,status,created_at,cars(nama)")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(10);
      renderNotifItems((data || []).map(b => ({
        title: b.kode_booking || ("EC" + b.id.slice(-6).toUpperCase()),
        sub: (b.cars?.nama || "Kendaraan") + " · " + (b.status || ""),
        status: b.status,
      })));
    }
  }

  function renderNotifItems(items) {
    const body = document.getElementById("topbarNotifBody");
    if (!items.length) { body.innerHTML = `<div class="notif-empty">Tidak ada notifikasi</div>`; return; }
    body.innerHTML = items.map(item => {
      let iconClass = "blue"; let iconName = "bx-calendar-check";
      if (item.status === "Dikonfirmasi") { iconClass = "green"; iconName = "bxs-check-circle"; }
      else if (item.status === "Ditolak" || item.status === "Dibatalkan") { iconClass = "red"; iconName = "bxs-error-circle"; }
      else if (item.status === "Aktif") { iconClass = "orange"; iconName = "bxs-car"; }
      else if (item.status === "Selesai") { iconClass = "green"; iconName = "bxs-flag-checkered"; }
      return `<div class="notif-item">
        <div class="notif-item-icon ${iconClass}"><i class='bx ${iconName}'></i></div>
        <div class="notif-item-text">
          <div class="notif-item-title">${item.title}</div>
          <div class="notif-item-sub">${item.sub}</div>
        </div>
      </div>`;
    }).join("");
    dot.classList.add("visible");
  }

  window.markAllRead = function() {
    dot.classList.remove("visible");
    document.getElementById("topbarNotifPanel").classList.remove("open");
  };

  if (fetchCount) {
    fetchCount().then(count => {
      if (count > 0) dot.classList.add("visible");
    });
  }
}
