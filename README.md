# 🚗 EasyCar v2.0 — Refactored

Aplikasi rental kendaraan berbasis **Vanilla JS + Supabase**, hasil refactor lengkap dengan fokus pada:
- ✅ UX smooth tanpa flicker
- ✅ Auth flow natural (landing = Dashboard publik)
- ✅ Role-based access benar-benar aman (admin vs user)
- ✅ Anti double booking dengan validasi real-time + server-side
- ✅ Design system global yang konsisten
- ✅ Lazy loading + skeleton UI

---

## 📁 Struktur Proyek

```
easycar-v2/
├── index.html                    ← Landing page (publik, NO login)
├── auth.html                     ← Login & Register
├── 404.html
│
├── assets/css/
│   ├── theme.css                 ← 🎨 DESIGN SYSTEM GLOBAL (CSS variables, komponen)
│   └── shared.css                ← Style lama (backup)
│
├── components/
│   ├── public-navbar.js          ← Navbar untuk halaman publik (dengan avatar jika login)
│   ├── user-sidebar.js           ← Sidebar USER ONLY — tidak ada item admin sama sekali
│   └── admin-sidebar.js          ← Sidebar ADMIN ONLY — file terpisah, tidak pernah di-import di halaman user
│
├── services/
│   └── supabase.js               ← Supabase client + requireLogin() + requireAdmin() + checkAvailability()
│
├── utils/
│   └── ui.js                     ← Toast, Modal konfirmasi, Loading overlay, Button loading
│
├── pages/
│   ├── public/
│   │   └── vehicles.html         ← List armada publik (tanpa login)
│   │
│   ├── user/
│   │   ├── dashboard.html        ← Dashboard user (PROTECTED: requireLogin)
│   │   ├── booking.html          ← Form booking 4-step wizard (PROTECTED)
│   │   ├── my-orders.html        ← Riwayat pesanan user (PROTECTED)
│   │   └── profile.html          ← Edit profil + ubah password (PROTECTED)
│   │
│   └── admin/
│       ├── dashboard.html        ← Dashboard admin (PROTECTED: requireAdmin)
│       ├── vehicles.html         ← CRUD kendaraan (PROTECTED)
│       ├── bookings.html         ← Manajemen & update status pemesanan (PROTECTED)
│       ├── users.html            ← Manajemen pengguna + toggle role (PROTECTED)
│       ├── reports.html          ← Laporan & statistik (PROTECTED)
│       ├── promos.html           ← CRUD kode promo (PROTECTED)
│       └── settings.html         ← Pengaturan akun admin (PROTECTED)
│
└── supabase_schema.sql           ← Schema lengkap + RLS + anti double booking function
```

---

## 🚀 Setup

