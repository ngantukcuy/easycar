-- =====================================================
-- FIX: Alur Pelunasan Pembayaran sebelum status "Aktif"
-- =====================================================
-- Konteks: Sekarang ketika admin mengubah status booking menjadi "Aktif",
-- sistem akan mengecek apakah masih ada sisa pembayaran (sisa_pelunasan).
-- Jika masih ada, status TIDAK langsung berubah ke "Aktif" — sebaliknya
-- status_pembayaran diset ke 'Menunggu Pelunasan' agar customer diminta
-- melunasi sisa pembayaran via QRIS dari halaman "Pesanan Saya".
--
-- Setelah customer upload bukti pelunasan, baris booking miliknya perlu
-- di-UPDATE (status_pembayaran -> 'Menunggu Konfirmasi', bukti_bayar_url).
-- RLS policy "bookings_user_cancel" sebelumnya HANYA mengizinkan user
-- mengupdate booking miliknya saat status = 'Menunggu' atau
-- 'Menunggu Konfirmasi'. Setelah DP dikonfirmasi admin (status =
-- 'Dikonfirmasi'), user tidak bisa update apapun di baris itu — termasuk
-- saat ingin mengirim bukti pelunasan. Fix ini menambahkan 'Dikonfirmasi'
-- ke daftar status yang boleh diupdate sendiri oleh user.
--
-- CATATAN KEAMANAN: policy ini hanya memeriksa kolom `status`, bukan kolom
-- lain. Karena tidak ada WITH CHECK terpisah, Postgres otomatis memakai
-- USING juga sebagai WITH CHECK — artinya user tetap TIDAK BISA mengubah
-- `status` menjadi 'Aktif'/'Selesai' sendiri lewat update ini (nilai baru
-- status wajib tetap salah satu dari 3 nilai di bawah). Perubahan status
-- ke 'Aktif'/'Selesai' tetap hanya bisa dilakukan admin.
--
-- Jalankan file ini sekali di Supabase SQL Editor.
-- =====================================================

DROP POLICY IF EXISTS "bookings_user_cancel" ON bookings;

CREATE POLICY "bookings_user_cancel"
  ON bookings FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status IN ('Menunggu', 'Menunggu Konfirmasi', 'Dikonfirmasi')
  );
