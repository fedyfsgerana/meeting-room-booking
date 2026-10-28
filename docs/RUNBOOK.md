# Runbook

Panduan menangani masalah yang umum terjadi.

## Pemeriksaan cepat

| Periksa | Cara |
| --- | --- |
| Aplikasi dan database | Buka `/api/health`. Hasil `503` berarti database tidak bisa dihubungi |
| Penjadwal | Cari `[jobs] Penjadwal aktif` di log saat aplikasi menyala |
| Log layanan | `journalctl -u meeting-room-booking -f` (Linux) |
| Aktivitas pengguna | **Pengaturan → Riwayat aktivitas** |

## Lupa password admin

Kalau masih ada pengguna lain dengan hak **Pengguna: Atur ulang password**, atur ulang lewat **Master → Pengguna → ikon kunci**.

Kalau tidak ada yang bisa login sama sekali, jalankan dari folder aplikasi:

```bash
RESET_EMAIL=administrator@example.com RESET_PASSWORD='password-baru-123' pnpm db:reset-password
```

Di Windows PowerShell:

```powershell
$env:RESET_EMAIL = "administrator@example.com"
$env:RESET_PASSWORD = "password-baru-123"
pnpm db:reset-password
Remove-Item Env:RESET_EMAIL, Env:RESET_PASSWORD
```

Perintah ini juga mengaktifkan kembali akun yang dinonaktifkan dan mengeluarkannya dari semua sesi.

## Selalu kembali ke halaman login di produksi

Cookie sesi hanya disimpan lewat HTTPS saat `NODE_ENV=production`. Pastikan aplikasi dibuka lewat `https://` dan reverse proxy meneruskan header `X-Forwarded-Proto`.

## Draft tidak batal otomatis

1. Pastikan `JOBS_ENABLED=true` di `.env`, lalu restart aplikasi.
2. Cari `[jobs] Penjadwal gagal dijalankan` di log. Penyebab umumnya: user database tidak punya izin membuat skema `pgboss`. Jalankan `GRANT CREATE ON DATABASE meeting_room_booking TO meeting_room_booking;` sebagai `postgres`.
3. Draft yang lewat batas tetap dianggap batal oleh aplikasi dan tidak menahan ruang walau penjadwal mati. Statusnya di database diperbarui begitu penjadwal menyala lagi.

## Pengguna tidak bisa mengajukan booking

| Pesan | Penanganan |
| --- | --- |
| Departemen ini belum punya penyetuju | Tetapkan di **Master → Penyetuju**. Penyetuju harus aktif dan hak aksesnya mencakup **Persetujuan penyetuju: Setujui** |
| Pilih penyetuju aktif dari departemen ini | Penyetuju yang dipilih sudah nonaktif atau dilepas dari departemen |
| Anda tidak bisa memesan atas nama departemen ini | Tambahkan departemen itu ke hak akses pengguna di **Master → Hak akses** |
| Bukan hari operasional atau nama hari libur | Periksa **Pengaturan → Aturan booking** |
| Di luar jam operasional | Periksa jam buka dan tutup di **Pengaturan → Aturan booking** |
| Ruang sudah dipakai pukul … | Pilih jam atau ruang lain |
| Ruang sedang tidak bisa dipesan | Status ruang Perbaikan atau Nonaktif di **Master → Ruangan** |
| Menu Booking ruang tidak muncul | Hak akses pengguna belum mencakup **Booking ruang: Lihat** |

## Persetujuan tidak muncul di antrean

- **Penyetuju** melihat Draft dari semua departemen yang ia setujui dan yang belum lewat batas waktu.
- Booking yang dipesan oleh **Penanggung Jawab Ruang** untuk ruangnya sendiri langsung disetujui dan tidak masuk antrean.
- **Penanggung Jawab Ruang** hanya melihat booking untuk ruang yang ditetapkan kepadanya.

## "Status booking sudah berubah. Muat ulang halaman"

Booking sudah ditindaklanjuti orang lain sejak halaman dibuka. Muat ulang halaman, lalu periksa riwayat di detail booking.

## Login diblokir sementara

Setelah **5 kali login gagal dari satu alamat IP** atau **20 kali gagal untuk satu akun** dalam 15 menit, login ditolak sementara. Blokir terbuka sendiri setelah waktunya habis, dan hitungan akun mulai dari nol setelah login berhasil. Semua percobaan gagal terlihat di **Riwayat aktivitas** dengan filter **Login gagal**.

Pastikan reverse proxy meneruskan IP asli pengguna lewat `X-Real-IP` atau `X-Forwarded-For`, supaya pengguna di satu jaringan kantor tidak ikut terblokir.

## Pembatasan laju permintaan

| Aksi | Batas |
| --- | --- |
| Kirim form login (per IP) | 20 per menit |
| Cek ketersediaan ruang (per pengguna) | 60 per menit |
| Notifikasi lonceng (per pengguna) | 30 per menit |
| Kembalikan data (per pengguna) | 20 per menit |

Hitungannya disimpan di memori server dan kembali nol setiap aplikasi dijalankan ulang. Kalau aplikasi dijalankan di lebih dari satu server, pindahkan hitungannya ke penyimpanan bersama seperti PostgreSQL atau Redis.

## Migrasi gagal

1. Pulihkan dari backup terakhir (lihat [DEPLOYMENT](DEPLOYMENT.md#6-backup-database)).
2. Periksa pesan error. Kalau ada data yang melanggar aturan baru, perbaiki datanya, lalu jalankan ulang `pnpm db:migrate`.
3. Jangan mengubah file migrasi di folder `drizzle/` yang sudah pernah dijalankan di produksi.
