// =====================================================
// EASYCAR — ADMIN SIDEBAR COMPONENT
// Completely separate from user sidebar.
// NEVER imported on user pages.
// =====================================================

const ADMIN_SIDEBAR_HTML = `
<aside id="sidebar" style="
  position:fixed;left:0;top:0;height:100vh;width:260px;
  background:linear-gradient(180deg,#0f2347 0%,#16213e 100%);
  display:flex;flex-direction:column;z-index:50;
  box-shadow:4px 0 24px rgba(0,0,0,0.2);
  transition:transform 0.3s cubic-bezier(.4,0,.2,1);
">
  <!-- Brand -->
  <div style="display:flex;align-items:center;gap:0.75rem;padding:1.5rem;border-bottom:1px solid rgba(255,255,255,0.08);">
    <div style="width:38px;height:38px;background:#e85d04;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(232,93,4,0.4);">
      <i class='bx bxs-car' style="color:#fff;font-size:1.25rem;"></i>
    </div>
    <div>
      <div style="color:#fff;font-weight:800;font-size:1.1rem;line-height:1.2;">Easy<span style="color:#fb923c;">Car</span></div>
      <div style="color:rgba(255,255,255,0.3);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.08em;">Admin Panel</div>
    </div>
  </div>

  <!-- Nav -->
  <nav class="sidebar-scroll" style="flex:1;padding:1rem 0;overflow-y:auto;">
    <div style="padding:0 1rem 0.5rem;color:rgba(255,255,255,0.25);font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">Dashboard</div>

    <a href="/pages/admin/dashboard.html" class="sb-link" data-page="dashboard">
      <i class='bx bxs-dashboard'></i><span>Dashboard</span>
    </a>

    <div style="padding:1rem 1rem 0.5rem;color:rgba(255,255,255,0.25);font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-top:0.5rem;">Manajemen</div>

    <a href="/pages/admin/vehicles.html" class="sb-link" data-page="vehicles">
      <i class='bx bxs-car'></i><span>Kendaraan</span>
    </a>
    <a href="/pages/admin/bookings.html" class="sb-link" data-page="bookings">
      <i class='bx bxs-calendar-check'></i><span>Pemesanan</span>
    </a>
    <a href="/pages/admin/users.html" class="sb-link" data-page="users">
      <i class='bx bxs-user-account'></i><span>Pengguna</span>
    </a>
    <a href="/pages/admin/promos.html" class="sb-link" data-page="promos">
      <i class='bx bxs-tag'></i><span>Promo & Diskon</span>
    </a>
    <a href="/pages/admin/reports.html" class="sb-link" data-page="reports">
      <i class='bx bxs-bar-chart-alt-2'></i><span>Laporan</span>
    </a>

    <div style="padding:1rem 1rem 0.5rem;color:rgba(255,255,255,0.25);font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-top:0.5rem;">Akun</div>
    <a href="/pages/admin/settings.html" class="sb-link" data-page="settings">
      <i class='bx bxs-cog'></i><span>Pengaturan</span>
    </a>
  </nav>

  <!-- User footer -->
  <div style="padding:1rem;border-top:1px solid rgba(255,255,255,0.08);">
    <div style="display:flex;align-items:center;gap:0.75rem;">
      <div id="sbAvatar" style="width:36px;height:36px;background:linear-gradient(135deg,#e85d04,#ff7733);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:0.9rem;flex-shrink:0;">A</div>
      <div style="flex:1;min-width:0;">
        <div id="sbName" style="color:#fff;font-size:0.8125rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Admin</div>
        <div style="color:rgba(255,255,255,0.3);font-size:0.7rem;">Admin</div>
      </div>
      <button onclick="handleLogout()" title="Keluar" style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.3);padding:4px;transition:color 0.15s;" onmouseover="this.style.color='#fb923c'" onmouseout="this.style.color='rgba(255,255,255,0.3)'">
        <i class='bx bx-log-out' style="font-size:1.1rem;"></i>
      </button>
    </div>
  </div>
</aside>

<!-- Mobile overlay -->
<div id="sbOverlay" onclick="closeSidebar()" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:49;"></div>

<!-- Hamburger -->
<button id="hamburgerBtn" onclick="toggleSidebar()"
  style="display:none;position:fixed;top:1rem;left:1rem;z-index:60;width:40px;height:40px;background:#0f2347;border:none;border-radius:10px;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);">
  <i class='bx bx-menu' style="color:#fff;font-size:1.25rem;"></i>
</button>
`;

const ADMIN_SB_STYLE = `
  <style>
    .sb-link {
      display:flex;align-items:center;gap:0.75rem;
      padding:0.625rem 1rem;margin:0 0.5rem;
      border-radius:10px;
      color:rgba(255,255,255,0.5);
      font-size:0.8125rem;font-weight:500;
      text-decoration:none;
      border-left:2px solid transparent;
      transition:all 0.18s;
    }
    .sb-link:hover { color:#fff;background:rgba(255,255,255,0.07); }
    .sb-link.active { color:#fff;background:rgba(232,93,4,0.15);border-left-color:#e85d04; }
    .sb-link i { font-size:1.1rem;flex-shrink:0; }
  </style>
`;

function initAdminSidebar(activePage, user) {
  document.head.insertAdjacentHTML("beforeend", ADMIN_SB_STYLE);

  const wrapper = document.createElement("div");
  wrapper.innerHTML = ADMIN_SIDEBAR_HTML;
  document.body.insertBefore(wrapper, document.body.firstChild);

  if (activePage) {
    document.querySelectorAll(".sb-link").forEach(link => {
      if (link.dataset.page === activePage) link.classList.add("active");
    });
  }

  if (user) {
    const name    = user.full_name || user.email || "Admin";
    const initial = name[0].toUpperCase();
    const nameEl  = document.getElementById("sbName");
    const avatarEl= document.getElementById("sbAvatar");
    if (nameEl)   nameEl.textContent   = name;
    if (avatarEl) avatarEl.textContent = initial;
  }

  const handleResize = () => {
    const sb  = document.getElementById("sidebar");
    const btn = document.getElementById("hamburgerBtn");
    if (!sb || !btn) return;
    if (window.innerWidth < 1024) {
      sb.style.transform = "translateX(-100%)";
      btn.style.display  = "flex";
    } else {
      sb.style.transform = "translateX(0)";
      btn.style.display  = "none";
      document.getElementById("sbOverlay").style.display = "none";
    }
  };
  window.addEventListener("resize", handleResize);
  handleResize();
}

function toggleSidebar() {
  const sb  = document.getElementById("sidebar");
  const ov  = document.getElementById("sbOverlay");
  const open = sb.style.transform !== "translateX(-100%)";
  sb.style.transform = open ? "translateX(-100%)" : "translateX(0)";
  ov.style.display   = open ? "none" : "block";
}

function closeSidebar() {
  const sb = document.getElementById("sidebar");
  const ov = document.getElementById("sbOverlay");
  if (sb) sb.style.transform = "translateX(-100%)";
  if (ov) ov.style.display   = "none";
}
