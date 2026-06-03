-- ================================================================
-- FIX: RLS Policy untuk booking_documents + Storage Buckets
-- Jalankan di Supabase SQL Editor
-- ================================================================

-- 1. Pastikan tabel booking_documents ada dengan kolom yang benar
CREATE TABLE IF NOT EXISTS booking_documents (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id   uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  tipe_doc     text NOT NULL,
  file_url     text,
  file_name    text,
  uploaded_at  timestamptz DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE booking_documents ENABLE ROW LEVEL SECURITY;

-- 3. Drop old policies kalau ada
DROP POLICY IF EXISTS "Users can insert their own booking docs"    ON booking_documents;
DROP POLICY IF EXISTS "Users can view their own booking docs"      ON booking_documents;
DROP POLICY IF EXISTS "Admin can view all booking docs"            ON booking_documents;
DROP POLICY IF EXISTS "Admin can manage all booking docs"          ON booking_documents;

-- 4. User bisa insert dokumen untuk booking milik mereka sendiri
CREATE POLICY "Users can insert their own booking docs"
  ON booking_documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
        AND bookings.user_id = auth.uid()
    )
  );

-- 5. User bisa lihat dokumen booking mereka sendiri
CREATE POLICY "Users can view their own booking docs"
  ON booking_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = booking_id
        AND bookings.user_id = auth.uid()
    )
  );

-- 6. Admin bisa lihat semua dokumen
CREATE POLICY "Admin can view all booking docs"
  ON booking_documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 7. Admin bisa hapus dokumen
CREATE POLICY "Admin can delete booking docs"
  ON booking_documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ================================================================
-- STORAGE BUCKETS (jalankan terpisah jika perlu)
-- ================================================================

-- Buat bucket booking-documents jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-documents', 'booking-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Buat bucket payment-proofs jika belum ada
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS: user bisa upload ke folder booking mereka
DROP POLICY IF EXISTS "Users can upload booking docs" ON storage.objects;
CREATE POLICY "Users can upload booking docs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'booking-documents'
    AND auth.uid() IS NOT NULL
  );

-- Storage RLS: semua bisa baca (public bucket)
DROP POLICY IF EXISTS "Public read booking docs" ON storage.objects;
CREATE POLICY "Public read booking docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'booking-documents');

-- Payment proofs: user bisa upload
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
CREATE POLICY "Users can upload payment proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND auth.uid() IS NOT NULL
  );

-- Payment proofs: semua bisa baca
DROP POLICY IF EXISTS "Public read payment proofs" ON storage.objects;
CREATE POLICY "Public read payment proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs');

-- ================================================================
-- ADMIN: bisa hapus booking (RLS policy)
-- ================================================================
DROP POLICY IF EXISTS "Admin can delete bookings" ON bookings;
CREATE POLICY "Admin can delete bookings"
  ON bookings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

