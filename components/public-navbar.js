// =====================================================
// EASYCAR — PUBLIC NAVBAR COMPONENT
// Used on landing page (no login required).
// Shows Login button or user avatar/dropdown if logged in.
// =====================================================

const PUB_NAVBAR_HTML = `
<nav class="pub-navbar" id="pubNavbar">
  <a href="/index.html" class="brand">
    <div class="brand-icon">
      <i class='bx bxs-car' style="color:#fff;font-size:1.3rem;"></i>
    </div>
    <span class="brand-name">Easy<span>Car</span></span>
  </a>

  <div class="navbar-center" id="navLinks" style="display:flex;align-items:center;gap:1.5rem;">
    <a href="/index.html" class="nav-link" style="font-size:0.875rem;font-weight:500;color:var(--color-text);text-decoration:none;transition:color 0.15s;">Beranda</a>
    <a href="/pages/public/vehicles.html" class="nav-link" style="font-size:0.875rem;font-weight:500;color:var(--color-text);text-decoration:none;transition:color 0.15s;">Armada</a>
  </div>

  <div style="display:flex;align-items:center;gap:0.75rem;">
    <!-- Hamburger (mobile) -->
    <button id="mobileNavToggle" onclick="toggleMobileNav()"
      style="display:none;width:40px;height:40px;background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);align-items:center;justify-content:center;cursor:pointer;">
      <i class='bx bx-menu' style="font-size:1.25rem;color:var(--color-text);"></i>
    </button>

    <!-- Not logged in -->
    <div id="navAuthArea">
      <a href="/index.html?tab=login" class="btn btn-primary btn-sm" id="navLoginBtn">
        <i class='bx bx-log-in'></i> Masuk
      </a>
    </div>
  </div>
</nav>

<!-- Mobile Dropdown -->
<div id="mobileNavMenu" style="display:none;background:#fff;border-bottom:1px solid var(--color-border);padding:1rem;gap:0.5rem;flex-direction:column;">
  <a href="/index.html" style="padding:0.5rem 0;font-size:0.875rem;font-weight:500;color:var(--color-text);text-decoration:none;display:block;">Beranda</a>
  <a href="/pages/public/vehicles.html" style="padding:0.5rem 0;font-size:0.875rem;font-weight:500;color:var(--color-text);text-decoration:none;display:block;">Armada</a>
  <hr style="border:none;border-top:1px solid var(--color-border);margin:0.25rem 0;">
  <div id="mobileAuthArea"></div>
</div>
`;

async function initPublicNavbar() {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = PUB_NAVBAR_HTML;
  document.body.insertBefore(wrapper, document.body.firstChild);

  // Responsive: show hamburger on mobile
  const handleResize = () => {
    const toggle = document.getElementById("mobileNavToggle");
    const links  = document.getElementById("navLinks");
    if (!toggle || !links) return;
    if (window.innerWidth < 768) {
      toggle.style.display = "flex";
      links.style.display  = "none";
    } else {
      toggle.style.display = "none";
      links.style.display  = "flex";
      document.getElementById("mobileNavMenu").style.display = "none";
    }
  };
  window.addEventListener("resize", handleResize);
  handleResize();

  // Check session to show user avatar or login btn
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", session.user.id)
      .single();

    const name    = profile?.full_name || session.user.email;
    const initial = name[0].toUpperCase();
    const isAdmin = profile?.role === "admin";
    const dashUrl = isAdmin ? "/pages/admin/dashboard.html" : "/pages/user/dashboard.html";

    const authHTML = `
      <div style="position:relative;display:inline-block;" id="userDropdownWrap">
        <button onclick="toggleUserDropdown()"
          style="display:flex;align-items:center;gap:0.5rem;background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:0.375rem 0.75rem 0.375rem 0.5rem;cursor:pointer;font-family:var(--font-body);font-size:0.8125rem;font-weight:600;color:var(--color-text);">
          <span style="width:28px;height:28px;background:var(--color-accent);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:0.8125rem;">${initial}</span>
          <span style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name.split(" ")[0]}</span>
          <i class='bx bx-chevron-down' style="font-size:1rem;color:var(--color-text-muted);"></i>
        </button>
        <div id="userDropdown" style="display:none;position:absolute;right:0;top:calc(100% + 6px);background:#fff;border:1px solid var(--color-border);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);width:180px;z-index:200;overflow:hidden;">
          <a href="${dashUrl}" style="display:flex;align-items:center;gap:0.625rem;padding:0.75rem 1rem;font-size:0.8125rem;font-weight:500;color:var(--color-text);text-decoration:none;">
            <i class='bx bxs-dashboard' style="font-size:1rem;color:var(--color-primary-mid);"></i> Dashboard
          </a>
          <a href="/pages/user/profile.html" style="display:flex;align-items:center;gap:0.625rem;padding:0.75rem 1rem;font-size:0.8125rem;font-weight:500;color:var(--color-text);text-decoration:none;">
            <i class='bx bxs-user' style="font-size:1rem;color:var(--color-primary-mid);"></i> Profil
          </a>
          <hr style="border:none;border-top:1px solid var(--color-border);margin:0;">
          <button onclick="handleLogout()" style="display:flex;align-items:center;gap:0.625rem;padding:0.75rem 1rem;font-size:0.8125rem;font-weight:500;color:var(--color-danger);background:none;border:none;cursor:pointer;width:100%;font-family:var(--font-body);">
            <i class='bx bx-log-out' style="font-size:1rem;"></i> Keluar
          </button>
        </div>
      </div>
    `;

    document.getElementById("navAuthArea").innerHTML   = authHTML;
    document.getElementById("mobileAuthArea").innerHTML = `
      <a href="${dashUrl}" style="padding:0.5rem 0;font-size:0.875rem;font-weight:600;color:var(--color-primary-mid);text-decoration:none;display:block;">Dashboard</a>
      <button onclick="handleLogout()" style="padding:0.5rem 0;font-size:0.875rem;font-weight:600;color:var(--color-danger);background:none;border:none;cursor:pointer;font-family:var(--font-body);text-align:left;">Keluar</button>
    `;

    // Close dropdown on outside click
    document.addEventListener("click", e => {
      const wrap = document.getElementById("userDropdownWrap");
      if (wrap && !wrap.contains(e.target)) {
        const d = document.getElementById("userDropdown");
        if (d) d.style.display = "none";
      }
    });
  }
}

function toggleUserDropdown() {
  const d = document.getElementById("userDropdown");
  if (!d) return;
  d.style.display = d.style.display === "none" ? "block" : "none";
}

function toggleMobileNav() {
  const menu = document.getElementById("mobileNavMenu");
  if (!menu) return;
  menu.style.display = menu.style.display === "none" ? "flex" : "none";
}
