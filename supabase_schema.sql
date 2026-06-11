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
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
END $$;

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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='transmisi') THEN ALTER TABLE cars ADD COLUMN transmisi TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='kapasitas') THEN ALTER TABLE cars ADD COLUMN kapasitas INT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='tahun') THEN ALTER TABLE cars ADD COLUMN tahun INT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='nomor_plat') THEN ALTER TABLE cars ADD COLUMN nomor_plat TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='deskripsi') THEN ALTER TABLE cars ADD COLUMN deskripsi TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='foto_url') THEN ALTER TABLE cars ADD COLUMN foto_url TEXT; END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'cars_status_check') THEN
    ALTER TABLE cars ADD CONSTRAINT cars_status_check CHECK (status IN ('Tersedia','Disewa','Perawatan'));
  END IF;
END $$;


-- ─────────────────────────────────────────────────────
-- 3. BOOKINGS
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
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='start_date')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='tanggal_mulai') THEN
    ALTER TABLE bookings RENAME COLUMN start_date TO tanggal_mulai;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='end_date')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='tanggal_selesai') THEN
    ALTER TABLE bookings RENAME COLUMN end_date TO tanggal_selesai;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='total_price')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='total_harga') THEN
    ALTER TABLE bookings RENAME COLUMN total_price TO total_harga;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='duration')
  AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='durasi_hari') THEN
    ALTER TABLE bookings RENAME COLUMN duration TO durasi_hari;
  END IF;
END $$;

-- Tambah kolom dasar
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='tanggal_mulai') THEN ALTER TABLE bookings ADD COLUMN tanggal_mulai DATE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='tanggal_selesai') THEN ALTER TABLE bookings ADD COLUMN tanggal_selesai DATE; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='durasi_hari') THEN ALTER TABLE bookings ADD COLUMN durasi_hari INT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='total_harga') THEN ALTER TABLE bookings ADD COLUMN total_harga NUMERIC(14,2); END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='nama_pemesan') THEN ALTER TABLE bookings ADD COLUMN nama_pemesan TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='no_hp') THEN ALTER TABLE bookings ADD COLUMN no_hp TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='no_ktp') THEN ALTER TABLE bookings ADD COLUMN no_ktp TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='alamat') THEN ALTER TABLE bookings ADD COLUMN alamat TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='catatan') THEN ALTER TABLE bookings ADD COLUMN catatan TEXT; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='kode_booking') THEN ALTER TABLE bookings ADD COLUMN kode_booking TEXT; END IF;
END $$;

-- ── KOLOM BARU v5 ──
DO $$ BEGIN
  -- Data pemesan (step 3)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='email_pemesan') THEN
    ALTER TABLE bookings ADD COLUMN email_pemesan TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='tujuan_sewa') THEN
    ALTER TABLE bookings ADD COLUMN tujuan_sewa TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='punya_sosmed') THEN
    ALTER TABLE bookings ADD COLUMN punya_sosmed BOOLEAN DEFAULT TRUE;
  END IF;

  -- Jaminan (step 5)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='jenis_jaminan') THEN
    ALTER TABLE bookings ADD COLUMN jenis_jaminan TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='jaminan_kendaraan_jenis') THEN
    ALTER TABLE bookings ADD COLUMN jaminan_kendaraan_jenis TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='jaminan_kendaraan_merek') THEN
    ALTER TABLE bookings ADD COLUMN jaminan_kendaraan_merek TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='jaminan_kendaraan_tahun') THEN
    ALTER TABLE bookings ADD COLUMN jaminan_kendaraan_tahun INT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='jaminan_kendaraan_plat') THEN
    ALTER TABLE bookings ADD COLUMN jaminan_kendaraan_plat TEXT;
  END IF;

  -- Keuangan DP
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='dp_amount') THEN
    ALTER TABLE bookings ADD COLUMN dp_amount NUMERIC(14,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='deposit_amount') THEN
    ALTER TABLE bookings ADD COLUMN deposit_amount NUMERIC(14,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='sudah_dibayar') THEN
    ALTER TABLE bookings ADD COLUMN sudah_dibayar NUMERIC(14,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='sisa_pelunasan') THEN
    ALTER TABLE bookings ADD COLUMN sisa_pelunasan NUMERIC(14,2);
  END IF;

  -- Pembayaran
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='bukti_bayar_url') THEN
    ALTER TABLE bookings ADD COLUMN bukti_bayar_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='status_pembayaran') THEN
    ALTER TABLE bookings ADD COLUMN status_pembayaran TEXT DEFAULT 'Belum Bayar';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='alasan_penolakan') THEN
    ALTER TABLE bookings ADD COLUMN alasan_penolakan TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='confirmed_at') THEN
    ALTER TABLE bookings ADD COLUMN confirmed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='confirmed_by') THEN
    ALTER TABLE bookings ADD COLUMN confirmed_by UUID REFERENCES profiles(id);
  END IF;
