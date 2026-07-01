-- =====================================================
-- EASYCAR v2 — FIX RLS INFINITE RECURSION + TRIGGER BUG
-- =====================================================
-- MASALAH 1: profiles_admin policy menyebabkan infinite recursion
--   → Policy "profiles_admin" query ke tabel profiles DARI dalam policy profiles
--   → Supabase tidak bisa evaluate → HTTP 500 di semua query
--
-- MASALAH 2: handle_new_user trigger bisa reset role admin ke 'user'
--   → Saat profile di-upsert, role di-overwrite dari metadata (default 'user')
--
-- SOLUSI:
--   1. Buat fungsi is_admin() dengan SECURITY DEFINER → bypass RLS saat cek role
--   2. Semua policy yang cek role pakai fungsi ini, bukan subquery ke profiles
--   3. Perbaiki trigger agar TIDAK overwrite role yang sudah ada di database
-- =====================================================

-- ─────────────────────────────────────────────────────
-- STEP 1: Buat fungsi helper is_admin() SECURITY DEFINER
-- Fungsi ini berjalan sebagai superuser (bypass RLS)
-- sehingga tidak terjadi infinite recursion
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Grant ke semua authenticated user agar bisa dipanggil dalam policy
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;


-- ─────────────────────────────────────────────────────
-- STEP 2: Drop semua policy lama dan buat ulang yang benar
-- ─────────────────────────────────────────────────────

-- PROFILES policies
DROP POLICY IF EXISTS "profiles_self"   ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_admin"  ON profiles;

-- User bisa baca profil sendiri
CREATE POLICY "profiles_self"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- User bisa insert profil sendiri (dibutuhkan untuk upsert saat register)
CREATE POLICY "profiles_insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User bisa update profil sendiri
CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin bisa akses semua profiles — pakai is_admin() bukan subquery inline
CREATE POLICY "profiles_admin"
  ON profiles FOR ALL
  USING (public.is_admin());


-- CARS policies
DROP POLICY IF EXISTS "cars_read_all" ON cars;
DROP POLICY IF EXISTS "cars_admin"    ON cars;

CREATE POLICY "cars_read_all"
  ON cars FOR SELECT
  USING (true);

-- Admin bisa INSERT/UPDATE/DELETE cars — pakai is_admin()
CREATE POLICY "cars_admin"
  ON cars FOR ALL
  USING (public.is_admin());


-- BOOKINGS policies
DROP POLICY IF EXISTS "bookings_user_read"   ON bookings;
DROP POLICY IF EXISTS "bookings_user_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_user_cancel" ON bookings;
DROP POLICY IF EXISTS "bookings_admin"       ON bookings;

CREATE POLICY "bookings_user_read"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "bookings_user_insert"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_user_cancel"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('Menunggu', 'Menunggu Konfirmasi'));

-- Admin bisa akses semua bookings — pakai is_admin()
CREATE POLICY "bookings_admin"
  ON bookings FOR ALL
  USING (public.is_admin());


-- PROMOS policies
DROP POLICY IF EXISTS "promos_read"  ON promos;
DROP POLICY IF EXISTS "promos_admin" ON promos;

CREATE POLICY "promos_read"
  ON promos FOR SELECT
  USING (status = 'aktif');

-- Admin bisa manage promos — pakai is_admin()
CREATE POLICY "promos_admin"
  ON promos FOR ALL
  USING (public.is_admin());


-- BOOKING_DOCUMENTS policies
DROP POLICY IF EXISTS "docs_user_insert" ON booking_documents;
DROP POLICY IF EXISTS "docs_user_read"   ON booking_documents;
DROP POLICY IF EXISTS "docs_admin"       ON booking_documents;

CREATE POLICY "docs_user_insert"
  ON booking_documents FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = auth.uid())
  );

CREATE POLICY "docs_user_read"
  ON booking_documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_id AND b.user_id = auth.uid())
  );

-- Admin bisa akses semua documents — pakai is_admin()
CREATE POLICY "docs_admin"
  ON booking_documents FOR ALL
  USING (public.is_admin());


-- ─────────────────────────────────────────────────────
-- STEP 3: Perbaiki trigger handle_new_user
-- Bug: role selalu di-overwrite dari metadata (default 'user')
-- sehingga admin yang sudah ada bisa ke-reset rolenya
--
-- Fix: ON CONFLICT, jangan update role — pertahankan nilai yang ada di DB
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email     = COALESCE(EXCLUDED.email,     profiles.email),
    phone     = COALESCE(EXCLUDED.phone,     profiles.phone);
    -- SENGAJA tidak update role — role hanya bisa diubah oleh admin via dashboard
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ─────────────────────────────────────────────────────
-- STEP 4: Pastikan fungsi get_unavailable_dates ada dan SECURITY DEFINER
-- Dibutuhkan agar user bisa lihat tanggal yang sudah dipesan user lain
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_unavailable_dates(p_car_id UUID)
RETURNS TABLE(tanggal_mulai DATE, tanggal_selesai DATE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT b.tanggal_mulai, b.tanggal_selesai
  FROM bookings b
  WHERE b.car_id = p_car_id
    AND b.status IN ('Menunggu', 'Menunggu Konfirmasi', 'Dikonfirmasi', 'Aktif');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_unavailable_dates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unavailable_dates(UUID) TO anon;


-- ─────────────────────────────────────────────────────
-- VERIFIKASI — jalankan ini untuk cek semua policy sudah benar
-- ─────────────────────────────────────────────────────
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
