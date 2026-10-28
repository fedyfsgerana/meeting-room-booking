# Panduan Kontribusi

Terima kasih sudah tertarik berkontribusi pada Meeting Room Booking.

## Melaporkan masalah

Buka [Issue](https://github.com/fedyfsgerana/meeting-room-booking/issues) dan sertakan:

- langkah untuk mengulang masalah,
- hasil yang diharapkan dan hasil yang terjadi,
- versi Node.js, PostgreSQL, dan browser yang dipakai.

Celah keamanan jangan dilaporkan lewat Issue publik. Hubungi pembuat langsung lewat GitHub.

## Alur kerja

1. Fork repository, lalu buat branch dari `main`.

   ```bash
   git checkout -b fitur/nama-singkat
   ```

2. Ikuti panduan instalasi di [SETUP](docs/SETUP.md).
3. Pastikan semua pemeriksaan lolos sebelum commit.

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```

4. Tulis pesan commit mengikuti [Conventional Commits](https://www.conventionalcommits.org/), misalnya `feat: tambah filter ruangan` atau `fix: perbaiki validasi jam`.
5. Ajukan Pull Request ke `main` dengan penjelasan singkat apa yang berubah dan kenapa.

## Aturan kode

- Setiap Server Action wajib memeriksa sesi dan hak `menu.aksi` di awal fungsi. Lihat [SECURITY](docs/SECURITY.md).
- Ikon dan warna aksi memakai `ACTION_STYLE`. Lihat [ACTION-STANDARDS](docs/ACTION-STANDARDS.md).
- Perubahan skema database disertai migrasi baru dari `pnpm db:generate`. Jangan mengubah migrasi yang sudah dirilis.
- Teks antarmuka memakai Bahasa Indonesia.
