-- =====================================================
-- EASYCAR — DIAGNOSTIC SCRIPT
-- Jalankan ini DULU sebelum supabase_schema.sql
-- untuk melihat struktur tabel yang sudah ada
-- =====================================================

-- Lihat semua tabel yang sudah ada
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ── Lihat kolom tabel bookings ──
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'bookings'
ORDER BY ordinal_position;

-- ── Lihat kolom tabel cars ──
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'cars'
ORDER BY ordinal_position;

-- ── Lihat kolom tabel profiles ──
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'profiles'
ORDER BY ordinal_position;

-- ── Cek apakah kolom tanggal_mulai SUDAH ada ──
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='bookings' AND column_name='tanggal_mulai'
    ) THEN '✅ tanggal_mulai SUDAH ADA'
    ELSE '❌ tanggal_mulai BELUM ADA — perlu rename/tambah'
  END AS cek_tanggal_mulai,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='bookings' AND column_name='tanggal_selesai'
    ) THEN '✅ tanggal_selesai SUDAH ADA'
    ELSE '❌ tanggal_selesai BELUM ADA — perlu rename/tambah'
  END AS cek_tanggal_selesai,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='bookings' AND column_name='start_date'
    ) THEN '⚠️  start_date ditemukan — akan di-rename ke tanggal_mulai'
    ELSE '— start_date tidak ada'
  END AS cek_start_date,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name='bookings' AND column_name='end_date'
    ) THEN '⚠️  end_date ditemukan — akan di-rename ke tanggal_selesai'
    ELSE '— end_date tidak ada'
  END AS cek_end_date;
