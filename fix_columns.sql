-- =====================================================
-- EASYCAR — QUICK FIX: Rename Kolom Inggris → Indonesia
-- Jalankan ini jika diagnostic.sql menunjukkan
-- kolom masih bernama start_date / end_date / dll
-- =====================================================

-- ── Rename start_date → tanggal_mulai ──
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='bookings' AND column_name='start_date'
  ) THEN
    ALTER TABLE bookings RENAME COLUMN start_date TO tanggal_mulai;
    RAISE NOTICE 'Renamed: start_date → tanggal_mulai';
  ELSE
    RAISE NOTICE 'Skipped: start_date tidak ditemukan';
  END IF;
END $$;

-- ── Rename end_date → tanggal_selesai ──
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='bookings' AND column_name='end_date'
  ) THEN
    ALTER TABLE bookings RENAME COLUMN end_date TO tanggal_selesai;
    RAISE NOTICE 'Renamed: end_date → tanggal_selesai';
  ELSE
    RAISE NOTICE 'Skipped: end_date tidak ditemukan';
  END IF;
END $$;

-- ── Rename return_date → tanggal_selesai (nama alternatif) ──
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='bookings' AND column_name='return_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='bookings' AND column_name='tanggal_selesai'
  ) THEN
    ALTER TABLE bookings RENAME COLUMN return_date TO tanggal_selesai;
    RAISE NOTICE 'Renamed: return_date → tanggal_selesai';
  END IF;
END $$;

-- ── Rename total_price → total_harga ──
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='bookings' AND column_name='total_price'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='bookings' AND column_name='total_harga'
  ) THEN
    ALTER TABLE bookings RENAME COLUMN total_price TO total_harga;
    RAISE NOTICE 'Renamed: total_price → total_harga';
  END IF;
END $$;

-- ── Rename duration → durasi_hari ──
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='bookings' AND column_name='duration'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='bookings' AND column_name='durasi_hari'
  ) THEN
    ALTER TABLE bookings RENAME COLUMN duration TO durasi_hari;
    RAISE NOTICE 'Renamed: duration → durasi_hari';
  END IF;
END $$;

-- ── Rename price_per_day → harga_per_hari di tabel cars ──
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cars' AND column_name='price_per_day'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cars' AND column_name='harga_per_hari'
  ) THEN
    ALTER TABLE cars RENAME COLUMN price_per_day TO harga_per_hari;
    RAISE NOTICE 'Renamed: price_per_day → harga_per_hari';
  END IF;
END $$;

-- ── Rename image_url → foto_url di tabel cars ──
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cars' AND column_name='image_url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='cars' AND column_name='foto_url'
  ) THEN
    ALTER TABLE cars RENAME COLUMN image_url TO foto_url;
    RAISE NOTICE 'Renamed: image_url → foto_url';
  END IF;
END $$;

-- ── Pastikan kolom kendaraan penting ada di tabel cars ──
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='cars') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='nomor_plat') THEN
      ALTER TABLE cars ADD COLUMN nomor_plat TEXT;
      RAISE NOTICE 'Added: cars.nomor_plat';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cars' AND column_name='deskripsi') THEN
      ALTER TABLE cars ADD COLUMN deskripsi TEXT;
      RAISE NOTICE 'Added: cars.deskripsi';
    END IF;
  END IF;
END $$;

-- ── Verifikasi hasil ──
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'bookings'
ORDER BY ordinal_position;
