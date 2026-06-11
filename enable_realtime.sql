-- =====================================================
-- EASYCAR — AKTIFKAN REALTIME + FIX RLS UNTUK NOTIFIKASI
-- Jalankan ini di Supabase SQL Editor
-- =====================================================

-- 1. Aktifkan Realtime pada tabel bookings
-- (Tanpa ini, postgres_changes subscription tidak akan menerima event apapun)
ALTER TABLE bookings REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bookings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
  END IF;
END $$;

-- 2. RLS policy: user boleh SELECT booking milik sendiri
-- (Wajib ada agar filter user_id=eq.{id} pada channel bisa berjalan)
DROP POLICY IF EXISTS "user_select_own_bookings" ON bookings;
CREATE POLICY "user_select_own_bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

-- 3. RLS policy: admin boleh SELECT semua booking
DROP POLICY IF EXISTS "admin_select_all_bookings" ON bookings;
CREATE POLICY "admin_select_all_bookings"
  ON bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. RLS policy: user boleh UPDATE booking milik sendiri
--    (untuk update bukti_bayar_url dll dari client)
DROP POLICY IF EXISTS "user_update_own_bookings" ON bookings;
CREATE POLICY "user_update_own_bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Pastikan RLS aktif
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Verifikasi: cek tabel sudah masuk publikasi realtime
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
