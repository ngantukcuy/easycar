if (!window.supabaseClient) {
  const SUPABASE_URL      = "https://rgcjbmcmhlsifpstboyd.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnY2pibWNtaGxzaWZwc3Rib3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODc5NTYsImV4cCI6MjA5MzY2Mzk1Nn0.DortOaC56Z-OkUYcAzOjPIXAFd4wtsoXIX1GKjtsydk";
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

var supabase = window.supabaseClient;

// ─── CORE AUTH ───────────────────────────────────────

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

/**
 * getCurrentUser()
 * Ambil profil lengkap dari tabel "profiles".
 * Returns null jika tidak login.
 *
 * FIX: Sebelumnya upsert profile saat fallback bisa overwrite role admin.
 * Sekarang upsert TIDAK menyertakan role (biarkan nilai DB yang berlaku).
 * Role hanya dibaca dari DB — tidak pernah ditulis ulang dari session metadata.
 */
async function getCurrentUser() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!error && profile) {
    // Profil ditemukan — role dari DB adalah sumber kebenaran
    return {
      ...profile,
      role: normalizeRole(profile.role || "user"),
    };
  }

  // Jika error bukan "row not found", log untuk debugging
  if (error && error.code !== "PGRST116") {
    console.error("[getCurrentUser] profiles query error:", error.message, error.code);
  }

  // Profil belum ada di DB → buat baru (hanya untuk user baru)
  // PENTING: jangan sertakan role di upsert ini — trigger handle_new_user yang handle
  if (!profile) {
    const metaName  = session.user.user_metadata?.full_name || session.user.email;
    const metaPhone = session.user.user_metadata?.phone || null;

    const { data: newProfile, error: upsertError } = await supabase
      .from("profiles")
      .upsert({
        id:        session.user.id,
        email:     session.user.email,
        full_name: metaName,
        phone:     metaPhone,
        // role TIDAK disertakan — biarkan nilai DEFAULT 'user' atau nilai yang ada
      }, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (!upsertError && newProfile) {
      return {
        ...newProfile,
        role: normalizeRole(newProfile.role || "user"),
      };
    }

    if (upsertError) {
      console.error("[getCurrentUser] upsert error:", upsertError.message);
    }
  }

  // Last resort fallback — pakai session metadata saja
  // role dari metadata dipakai hanya kalau DB benar-benar tidak bisa diakses
  const fallbackRole = normalizeRole(
    session.user.user_metadata?.role ||
    session.user.app_metadata?.role  ||
    "user"
  );

  return {
    id:        session.user.id,
    email:     session.user.email,
    full_name: session.user.user_metadata?.full_name || session.user.email,
    phone:     session.user.user_metadata?.phone || null,
    role:      fallbackRole,
  };
}

/**
 * requireLogin()
 * Panggil di halaman yang butuh user login.
 * Returns profil atau null (dan redirect ke login).
 */
async function requireLogin() {
  _showAuthScreen();
  const user = await getCurrentUser();
  if (!user) {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `/index.html?tab=login&redirect=${returnTo}`;
    return null;
  }
  _hideAuthScreen();
  document.body.classList.remove("ec-loading");
  document.body.classList.add("ec-ready");
  return user;
}

/**
 * requireAdmin()
 * Panggil di halaman admin.
 * Returns profil admin atau null (dan redirect).
 *
 * FIX: Dulu redirect ke user/dashboard jika role bukan admin.
 * Sekarang jika role bukan admin → redirect ke login dengan pesan error,
 * BUKAN ke user dashboard, agar tidak confusing.
 */
async function requireAdmin() {
  _showAuthScreen();
  const user = await getCurrentUser();

  if (!user) {
    window.location.href = "/index.html?tab=login";
    return null;
  }

  if (normalizeRole(user?.role) !== "admin") {
    console.warn("[requireAdmin] Akses ditolak. Role user:", user?.role, "| ID:", user?.id);
    // Redirect ke halaman user yang sesuai, bukan paksa ke admin
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
 * Ringan: hanya kembalikan session user meta (tanpa fetch profile).
 */
async function getSessionUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session ? session.user : null;
}

async function handleLogout() {
  await supabase.auth.signOut();
  window.location.href = "/index.html";
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
    "Menunggu":              "badge-warning",
    "Menunggu Konfirmasi":   "badge-warning",
    "Dikonfirmasi":          "badge-info",
    "Aktif":                 "badge-success",
    "Selesai":               "badge-secondary",
    "Dibatalkan":            "badge-danger",
    "Pembayaran Ditolak":    "badge-danger",
    "Tersedia":              "badge-success",
    "Disewa":                "badge-warning",
    "Perawatan":             "badge-danger",
  };
  return map[status] || "badge-secondary";
}

// ─── ANTI DOUBLE BOOKING ─────────────────────────────

async function checkAvailability(carId, startDate, endDate) {
  const { data, error } = await supabase.rpc("check_car_availability", {
    p_car_id: carId,
    p_start:  startDate,
    p_end:    endDate,
  });
  if (error) {
    console.error("Availability check error:", error);
    return false;
  }
  return data === true;
}

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
  return data;
}

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
