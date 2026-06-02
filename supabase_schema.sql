-- =====================================================
-- EASYCAR v2 — SUPABASE SCHEMA (SAFE / MIGRATION)
-- Run ini di SQL Editor Supabase
-- Aman dijalankan berulang (idempotent)
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  phone       TEXT,
  no_ktp      TEXT,
  alamat      TEXT,
  role        TEXT DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tambah kolom baru jika belum ada (safe ALTER)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='no_ktp') THEN
    ALTER TABLE profiles ADD COLUMN no_ktp TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='alamat') THEN
    ALTER TABLE profiles ADD COLUMN alamat TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user','admin'));
  END IF;
END $$;

-- Trigger: auto-create profile saat user baru register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ─────────────────────────────────────────────────────
-- 2. CARS
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cars (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama           TEXT NOT NULL,
  tipe           TEXT,
  transmisi      TEXT,
  kapasitas      INT,
  tahun          INT,
  harga_per_hari NUMERIC(12,2) NOT NULL DEFAULT 0,
  foto_url       TEXT,
  status         TEXT DEFAULT 'Tersedia',
  nomor_plat     TEXT,
  deskripsi      TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Tambah kolom baru jika belum ada
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='transmisi') THEN
    ALTER TABLE cars ADD COLUMN transmisi TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='kapasitas') THEN
    ALTER TABLE cars ADD COLUMN kapasitas INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='tahun') THEN
    ALTER TABLE cars ADD COLUMN tahun INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='nomor_plat') THEN
    ALTER TABLE cars ADD COLUMN nomor_plat TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='deskripsi') THEN
    ALTER TABLE cars ADD COLUMN deskripsi TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='foto_url') THEN
    ALTER TABLE cars ADD COLUMN foto_url TEXT;
  END IF;
END $$;

-- Pastikan status check constraint ada
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'cars_status_check'
  ) THEN
    ALTER TABLE cars ADD CONSTRAINT cars_status_check
      CHECK (status IN ('Tersedia','Disewa','Perawatan'));
  END IF;
END $$;


-- ─────────────────────────────────────────────────────
-- 3. BOOKINGS
--    PENTING: cek nama kolom lama dulu, lalu rename/tambah
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_booking TEXT,
  user_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  car_id       UUID REFERENCES cars(id)     ON DELETE SET NULL,
  status       TEXT DEFAULT 'Menunggu',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Rename kolom lama jika masih pakai nama Inggris
DO $$ BEGIN
  -- start_date → tanggal_mulai
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='start_date')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='tanggal_mulai') THEN
    ALTER TABLE bookings RENAME COLUMN start_date TO tanggal_mulai;
  END IF;

  -- end_date → tanggal_selesai
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='end_date')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='tanggal_selesai') THEN
    ALTER TABLE bookings RENAME COLUMN end_date TO tanggal_selesai;
  END IF;

  -- rental_date → tanggal_mulai (nama lain yang mungkin)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='rental_date')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='tanggal_mulai') THEN
    ALTER TABLE bookings RENAME COLUMN rental_date TO tanggal_mulai;
  END IF;

  -- return_date → tanggal_selesai
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='return_date')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='tanggal_selesai') THEN
    ALTER TABLE bookings RENAME COLUMN return_date TO tanggal_selesai;
  END IF;
END $$;

