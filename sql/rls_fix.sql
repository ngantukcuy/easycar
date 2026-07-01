-- =====================================================
-- EASYCAR — RLS FIX (HTTP 500 Supabase)
-- Jalankan di: Supabase Dashboard → SQL Editor
-- =====================================================
-- Masalah: Policy admin menggunakan subquery ke tabel
-- "profiles" yang sedang di-query → infinite recursion
-- → PostgreSQL error → Supabase return HTTP 500
-- Solusi: Pakai helper function SECURITY DEFINER
-- (berjalan sebagai superuser, bypass RLS saat cek role)
-- =====================================================


-- ─────────────────────────────────────────────────────
-- LANGKAH 1: Buat helper function is_admin()
-- SECURITY DEFINER = berjalan sebagai owner tabel,
-- tidak terkena RLS → tidak ada recursive loop
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;


-- ─────────────────────────────────────────────────────
-- LANGKAH 2: Drop semua policy lama yang bermasalah
-- ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_self"         ON profiles;
DROP POLICY IF EXISTS "profiles_update"       ON profiles;
DROP POLICY IF EXISTS "profiles_admin"        ON profiles;
DROP POLICY IF EXISTS "cars_read_all"         ON cars;
DROP POLICY IF EXISTS "cars_admin"            ON cars;
DROP POLICY IF EXISTS "bookings_user_read"    ON bookings;
DROP POLICY IF EXISTS "bookings_user_insert"  ON bookings;
DROP POLICY IF EXISTS "bookings_user_cancel"  ON bookings;
DROP POLICY IF EXISTS "bookings_admin"        ON bookings;
DROP POLICY IF EXISTS "promos_read"           ON promos;
DROP POLICY IF EXISTS "promos_admin"          ON promos;


-- ─────────────────────────────────────────────────────
-- LANGKAH 3: Buat ulang policy pakai is_admin()
-- ─────────────────────────────────────────────────────

-- PROFILES
CREATE POLICY "profiles_self"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_admin"
  ON profiles FOR ALL
  USING (public.is_admin());


-- CARS
CREATE POLICY "cars_read_all"
  ON cars FOR SELECT
  USING (true);   -- publik bisa baca (untuk halaman kendaraan & index)

CREATE POLICY "cars_admin"
  ON cars FOR ALL
  USING (public.is_admin());


-- BOOKINGS
-- NOTE: bookings_user_read hanya memperbolehkan user melihat booking miliknya sendiri.
-- bookings_admin (FOR ALL) memperbolehkan admin SELECT semua booking.
-- Supabase evaluates policies dengan OR — admin yang login akan match bookings_admin.
-- Jika admin TIDAK bisa lihat booking, pastikan rls_fix.sql ini sudah dijalankan
-- (bukan supabase_schema.sql yang lama yang punya recursive policy).
CREATE POLICY "bookings_user_read"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "bookings_user_insert"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_user_cancel"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('Menunggu', 'Menunggu Konfirmasi'));

CREATE POLICY "bookings_admin"
  ON bookings FOR ALL
  USING (public.is_admin());


-- PROMOS
CREATE POLICY "promos_read"
  ON promos FOR SELECT
  USING (status = 'aktif');

CREATE POLICY "promos_admin"
  ON promos FOR ALL
  USING (public.is_admin());


-- ─────────────────────────────────────────────────────
-- LANGKAH 4: Fix query "bookings count" di halaman publik
-- index.html memanggil SELECT count bookings tanpa login
-- → RLS blokir → return error.
-- Solusi: buat function khusus SECURITY DEFINER untuk
-- hitung total booking (tanpa expose data sensitif)
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_bookings', (SELECT COUNT(*) FROM bookings),
    'available_cars', (SELECT COUNT(*) FROM cars WHERE status = 'Tersedia')
  );
$$;

-- Izinkan akses publik (anon) ke function ini
GRANT EXECUTE ON FUNCTION public.get_public_stats() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ─────────────────────────────────────────────────────
-- VERIFIKASI — jalankan ini untuk cek hasilnya
-- ─────────────────────────────────────────────────────
-- SELECT policyname, tablename, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
