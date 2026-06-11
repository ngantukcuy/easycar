// =====================================================
// EASYCAR — REALTIME & NOTIFICATION SYSTEM
// Supabase Realtime subscriptions + Toast notifications
// =====================================================

window.EasyCarRealtime = (function () {

  // ── CONFIG ──────────────────────────────────────────
  const ADMIN_WA = "6282276100996"; // ganti dengan nomor WA admin

  // ── INTERNAL STATE ──────────────────────────────────
  let _channels      = [];
  let _notifBadge    = null;
  let _unreadCount   = 0;
  let _onBookingUpdate = null; // callback dipanggil saat ada update booking

  // ── TOAST SYSTEM ────────────────────────────────────
  function _ensureToastContainer() {
    let c = document.getElementById("ecToastContainer");
    if (!c) {
      c = document.createElement("div");
      c.id = "ecToastContainer";
      c.style.cssText = `
        position:fixed;top:1.25rem;right:1.25rem;z-index:9999;
        display:flex;flex-direction:column;gap:0.5rem;
        max-width:340px;width:calc(100% - 2.5rem);
        pointer-events:none;
      `;
      document.body.appendChild(c);
    }
    return c;
  }

  function showNotif(msg, type = "info", title = "", duration = 5000) {
    const c = _ensureToastContainer();
    const colors = {
      success: { bg: "#f0fdf4", border: "#86efac", text: "#15803d", icon: "bx-check-circle", iconColor: "#22c55e" },
      error:   { bg: "#fef2f2", border: "#fca5a5", text: "#dc2626", icon: "bx-x-circle",     iconColor: "#ef4444" },
      warning: { bg: "#fffbeb", border: "#fcd34d", text: "#b45309", icon: "bx-error",         iconColor: "#f59e0b" },
      info:    { bg: "#eff6ff", border: "#93c5fd", text: "#1d4ed8", icon: "bx-info-circle",   iconColor: "#3b82f6" },
    };
    const s = colors[type] || colors.info;

    const toast = document.createElement("div");
    toast.style.cssText = `
      background:${s.bg};border:1.5px solid ${s.border};border-radius:12px;
      padding:0.875rem 1rem;display:flex;align-items:flex-start;gap:0.75rem;
      box-shadow:0 4px 20px rgba(0,0,0,0.12);pointer-events:auto;
      animation:ecToastIn 0.35s cubic-bezier(.4,0,.2,1);
      position:relative;overflow:hidden;
    `;
    toast.innerHTML = `
      <i class="bx ${s.icon}" style="font-size:1.25rem;color:${s.iconColor};flex-shrink:0;margin-top:1px;"></i>
      <div style="flex:1;min-width:0;">
        ${title ? `<p style="font-size:0.8125rem;font-weight:700;color:${s.text};margin:0 0 0.15rem;">${title}</p>` : ""}
        <p style="font-size:0.7875rem;color:${s.text};margin:0;line-height:1.4;">${msg}</p>
      </div>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:${s.text};opacity:0.5;padding:0;flex-shrink:0;font-size:1rem;line-height:1;margin-top:1px;">&times;</button>
      <div class="ec-toast-progress" style="position:absolute;bottom:0;left:0;height:3px;background:${s.iconColor};opacity:0.4;width:100%;transform-origin:left;animation:ecToastProgress ${duration}ms linear forwards;"></div>
    `;

    if (!document.getElementById("ecToastStyles")) {
      const style = document.createElement("style");
      style.id = "ecToastStyles";
      style.textContent = `
        @keyframes ecToastIn { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes ecToastOut{ from{opacity:1;transform:translateX(0)}    to{opacity:0;transform:translateX(40px)} }
        @keyframes ecToastProgress { from{transform:scaleX(1)} to{transform:scaleX(0)} }
      `;
      document.head.appendChild(style);
    }

    c.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = "ecToastOut 0.3s ease forwards";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ── NOTIF BADGE (angka di icon lonceng) ────────────
  function _setBadge(el) { _notifBadge = el; }

  function _incrementBadge() {
    _unreadCount++;
    if (_notifBadge) {
      _notifBadge.textContent = _unreadCount > 9 ? "9+" : _unreadCount;
      _notifBadge.style.display = "flex";
    }
  }

  function resetBadge() {
    _unreadCount = 0;
    if (_notifBadge) _notifBadge.style.display = "none";
  }

  // ── STATUS LABEL HELPER ─────────────────────────────
  function statusLabel(status) {
    const map = {
      "Menunggu":          "Menunggu Konfirmasi",
      "Menunggu Konfirmasi":"Menunggu Konfirmasi",
      "Dikonfirmasi":      "Dikonfirmasi",
      "Dibatalkan":        "Dibatalkan",
      "Aktif":             "Aktif",
      "Selesai":           "Selesai",
      "Dibatalkan":        "Dibatalkan",
    };
    return map[status] || status;
  }

  // ── SUBSCRIBE UNTUK USER ─────────────────────────────
  // Pantau perubahan booking milik user yang sedang login
  function subscribeUserBookings(userId, callbacks = {}) {
    const channelName = "user-bookings-" + userId;

    // Hindari duplikat channel
    const existing = _channels.find(c => c.topic === channelName);
    if (existing) { supabase.removeChannel(existing); _channels = _channels.filter(c => c !== existing); }

    const ch = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event:  "*",
          schema: "public",
          table:  "bookings",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const booking = payload.new || payload.old;
          const status  = booking?.status;

          if (payload.eventType === "INSERT") {
            showNotif(
              `Booking <strong>${booking.kode_booking || ""}</strong> berhasil dibuat. Menunggu konfirmasi admin.`,
              "success",
              "✅ Booking Dibuat"
            );
            _incrementBadge();
            if (callbacks.onInsert) callbacks.onInsert(payload);
          }

          if (payload.eventType === "UPDATE") {
            const old = payload.old;
            if (old.status !== status) {
              if (status === "Dikonfirmasi") {
                showNotif(
                  `Booking <strong>${booking.kode_booking || ""}</strong> telah <strong>dikonfirmasi</strong> oleh admin! Silakan ambil kendaraan sesuai jadwal.`,
                  "success",
                  "🎉 Booking Dikonfirmasi",
                  7000
                );
              } else if (status === "Dibatalkan") {
                const alasan = booking.alasan_tolak || "Tidak ada keterangan.";
                showNotif(
                  `Booking <strong>${booking.kode_booking || ""}</strong> ditolak.<br><small>Alasan: ${alasan}</small>`,
                  "error",
                  "❌ Booking Ditolak",
                  8000
                );
              } else if (status === "Aktif") {
                showNotif(
                  `Booking <strong>${booking.kode_booking || ""}</strong> sedang aktif. Selamat menikmati perjalanan!`,
                  "info",
                  "🚗 Booking Aktif"
                );
              }
              _incrementBadge();
            }
            if (callbacks.onUpdate) callbacks.onUpdate(payload);
          }

          if (_onBookingUpdate) _onBookingUpdate(payload);
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[EasyCarRealtime] ✅ User channel terhubung:", channelName);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[EasyCarRealtime] ❌ User channel error:", status, err);
          // Retry sekali setelah 5 detik
          setTimeout(() => subscribeUserBookings(userId, callbacks), 5000);
        } else {
          console.log("[EasyCarRealtime] User channel status:", status);
        }
      });

    _channels.push(ch);
    return ch;
  }

  // ── SUBSCRIBE UNTUK ADMIN ────────────────────────────
  // Pantau SEMUA booking baru untuk admin
  function subscribeAllBookings(callbacks = {}) {
    const channelName = "admin-all-bookings";

    const existing = _channels.find(c => c.topic === channelName);
    if (existing) { supabase.removeChannel(existing); _channels = _channels.filter(c => c !== existing); }

    const ch = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event:  "*",
          schema: "public",
          table:  "bookings",
        },
        async (payload) => {
          const booking = payload.new || {};

          if (payload.eventType === "INSERT") {
            let carName    = "—";
            let personName = booking.nama_pemesan || "Pelanggan baru";

            try {
              const { data: car } = await supabase.from("cars").select("nama").eq("id", booking.car_id).single();
              if (car) carName = car.nama;
            } catch {}

            showNotif(
              `<strong>${personName}</strong> baru saja melakukan booking <strong>${carName}</strong>.<br>Kode: ${booking.kode_booking || "—"}`,
              "warning",
              "🔔 Booking Baru Masuk",
              8000
            );
            _incrementBadge();
            if (callbacks.onNew) callbacks.onNew(payload);
          }

          if (payload.eventType === "UPDATE") {
            if (callbacks.onUpdate) callbacks.onUpdate(payload);
          }

          if (_onBookingUpdate) _onBookingUpdate(payload);
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[EasyCarRealtime] ✅ Admin channel terhubung:", channelName);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.error("[EasyCarRealtime] ❌ Admin channel error:", status, err);
          setTimeout(() => subscribeAllBookings(callbacks), 5000);
        } else {
          console.log("[EasyCarRealtime] Admin channel status:", status);
        }
      });

    _channels.push(ch);
    return ch;
  }

  // ── SET CALLBACK GLOBAL ─────────────────────────────
  function onBookingChange(fn) { _onBookingUpdate = fn; }

  // ── UNSUBSCRIBE ALL ─────────────────────────────────
  function unsubscribeAll() {
    _channels.forEach(ch => supabase.removeChannel(ch));
    _channels = [];
  }

  // ── WA HELPER ────────────────────────────────────────
  function buildWALink(booking, car) {
    const nama    = booking.nama_pemesan || "—";
    const mobil   = car?.nama || booking.car_id || "—";
    const mulai   = booking.tanggal_mulai ? new Date(booking.tanggal_mulai).toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" }) : "—";
    const selesai = booking.tanggal_selesai ? new Date(booking.tanggal_selesai).toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" }) : "—";
    const kode    = booking.kode_booking || "—";
    const msg = `Halo Admin EasyCar 🚗\n\nSaya ingin menanyakan pesanan saya:\n• Kode Booking : ${kode}\n• Nama          : ${nama}\n• Kendaraan     : ${mobil}\n• Tanggal        : ${mulai} s/d ${selesai}\n\nMohon konfirmasinya. Terima kasih 🙏`;
    return `https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`;
  }

  // ── PUBLIC API ───────────────────────────────────────
  return {
    showNotif,
    setBadge:              _setBadge,
    resetBadge,
    subscribeUserBookings,
    subscribeAllBookings,
    onBookingChange,
    unsubscribeAll,
    buildWALink,
    get adminWA() { return ADMIN_WA; },
  };

})();
