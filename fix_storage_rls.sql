-- ============================================================
-- FIX: Storage RLS untuk booking-documents dan payment-proofs
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Buat bucket jika belum ada
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('booking-documents', 'booking-documents', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf']),
  ('payment-proofs',    'payment-proofs',    true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- 2. Hapus policy lama jika ada
DROP POLICY IF EXISTS "booking_docs_insert" ON storage.objects;
DROP POLICY IF EXISTS "booking_docs_select" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_insert" ON storage.objects;
DROP POLICY IF EXISTS "payment_proofs_select" ON storage.objects;
DROP POLICY IF EXISTS "allow_upload_booking_docs" ON storage.objects;
DROP POLICY IF EXISTS "allow_read_booking_docs"   ON storage.objects;
DROP POLICY IF EXISTS "allow_upload_payment"       ON storage.objects;
DROP POLICY IF EXISTS "allow_read_payment"         ON storage.objects;

-- 3. Policy: user yang sudah login bisa upload ke booking-documents
CREATE POLICY "allow_upload_booking_docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'booking-documents');

-- 4. Policy: semua user (termasuk admin) bisa baca booking-documents
CREATE POLICY "allow_read_booking_docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'booking-documents');

-- 5. Policy: user yang sudah login bisa upload bukti bayar
CREATE POLICY "allow_upload_payment"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

-- 6. Policy: admin dan user sendiri bisa baca payment-proofs
CREATE POLICY "allow_read_payment"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-proofs');

-- 7. Tabel booking_documents harus bisa di-insert oleh authenticated users
-- Pastikan RLS-nya benar
ALTER TABLE IF EXISTS booking_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_insert_own_docs"  ON booking_documents;
DROP POLICY IF EXISTS "admin_read_all_docs"   ON booking_documents;
DROP POLICY IF EXISTS "user_read_own_docs"    ON booking_documents;

-- User bisa insert dokumen untuk booking miliknya
CREATE POLICY "user_insert_own_docs" ON booking_documents
FOR INSERT TO authenticated
WITH CHECK (
  booking_id IN (
    SELECT id FROM bookings WHERE user_id = auth.uid()
  )
);

-- User bisa baca dokumen booking miliknya
CREATE POLICY "user_read_own_docs" ON booking_documents
FOR SELECT TO authenticated
USING (
  booking_id IN (
    SELECT id FROM bookings WHERE user_id = auth.uid()
  )
);

-- Admin bisa baca semua dokumen
CREATE POLICY "admin_read_all_docs" ON booking_documents
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin bisa insert dokumen untuk booking manapun
CREATE POLICY "admin_insert_docs" ON booking_documents
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

SELECT 'Storage RLS fix berhasil dijalankan!' as status;
