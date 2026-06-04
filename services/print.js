// =====================================================
// EASYCAR — PRINT / INVOICE SYSTEM (A4 Professional)
// Dipakai oleh user & admin, format sama
// =====================================================

window.EasyCarPrint = (function () {

  function _formatRp(angka) {
    return new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", minimumFractionDigits:0 }).format(angka || 0);
  }

  function _fmtTgl(d) {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric" });
  }

  /**
   * printInvoiceA4(booking, car)
   * booking: object dari tabel bookings (+ field join cars, profiles)
   * car: object kendaraan (opsional, bisa ambil dari booking.cars)
   */
  function printInvoiceA4(booking, car) {
    car = car || booking.cars || {};

    const kode      = booking.kode_booking || ("EC-" + (booking.id || "").slice(-8).toUpperCase());
    const nama      = booking.nama_pemesan  || "—";
    const noKtp     = booking.no_ktp        || "";
    const noHp      = booking.no_hp         || "";
    const alamat    = booking.alamat        || "";
    const email     = booking.email_pemesan || "";
    const tujuan    = booking.tujuan_sewa   || "";
    const jaminan   = booking.jenis_jaminan === "kendaraan" ? "Jaminan Kendaraan" : "Jaminan Non-Kendaraan";

    const mulai     = _fmtTgl(booking.tanggal_mulai);
    const selesai   = _fmtTgl(booking.tanggal_selesai);
    const durasi    = booking.durasi_hari || 0;

    const total     = booking.total_harga    || 0;
    const dp        = booking.dp_amount      || 0;
    const deposit   = booking.deposit_amount || 0;
    const bayarNow  = dp + deposit;
    const sisa      = booking.sisa_pelunasan || (total - dp);

    const status    = booking.status || "—";
    const createdAt = booking.created_at
      ? new Date(booking.created_at).toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })
      : new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" });

    const statusColor = {
      "Dikonfirmasi": "#16a34a",
      "Aktif":        "#2563eb",
      "Selesai":      "#7c3aed",
      "Ditolak":      "#dc2626",
      "Dibatalkan":   "#dc2626",
      "Menunggu":     "#d97706",
      "Menunggu Konfirmasi": "#d97706",
    }[status] || "#64748b";

    // Kendaraan jaminan (jika ada)
    const jkJenis = booking.jaminan_kendaraan_jenis || "";
    const jkMerek = booking.jaminan_kendaraan_merek || "";
    const jkTahun = booking.jaminan_kendaraan_tahun || "";
    const jkPlat  = booking.jaminan_kendaraan_plat  || "";
    const hasJK   = booking.jenis_jaminan === "kendaraan" && jkMerek;

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice EasyCar — ${kode}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4; margin: 1.5cm 1.8cm; }
    body {
      font-family: 'Poppins', 'Segoe UI', sans-serif;
      font-size: 10pt;
      color: #1e293b;
      background: #fff;
      line-height: 1.5;
    }

    /* ── HEADER ── */
    .inv-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 1.25rem;
      border-bottom: 3px solid #0f2347;
      margin-bottom: 1.5rem;
    }
    .brand { display: flex; align-items: center; gap: 10px; }
    .brand-icon {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, #e85d04, #ff7733);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .brand-icon svg { width: 24px; height: 24px; fill: white; }
    .brand-name { font-size: 20pt; font-weight: 800; color: #0f2347; letter-spacing: -0.5px; }
    .brand-name span { color: #e85d04; }
    .brand-tagline { font-size: 7.5pt; color: #64748b; margin-top: 1px; }

    .inv-meta { text-align: right; }
    .inv-meta .inv-label { font-size: 7pt; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; }
    .inv-meta .inv-num { font-size: 14pt; font-weight: 800; color: #0f2347; font-family: 'Courier New', monospace; }
    .inv-meta .inv-date { font-size: 8pt; color: #64748b; margin-top: 2px; }

    .status-badge {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 3px 10px; border-radius: 20px; font-size: 8pt; font-weight: 700;
      margin-top: 6px;
    }

    /* ── SECTION CARD ── */
    .section { margin-bottom: 1.2rem; }
    .section-title {
      font-size: 8pt; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.1em;
      margin-bottom: 0.5rem; padding-bottom: 0.3rem;
      border-bottom: 1px solid #e2e8f0;
    }

    /* ── TWO-COL LAYOUT ── */
    .two-col { display: flex; gap: 1.5rem; }
    .two-col > div { flex: 1; }

    /* ── INFO TABLE ── */
    .info-table { width: 100%; border-collapse: collapse; }
    .info-table td { padding: 3px 0; vertical-align: top; }
    .info-table .lbl { font-size: 8pt; color: #94a3b8; font-weight: 500; width: 40%; white-space: nowrap; }
    .info-table .val { font-size: 9pt; color: #1e293b; font-weight: 600; }

    /* ── CAR BOX ── */
    .car-box {
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 1rem;
      display: flex; align-items: center; gap: 0.875rem;
      margin-bottom: 1.2rem;
    }
    .car-icon {
      width: 56px; height: 40px;
      background: #0f2347;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .car-icon svg { width: 28px; height: 28px; fill: white; }
    .car-name { font-size: 13pt; font-weight: 800; color: #0f2347; }
    .car-sub  { font-size: 8pt; color: #64748b; margin-top: 1px; }

    /* ── PAYMENT TABLE ── */
    .pay-table { width: 100%; border-collapse: collapse; margin-bottom: 0.5rem; }
    .pay-table tr td { padding: 6px 10px; }
    .pay-table tr:not(:last-child) td { border-bottom: 1px solid #f1f5f9; }
    .pay-table .pay-label { font-size: 9pt; color: #475569; }
    .pay-table .pay-val   { font-size: 9pt; font-weight: 600; color: #1e293b; text-align: right; white-space: nowrap; }
    .pay-table .pay-accent .pay-val { color: #e85d04; }
    .pay-total-row td { background: #0f2347; }
    .pay-total-row .pay-label { color: rgba(255,255,255,0.8); font-weight: 600; font-size: 10pt; border-radius: 6px 0 0 6px; }
    .pay-total-row .pay-val   { color: #fb923c; font-size: 12pt; font-weight: 800; border-radius: 0 6px 6px 0; }
    .pay-sisa-row td { background: #fef9f3; }
    .pay-sisa-row .pay-label { color: #78716c; font-size: 8.5pt; }
    .pay-sisa-row .pay-val   { color: #dc2626; font-weight: 700; font-size: 9pt; }

    /* ── FOOTER ── */
    .inv-footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .footer-note { font-size: 7.5pt; color: #94a3b8; max-width: 60%; line-height: 1.6; }
    .footer-sign { text-align: right; }
    .footer-sign .sign-label { font-size: 7.5pt; color: #94a3b8; margin-bottom: 40px; }
    .footer-sign .sign-name  { font-size: 9pt; font-weight: 700; color: #0f2347; border-top: 1.5px solid #0f2347; padding-top: 4px; }

    /* ── PRINT UTILS ── */
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    .no-print { display: none !important; }
  </style>
</head>
<body>

  <!-- PRINT BUTTON (hilang saat print) -->
  <div class="no-print" style="position:fixed;top:1rem;right:1rem;display:flex;gap:0.5rem;z-index:99;">
    <button onclick="window.print()" style="padding:0.5rem 1.25rem;background:#0f2347;color:#fff;border:none;border-radius:8px;font-family:inherit;font-size:0.875rem;font-weight:600;cursor:pointer;">
      🖨️ Cetak / Print
    </button>
    <button onclick="window.close()" style="padding:0.5rem 1rem;background:#f1f5f9;color:#475569;border:1px solid #e2e8f0;border-radius:8px;font-family:inherit;font-size:0.875rem;cursor:pointer;">
      ✕ Tutup
    </button>
  </div>

  <!-- ══ HEADER ══ -->
  <div class="inv-header">
    <div>
      <div class="brand">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24"><path d="M5 11l1.5-4.5h11L19 11m-1 5v2H6v-2m-.5-7h13l1.5 4.5H4.5L6 9zM3 13h18v3H3z"/></svg>
        </div>
        <div>
          <div class="brand-name">Easy<span>Car</span></div>
          <div class="brand-tagline">Rental Kendaraan Terpercaya — Pekanbaru, Riau</div>
        </div>
      </div>
    </div>
    <div class="inv-meta">
      <div class="inv-label">Invoice / Kwitansi</div>
      <div class="inv-num">${kode}</div>
      <div class="inv-date">Dicetak: ${new Date().toLocaleDateString("id-ID", { day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })}</div>
      <div>
        <span class="status-badge" style="background:${statusColor}20;color:${statusColor};border:1.5px solid ${statusColor}40;">
          ${status}
        </span>
      </div>
    </div>
  </div>

  <!-- ══ KENDARAAN ══ -->
  <div class="car-box">
    <div class="car-icon">
      <svg viewBox="0 0 24 24"><path d="M5 11l1.5-4.5h11L19 11m-1 5v2H6v-2m-.5-7h13l1.5 4.5H4.5L6 9zM3 13h18v3H3z"/></svg>
    </div>
    <div>
      <div class="car-name">${car.nama || "—"}</div>
      <div class="car-sub">${[car.tipe, car.transmisi, car.warna, car.tahun ? "Tahun " + car.tahun : ""].filter(Boolean).join(" · ")}</div>
    </div>
    <div style="margin-left:auto;text-align:right;">
      <div style="font-size:8pt;color:#94a3b8;">Periode Sewa</div>
      <div style="font-size:10pt;font-weight:700;color:#0f2347;">${mulai}</div>
      <div style="font-size:8pt;color:#64748b;">s/d ${selesai}</div>
      <div style="font-size:8pt;font-weight:600;color:#e85d04;">${durasi} hari</div>
    </div>
  </div>

  <!-- ══ TWO-COL: PEMESAN + JAMINAN ══ -->
  <div class="two-col" style="margin-bottom:1.2rem;">
    <div>
      <div class="section-title">Data Pemesan</div>
      <table class="info-table">
        <tr><td class="lbl">Nama Lengkap</td><td class="val">${nama}</td></tr>
        ${noKtp  ? `<tr><td class="lbl">No. KTP / NIK</td><td class="val">${noKtp}</td></tr>` : ""}
        ${noHp   ? `<tr><td class="lbl">No. HP / WA</td><td class="val">${noHp}</td></tr>` : ""}
        ${email  ? `<tr><td class="lbl">Email</td><td class="val">${email}</td></tr>` : ""}
        ${alamat ? `<tr><td class="lbl">Alamat</td><td class="val">${alamat}</td></tr>` : ""}
        ${tujuan ? `<tr><td class="lbl">Tujuan Sewa</td><td class="val">${tujuan}</td></tr>` : ""}
      </table>
    </div>
    <div>
      <div class="section-title">Jaminan</div>
      <table class="info-table">
        <tr><td class="lbl">Tipe Jaminan</td><td class="val">${jaminan}</td></tr>
        ${hasJK ? `
          <tr><td class="lbl">Jenis</td><td class="val">${jkJenis}</td></tr>
          <tr><td class="lbl">Merek / Model</td><td class="val">${jkMerek}</td></tr>
          <tr><td class="lbl">Tahun</td><td class="val">${jkTahun}</td></tr>
          <tr><td class="lbl">No. Plat</td><td class="val" style="font-weight:800;letter-spacing:0.05em;">${jkPlat}</td></tr>
        ` : "<tr><td class='lbl'>Keterangan</td><td class='val'>Deposit tunai Rp 2.000.000</td></tr>"}
      </table>

      ${booking.alasan_tolak ? `
        <div style="margin-top:0.75rem;background:#fef2f2;border:1.5px solid #fca5a5;border-radius:8px;padding:0.625rem 0.875rem;">
          <div style="font-size:7.5pt;font-weight:700;color:#dc2626;margin-bottom:2px;">Alasan Penolakan</div>
          <div style="font-size:8.5pt;color:#7f1d1d;">${booking.alasan_tolak}</div>
        </div>
      ` : ""}
    </div>
  </div>

  <!-- ══ RINCIAN PEMBAYARAN ══ -->
  <div class="section">
    <div class="section-title">Rincian Pembayaran</div>
    <table class="pay-table">
      <tr>
        <td class="pay-label">Harga Sewa (${_formatRp(car.harga_per_hari || (total / (durasi || 1)))}/hari × ${durasi} hari)</td>
        <td class="pay-val">${_formatRp(total)}</td>
      </tr>
      ${dp > 0 ? `
      <tr class="pay-accent">
        <td class="pay-label">DP Booking (30% dari total sewa)</td>
        <td class="pay-val">${_formatRp(dp)}</td>
      </tr>` : `
      <tr>
        <td class="pay-label">DP Booking</td>
        <td class="pay-val" style="color:#94a3b8;">Tidak ada (jaminan non-kendaraan)</td>
      </tr>`}
      <tr class="pay-accent">
        <td class="pay-label">Deposit Jaminan</td>
        <td class="pay-val">${_formatRp(deposit)}</td>
      </tr>
      <tr class="pay-total-row">
        <td class="pay-label" style="padding-left:14px;border-radius:8px 0 0 8px;">Total Dibayar Saat Booking</td>
        <td class="pay-val" style="padding-right:14px;border-radius:0 8px 8px 0;">${_formatRp(bayarNow)}</td>
      </tr>
      ${sisa > 0 ? `
      <tr class="pay-sisa-row">
        <td class="pay-label" style="font-style:italic;">Sisa Pelunasan (dibayar saat pengambilan)</td>
        <td class="pay-val">${_formatRp(sisa)}</td>
      </tr>` : ""}
    </table>
  </div>

  <!-- ══ FOOTER ══ -->
  <div class="inv-footer">
    <div class="footer-note">
      <strong>Catatan:</strong><br>
      • Booking dibuat pada: ${createdAt}<br>
      • Deposit dikembalikan setelah kendaraan dikembalikan dalam kondisi baik.<br>
      • Bawa dokumen asli (KTP, SIM A) saat pengambilan kendaraan.<br>
      • Hubungi kami: WhatsApp 0822-7610-0996
    </div>
    <div class="footer-sign">
      <div class="sign-label">Hormat kami,</div>
      <div class="sign-name">EasyCar Rental</div>
    </div>
  </div>

  <script>
    // Auto-print jika dibuka dari tombol cetak
    if (window.location.hash === '#autoprint') {
      window.onload = function() { window.print(); };
    }
  </script>
</body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) {
      alert("Popup diblokir browser. Izinkan popup untuk mencetak.");
      return;
    }
    w.document.write(html);
    w.document.close();
  }

  return { printInvoiceA4 };

})();
