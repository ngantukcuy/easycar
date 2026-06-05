if (!window.supabaseClient) {
  const SUPABASE_URL     = "https://rgcjbmcmhlsifpstboyd.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnY2pibWNtaGxzaWZwc3Rib3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODc5NTYsImV4cCI6MjA5MzY2Mzk1Nn0.DortOaC56Z-OkUYcAzOjPIXAFd4wtsoXIX1GKjtsydk";
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

var supabase = window.supabaseClient;

// ─── CORE AUTH ───────────────────────────────────────

/**
 * Get full user profile from "profiles" table.
 * Returns null if not logged in.
 */
async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  return profile || null;
}

/**
 * requireLogin()
 * Call on pages that need any logged-in user.
 * Returns the profile or null (and redirects to login).
 * Shows a full-screen loader while checking — prevents flicker.
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
 * Call on pages that need admin role.
 * Returns the admin profile or null (and redirects).
 * NEVER renders admin UI before role is confirmed.
 */
async function requireAdmin() {
  _showAuthScreen();
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = "/auth.html";
    return null;
  }

  if (user.role !== "admin") {
    // redirect non-admin away from admin pages — no flash
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
 * Lightweight: just returns session user meta (no profile fetch).
 * Useful for navbar state.
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
 * checkAvailability(car_id, start_date, end_date)
 * Returns true if the car is AVAILABLE for those dates.
 * Menggunakan Supabase RPC agar cek dilakukan di sisi database.
 */
async function checkAvailability(carId, startDate, endDate) {
  const { data, error } = await supabase.rpc("check_car_availability", {
    p_car_id: carId,
    p_start:  startDate,
    p_end:    endDate,
  });

  if (error) {
    console.error("Availability check error:", error);
    return false; // fail-safe: deny
  }

  return data === true; // true = tersedia
}

/**
 * insertBookingAtomic(payload)
 * Insert booking dengan cek ketersediaan dalam 1 transaksi database.
 * Mencegah race condition: 2 user booking mobil & tanggal yang sama.
 * Returns { success, booking_id, kode_booking, error, message }
 */
async function insertBookingAtomic(payload) {
  const { data, error } = await supabase.rpc("insert_booking_if_available", {
    p_user_id:                    payload.user_id,
    p_car_id:                     payload.car_id,
    p_kode_booking:               payload.kode_booking,
    p_tanggal_mulai:              payload.tanggal_mulai,
    p_tanggal_selesai:            payload.tanggal_selesai,
    p_durasi_hari:                payload.durasi_hari,
    p_total_harga:                payload.total_harga,
    p_nama_pemesan:               payload.nama_pemesan,
    p_no_hp:                      payload.no_hp,
    p_no_ktp:                     payload.no_ktp,
    p_email_pemesan:              payload.email_pemesan,
    p_alamat:                     payload.alamat,
    p_tujuan_sewa:                payload.tujuan_sewa,
    p_punya_sosmed:               payload.punya_sosmed,
    p_jenis_jaminan:              payload.jenis_jaminan,
    p_jaminan_kendaraan_jenis:    payload.jaminan_kendaraan_jenis,
    p_jaminan_kendaraan_merek:    payload.jaminan_kendaraan_merek,
    p_jaminan_kendaraan_tahun:    payload.jaminan_kendaraan_tahun,
    p_jaminan_kendaraan_plat:     payload.jaminan_kendaraan_plat,
    p_dp_amount:                  payload.dp_amount,
    p_deposit_amount:             payload.deposit_amount,
    p_sudah_dibayar:              payload.sudah_dibayar,
    p_sisa_pelunasan:             payload.sisa_pelunasan,
  });

  if (error) {
    return { success: false, error: "RPC_ERROR", message: error.message };
  }

  return data; // { success, booking_id, kode_booking } atau { success:false, error, message }
}

/**
 * getUnavailableDates(car_id)
 * Returns array of date-range objects [{from, to}] for disabling in calendar.
 * PENTING: Pakai RPC get_unavailable_dates() yang SECURITY DEFINER
 * agar bisa lihat booking SEMUA user, bukan hanya booking sendiri.
 * Query langsung ke tabel bookings kena RLS → hanya lihat booking sendiri
 * → tanggal booking user lain tidak ter-disable → double booking bisa terjadi!
 */
async function getUnavailableDates(carId) {
  const { data, error } = await supabase.rpc("get_unavailable_dates", {
    p_car_id: carId,
  });
  if (error) {
    console.error("getUnavailableDates RPC error:", error);
    return [];
  }
  return (data || []).map(b => ({ from: b.tanggal_mulai, to: b.tanggal_selesai }));
}