### 1. Buat Project Supabase
1. Buka [supabase.com](https://supabase.com) → New Project
2. Catat **Project URL** dan **Anon Key**

### 2. Jalankan Schema SQL
1. Di Supabase dashboard → **SQL Editor**
2. Paste isi `supabase_schema.sql` → Run
3. Semua tabel, RLS policy, index, dan fungsi anti double booking akan dibuat otomatis

### 3. Konfigurasi Supabase Client
Edit file `services/supabase.js`, ganti dua baris ini:
```js
const SUPABASE_URL      = "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";
```

### 4. Buat Admin Pertama
1. Register akun biasa lewat `/auth.html`
2. Di Supabase → **Table Editor** → tabel `profiles`
3. Temukan row dengan email Anda
4. Ubah kolom `role` dari `user` → `admin`
5. Login ulang → Anda akan diarahkan ke Admin Dashboard

### 5. Deploy
**Opsi A — GitHub Pages:**
```bash
git init
git add .
git commit -m "EasyCar v2 refactored"
git remote add origin https://github.com/USERNAME/easycar.git
git push -u origin main
```
Di GitHub → Settings → Pages → Deploy from branch `main`

**Opsi B — Netlify / Vercel:**
Drag & drop folder `easycar-v2` ke dashboard Netlify/Vercel.

**Opsi C — Lokal:**
Gunakan Live Server extension di VS Code atau:
```bash
npx serve .
```

---

## 🔐 Cara Kerja Auth (Anti-Flicker)

### Masalah Lama
```
render halaman → cek role → hide konten salah → FLICKER 👎
```

### Solusi Baru
```
body { visibility: hidden }        ← halaman invisible dulu
↓
requireLogin() / requireAdmin()    ← cek session + role
↓
Jika gagal → redirect (halaman tidak pernah terlihat)
↓
Jika OK    → sidebar diinit dengan data user
↓
body { visibility: visible }       ← baru tampil: ZERO FLICKER ✅
```

### Kode di setiap halaman protected:
```js
// User page
const user = await requireLogin();
if (!user) return;   // redirect otomatis, tidak perlu handling lagi
initUserSidebar("dashboard", user);

// Admin page
const user = await requireAdmin();
if (!user) return;   // jika bukan admin → redirect ke user dashboard
initAdminSidebar("dashboard", user);
```

---

## 🚗 Anti Double Booking

### Validasi 3 Lapis:

**Lapis 1 — Real-time saat pilih tanggal:**
```js
// services/supabase.js → checkAvailability()
SELECT * FROM bookings
WHERE car_id = ?
  AND status IN ('Menunggu','Dikonfirmasi','Aktif')
  AND tanggal_mulai <= input_end_date
  AND tanggal_selesai >= input_start_date
```
→ Tombol "Lanjutkan" disabled jika bentrok

**Lapis 2 — Saat submit booking:**
```js
// booking.html → submitBooking()
const isAvail = await checkAvailability(carId, startDate, endDate);
if (!isAvail) { reject booking } // final check sebelum INSERT
```

**Lapis 3 — Database function (SQL):**
```sql
-- supabase_schema.sql
CREATE FUNCTION check_car_availability(...) RETURNS BOOLEAN
```
Bisa digunakan sebagai Supabase Edge Function untuk validasi server-side tambahan.

---

## 🎨 Design System

Semua style terpusat di `assets/css/theme.css`.

### CSS Variables Utama:
```css
--color-primary:      #0f2347   /* Navy gelap */
--color-primary-mid:  #1a3c6e   /* Navy tengah */
--color-accent:       #e85d04   /* Orange CTA */
--color-bg:           #f3f6fb   /* Background halaman */
--color-surface:      #ffffff   /* Card/panel */
--radius-md:          12px      /* Border radius standar */
--radius-xl:          20px      /* Card */
--sidebar-width:      260px     /* Lebar sidebar */
```

### Komponen Global:
| Kelas | Fungsi |
|-------|--------|
| `.btn .btn-primary` | Tombol utama navy |
| `.btn .btn-accent` | Tombol CTA orange |
| `.btn .btn-ghost` | Tombol outline |
| `.btn .btn-danger` | Tombol hapus/batalkan |
| `.btn-sm / .btn-lg` | Ukuran tombol |
| `.card` | Card putih dengan shadow |
| `.card-hover` | Card dengan hover effect |
| `.badge-success/warning/danger/info` | Status badge |
| `.ec-input` | Input/select/textarea standar |
| `.skeleton` | Loading skeleton shimmer |
| `.fade-in` | Animasi masuk halaman |
| `.table-wrap` | Responsive table wrapper |

---

## ⚡ Fitur Lengkap

### Publik (tanpa login)
- [x] Landing page dengan daftar mobil
- [x] Filter kendaraan (tipe, transmisi, harga, nama)
- [x] Halaman armada lengkap dengan detail modal
- [x] Navbar dengan Login button / Avatar jika sudah login

### Auth
- [x] Login dengan email + password
- [x] Register akun baru
- [x] Lupa password (email reset)
- [x] Redirect ke halaman sebelumnya setelah login
- [x] Auto-redirect berdasarkan role (user → user dashboard, admin → admin dashboard)

### User (setelah login)
- [x] Dashboard dengan statistik personal
- [x] Booking wizard 4 langkah
- [x] Pilih kendaraan dengan filter
- [x] Pilih tanggal dengan calendar picker (Flatpickr)
- [x] Tanggal terpesan otomatis ditampilkan + disabled
- [x] Cek ketersediaan real-time saat pilih tanggal
- [x] Validasi final anti double booking saat submit
- [x] Daftar pesanan dengan filter status
- [x] Detail pesanan + tombol batalkan
- [x] Edit profil + ubah password

### Admin (fully protected)
- [x] Dashboard dengan statistik global
- [x] Notif pesanan menunggu konfirmasi
- [x] CRUD kendaraan (tambah/edit/hapus + foto URL)
- [x] Manajemen pemesanan (filter, cari, update status)
- [x] Manajemen pengguna (lihat semua, toggle role admin/user)
- [x] Laporan (top kendaraan, distribusi status, transaksi selesai)
- [x] CRUD promo/diskon (persen & nominal, expiry date)
- [x] Pengaturan akun admin

---

## 🐛 Troubleshooting

**Q: Sidebar admin muncul sebentar di halaman user?**
A: Pastikan halaman user menggunakan `user-sidebar.js`, BUKAN `admin-sidebar.js`. Cek script tag di `<body>`.

**Q: Booking berhasil dibuat tapi muncul konflik?**
A: Jalankan ulang `supabase_schema.sql` untuk memastikan index `idx_bookings_car_dates` ada.

**Q: Login berhasil tapi tidak redirect ke dashboard?**
A: Cek tabel `profiles` di Supabase — pastikan row untuk user tersebut ada dan kolom `role` terisi.

**Q: Halaman blank setelah deploy?**
A: Pastikan path ke `supabase.js`, `theme.css`, dan komponen menggunakan path absolut (dimulai `/`) bukan relatif.

---

## 📝 Catatan Tambahan

- Semua halaman admin menggunakan `requireAdmin()` — jika bukan admin, redirect ke user dashboard tanpa flash
- Sidebar user dan admin adalah file JS **terpisah** — tidak ada risiko bocor item menu
- `body.ec-loading { visibility: hidden }` + `body.ec-ready { visibility: visible }` adalah kunci anti-flicker
- Toast, modal, dan loading overlay tersedia global dari `utils/ui.js`
- Format Rupiah dan tanggal tersedia global dari `services/supabase.js`

---

&copy; 2026 EasyCar — Built with ❤️ using Vanilla JS + Supabase
