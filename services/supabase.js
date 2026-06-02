if (!window.supabaseClient) {
  const SUPABASE_URL      = "https://rgcjbmcmhlsifpstboyd.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnY2pibWNtaGxzaWZwc3Rib3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODc5NTYsImV4cCI6MjA5MzY2Mzk1Nn0.DortOaC56Z-OkUYcAzOjPIXAFd4wtsoXIX1GKjtsydk";
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

var supabase = window.supabaseClient;

// ─── CORE AUTH ───────────────────────────────────────

/**
 * getCurrentUser()
 * Ambil profil user dari tabel profiles.
 * Jika profil belum ada (baru daftar, trigger telat), fallback ke session meta.
 * Return null hanya jika benar-benar tidak ada sesi login.
 */
async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  // Profil ketemu → return langsung
  if (profile) return profile;

  // Profil tidak ketemu (PGRST116 = no rows, atau RLS blokir)
  // → Fallback: buat objek user dari session metadata
  // Ini mencegah infinite redirect loop saat profil belum tersedia
  console.warn("getCurrentUser: profile not found, using session fallback. Error:", error?.message);

  return {
    id:        session.user.id,
    email:     session.user.email,
    full_name: session.user.user_metadata?.full_name || session.user.email,
    role:      session.user.user_metadata?.role || "user",
    phone:     null,
    no_ktp:    null,
    alamat:    null,
  };
}

/**
 * requireLogin()
 * Wajib dipanggil di halaman yang butuh user login.
 * Redirect ke login jika tidak ada sesi.
 */
async function requireLogin() {
  _showAuthScreen();
  const user = await getCurrentUser();
  if (!user) {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/auth.html?tab=login&redirect=${returnTo}`;
    return null;
  }
  _hideAuthScreen();
  document.body.classList.remove("ec-loading");
  document.body.classList.add("ec-ready");
  return user;
}

/**
 * requireAdmin()
 * Wajib dipanggil di halaman admin.
 * Redirect ke login atau dashboard user jika bukan admin.
 */
async function requireAdmin() {
  _showAuthScreen();
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = "/auth.html";
    return null;
  }

  if (user.role !== "admin") {
    window.location.href = "/pages/user/dashboard.html";
    return null;
  }

  _hideAuthScreen();
  document.body.classList.remove("ec-loading");
  document.body.classList.add("ec-ready");
  return user;
}

/**
 * getSessionUser()
 * Ringan: hanya ambil session user tanpa query ke tabel profiles.
 * Gunakan untuk navbar / cek login cepat.
 */
async function getSessionUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? session.user : null;
}

async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = "/auth.html";
}

// ─── AUTH LOADING SCREEN ─────────────────────────────

function _showAuthScreen() {
  if (document.getElementById("ecAuthScreen")) return;
  const el = document.createElement("div");
  el.id = "ecAuthScreen";
  el.className = "auth-loading-screen";
  el.innerHTML = `
    <div class="spinner"></div>
    <p style="color:#7a8fac;font-size:0.875rem;font-weight:500;font-family:'Poppins',sans-serif">Memeriksa akses...</p>
  `;
  document.body.prepend(el);
}

function _hideAuthScreen() {
  const el = document.getElementById("ecAuthScreen");
  if (el) el.remove();
}

// ─── FORMAT HELPERS ──────────────────────────────────

function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0
  }).format(angka);
}

function formatTanggal(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit", month: "long", year: "numeric"
  });
}

function formatTanggalShort(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function statusBadgeClass(status) {
  const map = {
    "Menunggu":     "badge-warning",
    "Dikonfirmasi": "badge-info",
    "Aktif":        "badge-success",
    "Selesai":      "badge-secondary",
    "Dibatalkan":   "badge-danger",
    "Tersedia":     "badge-success",
    "Disewa":       "badge-warning",
    "Perawatan":    "badge-danger",
  };
  return map[status] || "badge-secondary";
}

// ─── ANTI DOUBLE BOOKING ─────────────────────────────

/**
 * checkAvailability(carId, startDate, endDate)
 * Return true jika mobil TERSEDIA untuk rentang tanggal tersebut.
 */
async function checkAvailability(carId, startDate, endDate) {
  const { data, error } = await supabase
    .from("bookings")
    .select("id")
    .eq("car_id", carId)
    .in("status", ["Dikonfirmasi", "Aktif", "Menunggu"])
    .lte("tanggal_mulai", endDate)
    .gte("tanggal_selesai", startDate);

  if (error) {
    console.error("Availability check error:", error);
    return false;
  }

  return data.length === 0;
}

/**
 * getUnavailableDates(carId)
 * Return array [{from, to}] tanggal yang sudah dipesan.
 * Dipakai untuk disable tanggal di kalender booking.
 */
async function getUnavailableDates(carId) {
  const { data } = await supabase
    .from("bookings")
    .select("tanggal_mulai, tanggal_selesai")
    .eq("car_id", carId)
    .in("status", ["Dikonfirmasi", "Aktif", "Menunggu"])
    .gte("tanggal_selesai", new Date().toISOString().split("T")[0]);

  return (data || []).map(b => ({ from: b.tanggal_mulai, to: b.tanggal_selesai }));
}