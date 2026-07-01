-- =====================================================
-- FIX: Kolom bukti_pelunasan_url + RLS untuk alur pelunasan
-- Jalankan di Supabase SQL Editor
-- =====================================================

-- 1. Tambah kolom bukti_pelunasan_url (terpisah dari bukti_bayar_url / DP)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS bukti_pelunasan_url TEXT;

-- 2. Ganti RLS policy UPDATE untuk user agar mencakup status 'Dikonfirmasi'
--    (diperlukan saat customer upload bukti pelunasan di halaman Pesanan Saya)
DROP POLICY IF EXISTS "bookings_user_update"      ON bookings;
DROP POLICY IF EXISTS "bookings_user_cancel"       ON bookings;
DROP POLICY IF EXISTS "bookings_user_bukti_bayar"  ON bookings;

-- User boleh UPDATE booking miliknya selama statusnya belum final
-- (Menunggu → DP awal, Menunggu Konfirmasi → DP menunggu konfirmasi,
--  Dikonfirmasi → pelunasan sisa pembayaran)
CREATE POLICY "bookings_user_update"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status IN ('Menunggu', 'Menunggu Konfirmasi', 'Dikonfirmasi')
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- 3. Pastikan storage bucket booking-documents boleh dibaca admin juga
--    (seharusnya sudah dari fix_bukti_bayar.sql — ini hanya safeguard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'booking-documents',
  'booking-documents',
  true,
  10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public          = true,
  file_size_limit = 10485760;

DROP POLICY IF EXISTS "allow_upload_booking_docs" ON storage.objects;
DROP POLICY IF EXISTS "allow_read_booking_docs"   ON storage.objects;
DROP POLICY IF EXISTS "allow_update_booking_docs" ON storage.objects;

CREATE POLICY "allow_upload_booking_docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'booking-documents');

CREATE POLICY "allow_read_booking_docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'booking-documents');

CREATE POLICY "allow_update_booking_docs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'booking-documents');

-- 4. Verifikasi kolom bookings
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name IN ('bukti_bayar_url', 'bukti_pelunasan_url', 'status_pembayaran', 'status')
ORDER BY column_name;

-- 5. Verifikasi policy
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY policyname;
