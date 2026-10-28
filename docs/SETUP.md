# Setup Pengembangan

Panduan memasang Meeting Room Booking di komputer pengembang.

## Prasyarat

| Perangkat | Versi | Catatan |
| --- | --- | --- |
| Node.js | 24 | Cek dengan `node -v` |
| pnpm | 10 | `npm install -g pnpm` atau `corepack enable` |
| PostgreSQL | 18 | Pastikan `psql` bisa dipanggil dari terminal |
| Git | Terbaru | Isi `user.name` dan `user.email` |

## 1. Ambil kode

```bash
git clone https://github.com/fedyfsgerana/meeting-room-booking.git
cd meeting-room-booking
pnpm install
```

## 2. Buat database

```bash
psql -U postgres
```

```sql
CREATE ROLE meeting_room_booking LOGIN PASSWORD 'ganti-password';
CREATE DATABASE meeting_room_booking OWNER meeting_room_booking;
\q
```

## 3. Isi `.env`

Salin `.env.example` menjadi `.env`.

```bash
cp .env.example .env
```

Di Windows PowerShell: `Copy-Item .env.example .env`.

| Variabel | Isi |
| --- | --- |
| `DATABASE_URL` | `postgres://meeting_room_booking:PASSWORD@localhost:5432/meeting_room_booking` |
| `SEED_ADMIN_PASSWORD` | Password awal akun administrator, minimal 8 karakter, berisi huruf dan angka |
| `JOBS_ENABLED` | `true` untuk menyalakan penjadwal |

`APP_ORIGIN` dan `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` boleh dikosongkan selama pengembangan.

## 4. Migrasi dan data awal

```bash
pnpm db:generate --name init
pnpm db:migrate
pnpm db:seed
```

Langkah `db:generate` hanya perlu sekali, saat folder `drizzle/` belum ada.

Data awal berisi enam departemen contoh (IT, HR, Finance, General Affairs, Operations, Marketing), hak akses **Administrator**, akun `administrator@example.com`, dan pengaturan bawaan.

## 5. Jalankan

```bash
pnpm dev
```

Buka `http://localhost:3000`, lalu masuk dengan `administrator@example.com` dan password dari `SEED_ADMIN_PASSWORD`. Terminal menampilkan `[jobs] Penjadwal aktif` kalau penjadwal berjalan.

## 6. Pengaturan awal aplikasi

Lakukan berurutan setelah login pertama:

1. **Pengaturan → Aturan booking**: batas waktu Draft, jam dan hari operasional, serta hari libur.
2. **Master → Departemen**: sesuaikan daftar departemen.
3. **Master → Hak akses**: buat hak akses, misalnya Pemesan, Penyetuju, dan Penanggung Jawab Ruang, beserta departemen yang bisa dipesankan.
4. **Master → Pengguna**: tambahkan pengguna dengan hak akses yang sesuai.
5. **Master → Ruangan**: tambahkan ruang meeting beserta kapasitas dan fasilitasnya.
6. **Master → Penyetuju**: tetapkan penyetuju untuk setiap departemen. Departemen tanpa penyetuju tidak bisa mengajukan booking.
7. **Master → Penanggung Jawab Ruang**: tetapkan penanggung jawab setiap ruang.

## 7. Mengosongkan data

Mengosongkan seluruh database lalu mengisi ulang:

```bash
RESET_CONFIRM=ya pnpm db:reset
pnpm db:seed
```

Mengosongkan semua data kecuali akun administrator, hak akses Administrator, dan departemen:

```bash
RESET_CONFIRM=ya pnpm db:clean
```

Di Windows PowerShell, isi variabelnya dulu dengan `$env:RESET_CONFIRM = "ya"`, jalankan perintahnya, lalu hapus dengan `Remove-Item Env:RESET_CONFIRM`.

## 8. Pemeriksaan sebelum commit

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