END $$;

-- Update status check constraint (hapus lama, buat baru dengan nilai lengkap)
DO $$ BEGIN
  -- Drop constraint lama jika ada
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='bookings_status_check' AND table_name='bookings') THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
  END IF;
  -- Tambah constraint baru
  ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('Menunggu','Menunggu Konfirmasi','Dikonfirmasi','Aktif','Selesai','Dibatalkan','Pembayaran Ditolak'));
END $$;

-- Unique constraint pada kode_booking
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='bookings' AND constraint_name='bookings_kode_booking_key') THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_kode_booking_key UNIQUE (kode_booking);
  END IF;
END $$;


-- ─────────────────────────────────────────────────────
-- 4. BOOKING_DOCUMENTS (tabel baru)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID REFERENCES bookings(id) ON DELETE CASCADE,
  tipe_doc    TEXT NOT NULL,
    -- 'KTP','SIM','KK','Selfie','NPWP','BPJS','Akta','IDCard','Paspor','Ijazah'
  file_url    TEXT NOT NULL,
  file_name   TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE booking_documents ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "docs_admin"
  ON booking_documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );


-- ─────────────────────────────────────────────────────
-- 5. PROMOS
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
-- 6. FUNGSI CEK KETERSEDIAAN
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_car_availability(
  p_car_id  UUID,
  p_start   DATE,
  p_end     DATE,
  p_exclude UUID DEFAULT NULL
)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE
  conflict_count INT;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM bookings
  WHERE car_id = p_car_id
    AND status IN ('Menunggu', 'Menunggu Konfirmasi', 'Dikonfirmasi', 'Aktif')
    AND (p_exclude IS NULL OR id <> p_exclude)
    AND tanggal_mulai  <= p_end
    AND tanggal_selesai >= p_start;
  RETURN conflict_count = 0;
END;
$$;


-- ─────────────────────────────────────────────────────
-- 7. RLS
-- ─────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars     ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE promos   ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "profiles_self"   ON profiles FOR SELECT  USING (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE  USING (auth.uid() = id);
CREATE POLICY "profiles_admin"  ON profiles FOR ALL     USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "cars_read_all"   ON cars FOR SELECT  USING (true);
CREATE POLICY "cars_admin"      ON cars FOR ALL     USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "bookings_user_read"   ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookings_user_insert" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_user_cancel" ON bookings FOR UPDATE USING (auth.uid() = user_id AND status IN ('Menunggu', 'Menunggu Konfirmasi'));
CREATE POLICY "bookings_admin"       ON bookings FOR ALL   USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "promos_read"  ON promos FOR SELECT USING (status = 'aktif');
CREATE POLICY "promos_admin" ON promos FOR ALL   USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));


-- ─────────────────────────────────────────────────────
-- 8. INDEXES
-- ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_car_dates  ON bookings (car_id, tanggal_mulai, tanggal_selesai, status);
CREATE INDEX IF NOT EXISTS idx_bookings_user       ON bookings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status_pay ON bookings (status_pembayaran);
CREATE INDEX IF NOT EXISTS idx_cars_status         ON cars (status);
CREATE INDEX IF NOT EXISTS idx_profiles_role       ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_booking_docs        ON booking_documents (booking_id);