-- Tambah kolom wajib jika belum ada
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='tanggal_mulai') THEN
    ALTER TABLE bookings ADD COLUMN tanggal_mulai DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='tanggal_selesai') THEN
    ALTER TABLE bookings ADD COLUMN tanggal_selesai DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='durasi_hari') THEN
    ALTER TABLE bookings ADD COLUMN durasi_hari INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='total_harga') THEN
    ALTER TABLE bookings ADD COLUMN total_harga NUMERIC(14,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='nama_pemesan') THEN
    ALTER TABLE bookings ADD COLUMN nama_pemesan TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='no_hp') THEN
    ALTER TABLE bookings ADD COLUMN no_hp TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='no_ktp') THEN
    ALTER TABLE bookings ADD COLUMN no_ktp TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='alamat') THEN
    ALTER TABLE bookings ADD COLUMN alamat TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='catatan') THEN
    ALTER TABLE bookings ADD COLUMN catatan TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='kode_booking') THEN
    ALTER TABLE bookings ADD COLUMN kode_booking TEXT;
  END IF;

  -- total_price → total_harga
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='total_price')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='total_harga') THEN
    ALTER TABLE bookings RENAME COLUMN total_price TO total_harga;
  END IF;

  -- duration → durasi_hari
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='duration')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='durasi_hari') THEN
    ALTER TABLE bookings RENAME COLUMN duration TO durasi_hari;
  END IF;
END $$;

-- Pastikan status check constraint ada
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'bookings_status_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
      CHECK (status IN ('Menunggu','Dikonfirmasi','Aktif','Selesai','Dibatalkan'));
  END IF;
END $$;

-- Unique constraint pada kode_booking
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='bookings' AND constraint_name='bookings_kode_booking_key'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_kode_booking_key UNIQUE (kode_booking);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────
-- 4. PROMOS (tabel baru)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode           TEXT UNIQUE NOT NULL,
  deskripsi      TEXT,
  tipe           TEXT DEFAULT 'percent' CHECK (tipe IN ('percent','nominal')),
  nilai_diskon   NUMERIC(12,2) NOT NULL,
  min_hari       INT,
  berlaku_hingga DATE,
  status         TEXT DEFAULT 'aktif' CHECK (status IN ('aktif','nonaktif')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);


-- ─────────────────────────────────────────────────────
-- 5. FUNGSI ANTI DOUBLE BOOKING
--    Cek overlap tanggal sebelum insert booking
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_car_availability(
  p_car_id  UUID,
  p_start   DATE,
  p_end     DATE,
  p_exclude UUID DEFAULT NULL   -- isi saat UPDATE untuk exclude booking sendiri
)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  conflict_count INT;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE car_id = p_car_id
    AND status IN ('Menunggu', 'Dikonfirmasi', 'Aktif')
    AND (p_exclude IS NULL OR id <> p_exclude)
    AND tanggal_mulai  <= p_end    -- booking lama mulai sebelum/saat end baru
    AND tanggal_selesai >= p_start; -- booking lama selesai setelah/saat start baru
  RETURN conflict_count = 0;
END;
$$;


-- ─────────────────────────────────────────────────────
-- 6. RLS (Row Level Security)
-- ─────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE promos   ENABLE ROW LEVEL SECURITY;

-- Drop existing policies dulu (supaya tidak error duplicate)
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

-- PROFILES policies
CREATE POLICY "profiles_self"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_admin"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- CARS policies
CREATE POLICY "cars_read_all"
  ON cars FOR SELECT
  USING (true);  -- siapapun bisa baca (halaman publik)

CREATE POLICY "cars_admin"
  ON cars FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- BOOKINGS policies
CREATE POLICY "bookings_user_read"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "bookings_user_insert"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_user_cancel"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id AND status = 'Menunggu');

CREATE POLICY "bookings_admin"
  ON bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- PROMOS policies
CREATE POLICY "promos_read"
  ON promos FOR SELECT
  USING (status = 'aktif');

CREATE POLICY "promos_admin"
  ON promos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );


-- ─────────────────────────────────────────────────────
-- 7. INDEXES untuk performa
-- ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_car_dates
  ON bookings (car_id, tanggal_mulai, tanggal_selesai, status);

CREATE INDEX IF NOT EXISTS idx_bookings_user
  ON bookings (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cars_status
  ON cars (status);

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles (role);


-- ─────────────────────────────────────────────────────
-- SELESAI
-- Verifikasi: jalankan query ini untuk cek semua tabel ada
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
-- ─────────────────────────────────────────────────────
