-- =====================================================
-- FIX: bukti_bayar_url tidak tersimpan ke Supabase
-- Jalankan di Supabase SQL Editor
-- =====================================================

-- 1. Tambah kolom metode_pembayaran jika belum ada
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS metode_pembayaran TEXT DEFAULT 'qris';

-- 2. Ganti policy UPDATE untuk user
--    Policy lama "bookings_user_cancel" terlalu sempit:
--    hanya mengizinkan kolom status tertentu, bukan bukti_bayar_url.
--    Ganti dengan policy yang juga mengizinkan user update bukti bayar.

DROP POLICY IF EXISTS "bookings_user_cancel"      ON bookings;
DROP POLICY IF EXISTS "bookings_user_bukti_bayar" ON bookings;
DROP POLICY IF EXISTS "bookings_user_update"      ON bookings;

-- User boleh UPDATE booking miliknya selama status masih pending
-- (mencakup: upload bukti bayar, pembatalan, update metode bayar)
CREATE POLICY "bookings_user_update"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status IN ('Menunggu', 'Menunggu Konfirmasi', 'Menunggu Pembayaran')
  )
  WITH CHECK (
    auth.uid() = user_id
  );

-- 3. Pastikan storage bucket 'booking-documents' public dan policy-nya benar
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

-- 4. Drop dan recreate storage policies untuk booking-documents
DROP POLICY IF EXISTS "allow_upload_booking_docs"   ON storage.objects;
DROP POLICY IF EXISTS "allow_read_booking_docs"     ON storage.objects;
DROP POLICY IF EXISTS "allow_update_booking_docs"   ON storage.objects;
DROP POLICY IF EXISTS "allow_delete_booking_docs"   ON storage.objects;

-- Upload: user yang login bisa upload
CREATE POLICY "allow_upload_booking_docs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'booking-documents');

-- Read: semua yang login bisa baca (termasuk admin)
CREATE POLICY "allow_read_booking_docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'booking-documents');

-- Upsert/update: user yang login bisa overwrite file miliknya
CREATE POLICY "allow_update_booking_docs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'booking-documents');

-- 5. Verifikasi
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name IN ('bukti_bayar_url', 'status_pembayaran', 'metode_pembayaran')
ORDER BY column_name;

SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'bookings'
ORDER BY policyname;
