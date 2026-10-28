# Deployment

Panduan memasang Meeting Room Booking di server produksi. Aplikasi berjalan sebagai satu proses Node.js yang melayani halaman, API, dan penjadwal sekaligus.

## Kebutuhan server

| Komponen | Kebutuhan |
| --- | --- |
| Sistem operasi | Linux (Ubuntu 24.04 LTS disarankan) atau Windows Server |
| Runtime | Node.js 24 dan pnpm 10 |
| Database | PostgreSQL 18, di server yang sama atau terpisah |
| Reverse proxy | Nginx atau sejenisnya dengan HTTPS |
| Sumber daya | Minimal 2 vCPU dan 2 GB RAM |

**HTTPS wajib.** Di produksi, cookie sesi ditandai `Secure`, jadi browser hanya menyimpannya lewat HTTPS.

## 1. Pasang pertama kali

```bash
git clone https://github.com/fedyfsgerana/meeting-room-booking.git /opt/meeting-room-booking
cd /opt/meeting-room-booking
pnpm install --frozen-lockfile
cp .env.example .env
nano .env
```

Isi `.env` produksi:

| Variabel | Isi |
| --- | --- |
| `DATABASE_URL` | Koneksi ke database produksi dengan user khusus aplikasi |
| `SEED_ADMIN_PASSWORD` | Password awal akun administrator. Segera ganti lewat menu akun setelah login pertama |
| `JOBS_ENABLED` | `true`. Kalau aplikasi dijalankan di lebih dari satu server, isi `true` hanya di satu server |
| `APP_ORIGIN` | Domain publik tanpa `https://`, misalnya `booking.example.com`. Bisa lebih dari satu, dipisah koma |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Kunci acak 32 byte dalam base64 |

Membuat kunci acak:

```bash
openssl rand -base64 32
```

Di Windows PowerShell:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

`APP_ORIGIN` dan `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` dibaca saat build, jadi jalankan ulang `pnpm build` setiap kali mengubahnya.

```bash
pnpm db:generate --name init
pnpm db:migrate
pnpm db:seed
pnpm build
```

Langkah `db:generate` hanya perlu kalau folder `drizzle/` belum ada di repository.

## 2. Jalankan sebagai layanan (systemd)

Buat `/etc/systemd/system/meeting-room-booking.service`:

```ini
[Unit]
Description=Meeting Room Booking
After=network.target postgresql.service

[Service]
Type=simple
User=booking
WorkingDirectory=/opt/meeting-room-booking
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now meeting-room-booking
sudo systemctl status meeting-room-booking
```

## 3. Reverse proxy Nginx

```nginx
server {
  listen 443 ssl http2;
  server_name booking.example.com;

  ssl_certificate     /etc/ssl/certs/booking.example.com.crt;
  ssl_certificate_key /etc/ssl/private/booking.example.com.key;

  error_page 502 /errors/502.html;
  error_page 503 /errors/503.html;
  error_page 504 /errors/504.html;

  location ^~ /errors/ {
    root /opt/meeting-room-booking/public;
    internal;
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

server {
  listen 80;
  server_name booking.example.com;
  return 301 https://$host$request_uri;
}
```

Ganti `booking.example.com` dan sertifikat sesuai domain yang dipakai. Jangan membuka port 3000 langsung ke internet.

## 4. Pemeriksaan setelah deploy

1. `https://<domain>/api/health` menampilkan `{"status":"ok","database":"ok"}`.
2. Log layanan menampilkan `[jobs] Penjadwal aktif` (`journalctl -u meeting-room-booking -f`).
3. Login sebagai administrator berhasil dan sesi tetap tersimpan setelah halaman dimuat ulang.

## 5. Memperbarui aplikasi

```bash
cd /opt/meeting-room-booking
git pull origin main
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm build
sudo systemctl restart meeting-room-booking
```

Selalu backup database sebelum menjalankan migrasi.

## 6. Backup database

```bash
pg_dump -U meeting_room_booking -Fc meeting_room_booking > backup-$(date +%Y%m%d).dump
```

Memulihkan:

```bash
pg_restore -U meeting_room_booking -d meeting_room_booking --clean backup-YYYYMMDD.dump
```

Skema `pgboss` (antrean penjadwal) ikut terbackup dan boleh dipulihkan bersama data aplikasi.

## Mode pemeliharaan

Isi `MAINTENANCE_MODE=true` di `.env`, lalu restart layanan. Semua halaman menampilkan **Sedang pemeliharaan** dengan kode 503, kecuali `/api/health`. Kembalikan ke `false` dan restart lagi setelah selesai.