-- ─────────────────────────────────────────────────────
-- 9. STORAGE BUCKETS
--    Jalankan via Supabase Dashboard > Storage > New Bucket
-- ─────────────────────────────────────────────────────
-- Buat 2 bucket berikut (Private):
--
--  1. Nama: "booking-documents"
--     → Untuk KTP, SIM, KK, Selfie, dll
--     → Private (centang "Private bucket")
--     Storage Policy:
--       INSERT: (auth.uid() IS NOT NULL)
--       SELECT: (auth.uid() IS NOT NULL)
--
--  2. Nama: "payment-proofs"
--     → Untuk bukti pembayaran
--     → Private
--     Storage Policy:
--       INSERT: (auth.uid() IS NOT NULL)
--       SELECT: (auth.uid() IS NOT NULL)
--
-- Atau jalankan SQL ini (jika versi Supabase mendukung):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('booking-documents', 'booking-documents', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false) ON CONFLICT DO NOTHING;
-- ─────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────
-- SELESAI — EasyCar v5 Schema
-- Verifikasi: SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
-- ─────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────
-- 10. ATOMIC BOOKING INSERT (Anti Double Booking)
-- Fungsi ini menggabungkan cek ketersediaan + insert dalam
-- 1 transaksi database, sehingga race condition tidak bisa terjadi.
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION insert_booking_if_available(
  p_user_id               UUID,
  p_car_id                UUID,
  p_kode_booking          TEXT,
  p_tanggal_mulai         DATE,
  p_tanggal_selesai       DATE,
  p_durasi_hari           INT,
  p_total_harga           NUMERIC,
  p_nama_pemesan          TEXT,
  p_no_hp                 TEXT,
  p_no_ktp                TEXT,
  p_email_pemesan         TEXT,
  p_alamat                TEXT,
  p_tujuan_sewa           TEXT,
  p_punya_sosmed          BOOLEAN,
  p_jenis_jaminan         TEXT,
  p_jaminan_kendaraan_jenis  TEXT,
  p_jaminan_kendaraan_merek  TEXT,
  p_jaminan_kendaraan_tahun  INT,
  p_jaminan_kendaraan_plat   TEXT,
  p_dp_amount             NUMERIC,
  p_deposit_amount        NUMERIC,
  p_sudah_dibayar         NUMERIC,
  p_sisa_pelunasan        NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conflict INT;
  v_booking_id UUID;
  v_result JSON;
BEGIN
  -- Kunci baris car agar tidak ada concurrent insert untuk mobil yg sama
  PERFORM pg_advisory_xact_lock(hashtext(p_car_id::TEXT));

  -- Cek bentrok tanggal
  SELECT COUNT(*) INTO v_conflict
  FROM bookings
  WHERE car_id = p_car_id
    AND status IN ('Menunggu', 'Menunggu Konfirmasi', 'Dikonfirmasi', 'Aktif')
    AND tanggal_mulai  <= p_tanggal_selesai
    AND tanggal_selesai >= p_tanggal_mulai;

  IF v_conflict > 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'TANGGAL_BENTROK',
      'message', 'Kendaraan sudah dipesan pada tanggal tersebut.'
    );
  END IF;

  -- Insert booking (dalam transaksi yang sama, terkunci)
  INSERT INTO bookings (
    user_id, car_id, kode_booking,
    tanggal_mulai, tanggal_selesai, durasi_hari, total_harga,
    nama_pemesan, no_hp, no_ktp, email_pemesan, alamat,
    tujuan_sewa, punya_sosmed,
    jenis_jaminan,
    jaminan_kendaraan_jenis, jaminan_kendaraan_merek,
    jaminan_kendaraan_tahun, jaminan_kendaraan_plat,
    dp_amount, deposit_amount, sudah_dibayar, sisa_pelunasan,
    status, status_pembayaran
  ) VALUES (
    p_user_id, p_car_id, p_kode_booking,
    p_tanggal_mulai, p_tanggal_selesai, p_durasi_hari, p_total_harga,
    p_nama_pemesan, p_no_hp, p_no_ktp, p_email_pemesan, p_alamat,
    p_tujuan_sewa, p_punya_sosmed,
    p_jenis_jaminan,
    p_jaminan_kendaraan_jenis, p_jaminan_kendaraan_merek,
    p_jaminan_kendaraan_tahun, p_jaminan_kendaraan_plat,
    p_dp_amount, p_deposit_amount, p_sudah_dibayar, p_sisa_pelunasan,
    'Menunggu Konfirmasi', 'Menunggu Konfirmasi'
  )
  RETURNING id INTO v_booking_id;

  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'kode_booking', p_kode_booking
  );
END;
$$;

-- Grant execute ke authenticated users
GRANT EXECUTE ON FUNCTION insert_booking_if_available TO authenticated;
