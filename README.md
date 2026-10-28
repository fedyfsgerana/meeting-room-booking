# Meeting Room Booking

Aplikasi web untuk memesan ruang meeting dengan persetujuan bertingkat, pengecekan kesiapan ruang, monitoring pemakaian, dan riwayat aktivitas lengkap.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

**[Coba demo interaktif](https://fedyfsgerana.github.io/meeting-room-booking/demo/)** — login, booking, dan persetujuan dengan data contoh, tanpa instalasi. Data demo tersimpan di browser.

## Daftar Isi

- [Demo](#demo)
- [Fitur](#fitur)
- [Alur Booking](#alur-booking)
- [Tech Stack](#tech-stack)
- [Memulai](#memulai)
- [Variabel Lingkungan](#variabel-lingkungan)
- [Perintah](#perintah)
- [Struktur Proyek](#struktur-proyek)
- [Dokumentasi](#dokumentasi)
- [Kontribusi](#kontribusi)
- [Lisensi](#lisensi)
- [Pembuat](#pembuat)

## Demo

Versi demo ada di [`demo/index.html`](demo/index.html): satu file HTML tanpa server dan tanpa database, yang meniru alur utama aplikasi dengan data contoh.

| Akun | Email | Password |
| --- | --- | --- |
| Administrator | `admin@demo.test` | `demo1234` |
| Pemesan | `pemesan@demo.test` | `demo1234` |
| Penyetuju | `penyetuju@demo.test` | `demo1234` |
| Penanggung Jawab Ruang | `pj@demo.test` | `demo1234` |

Alur yang bisa dicoba: ajukan booking sebagai Pemesan, setujui sebagai Penyetuju, lalu tandai ruang siap sebagai Penanggung Jawab Ruang. Semua aktivitas, termasuk login gagal, terlihat di Riwayat aktivitas akun Administrator.

## Fitur

| Fitur | Deskripsi |
| --- | --- |
| Beranda | Status setiap ruang saat ini dan timeline pemakaian harian. Klik jam kosong untuk langsung booking. |
| Booking ruang | Cek ketersediaan langsung, teleconference (aplikasi, host, lawan bicara), jadwal ulang yang terhubung ke booking lama, pembatalan, dan sisa waktu Draft. |
| Persetujuan | Dua tahap: **Penyetuju** departemen, lalu **Penanggung Jawab Ruang**. Notifikasi lonceng untuk antrean baru. |
| Otomatisasi | Draft batal otomatis saat melewati batas waktu, dan booking selesai otomatis setelah jam meeting berakhir. |
| Monitoring | Jumlah booking, Draft, total dan tingkat pemakaian per ruang per tanggal. |
| Master data | Ruangan, departemen, penyetuju, penanggung jawab ruang, pengguna, dan hak akses. |
| Hak akses | Diatur per menu dan per aksi (lihat, tambah, ubah, hapus, setujui, dan lainnya), diperiksa di server. |
| Riwayat aktivitas | Login, perubahan data, dan persetujuan tercatat beserta IP, perangkat, dan versi data. Data yang dihapus atau diubah bisa dikembalikan. |
| Keamanan | Login email + password (Argon2id), wajib ganti password awal, blokir login gagal, pembatasan laju, header keamanan, dan audit lengkap. |
| Tampilan | Tema terang, gelap, dan sistem; responsif dengan menu bawah di HP. |

## Alur Booking

```mermaid
flowchart LR
  A[Pemesan mengajukan] --> B{Draft}
  B -->|Disetujui penyetuju| C[Menunggu cek ruang]
  B -->|Ditolak| X[Ditolak]
  B -->|Lewat batas waktu| E[Batal otomatis]
  C -->|Ruang siap| D[Disetujui]
  C -->|Ditolak| X
  D -->|Jam meeting berakhir| F[Selesai]
```

Kalau yang memesan adalah Penanggung Jawab Ruang itu sendiri, booking langsung **Disetujui**.

## Tech Stack

| Lapisan | Teknologi |
| --- | --- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Backend | Server Actions dan Route Handlers Next.js |
| Validasi | Zod |
| Database | PostgreSQL 18 dengan Drizzle ORM |
| Penjadwal | pg-boss |
| Tes | Vitest |
| Runtime | Node.js 24, pnpm 10 |

## Memulai

### Prasyarat

- [Node.js](https://nodejs.org/) 24
- [pnpm](https://pnpm.io/) 10
- [PostgreSQL](https://www.postgresql.org/) 18

### Instalasi

1. Clone repository dan pasang dependensi.

   ```bash
   git clone https://github.com/fedyfsgerana/meeting-room-booking.git
   cd meeting-room-booking
   pnpm install
   ```

2. Buat database.

   ```sql
   CREATE ROLE meeting_room_booking LOGIN PASSWORD 'ganti-password';
   CREATE DATABASE meeting_room_booking OWNER meeting_room_booking;
   ```

3. Salin `.env.example` menjadi `.env`, lalu isi nilainya (lihat [Variabel Lingkungan](#variabel-lingkungan)).

   ```bash
   cp .env.example .env
   ```

4. Buat tabel dan data awal.

   ```bash
   pnpm db:generate --name init
   pnpm db:migrate
   pnpm db:seed
   ```

5. Jalankan aplikasi.

   ```bash
   pnpm dev
   ```

Buka `http://localhost:3000` dan masuk dengan email `administrator@example.com` serta password dari `SEED_ADMIN_PASSWORD`. Aplikasi meminta password diganti saat login pertama bila akun dibuat oleh admin.

Data awal berisi enam departemen contoh, satu hak akses **Administrator**, satu akun administrator, dan pengaturan bawaan. Langkah pengaturan berikutnya ada di [SETUP](docs/SETUP.md).

## Variabel Lingkungan

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `DATABASE_URL` | Ya | Koneksi PostgreSQL, misalnya `postgres://meeting_room_booking:PASSWORD@localhost:5432/meeting_room_booking` |
| `SEED_ADMIN_PASSWORD` | Ya | Password awal akun administrator, minimal 8 karakter |
| `JOBS_ENABLED` | Tidak | `true` untuk menyalakan penjadwal (bawaan `true`) |
| `MAINTENANCE_MODE` | Tidak | `true` untuk menampilkan halaman pemeliharaan |
| `APP_ORIGIN` | Produksi | Domain publik aplikasi, misalnya `booking.example.com` |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Produksi | Kunci acak 32 byte (base64) untuk Server Actions |

Karakter khusus di password database ditulis dalam format URL, misalnya `@` menjadi `%40`.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `pnpm dev` | Server pengembangan |
| `pnpm build` | Build produksi |
| `pnpm start` | Menjalankan hasil build |
| `pnpm lint` | Pemeriksaan ESLint |
| `pnpm typecheck` | Pemeriksaan tipe TypeScript |
| `pnpm test` | Tes Vitest |
| `pnpm db:generate --name <nama>` | Membuat migrasi dari perubahan skema |
| `pnpm db:migrate` | Menjalankan migrasi |
| `pnpm db:seed` | Mengisi data awal (aman dijalankan ulang) |
| `pnpm db:studio` | Membuka Drizzle Studio |
| `pnpm db:reset-password` | Mengatur ulang password lewat terminal |
| `pnpm db:clean` | Mengosongkan data kecuali administrator dan departemen |
| `pnpm db:reset` | Mengosongkan seluruh database (khusus pengembangan) |

## Struktur Proyek

```text
meeting-room-booking/
├── docs/                  # Dokumentasi tambahan
├── public/                # Logo dan halaman error statis
├── src/
│   ├── app/               # Halaman dan Route Handlers
│   ├── backend/           # Aksi server, query, auth, penjadwal, dan skema database
│   ├── frontend/          # Komponen tampilan dan CSS
│   ├── lib/               # Aturan bersama, skema Zod, dan tes
│   ├── instrumentation.ts # Menyalakan penjadwal saat server mulai
│   └── proxy.ts           # Proteksi halaman dan header keamanan
├── drizzle.config.ts
├── next.config.ts
└── package.json
```

## Dokumentasi

| Dokumen | Isi |
| --- | --- |
| [SETUP](docs/SETUP.md) | Instalasi di komputer pengembang dan pengaturan awal aplikasi |
| [DEPLOYMENT](docs/DEPLOYMENT.md) | Deploy ke server produksi, HTTPS, dan backup |
| [RUNBOOK](docs/RUNBOOK.md) | Penanganan masalah umum |
| [SECURITY](docs/SECURITY.md) | Pengaman yang dipasang dan aturan saat mengubah kode |
| [ACTION-STANDARDS](docs/ACTION-STANDARDS.md) | Standar ikon dan warna aksi |
| [CHANGELOG](CHANGELOG.md) | Riwayat perubahan |

## Kontribusi

Kontribusi terbuka. Baca [CONTRIBUTING](CONTRIBUTING.md) sebelum membuat Pull Request.

## Lisensi

Dirilis dengan lisensi [MIT](LICENSE).

## Pembuat

**Fedy Fs. Gerana** — Full-stack Developer

- GitHub: [@fedyfsgerana](https://github.com/fedyfsgerana)
