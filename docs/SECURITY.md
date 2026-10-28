# Keamanan

Ringkasan pengaman yang dipasang di aplikasi dan hal yang perlu dijaga saat mengubah kode.

## Pengaman yang sudah ada

| Area | Pengaman |
| --- | --- |
| Password | Hash Argon2id, kebijakan kekuatan password, dan wajib ganti password awal. Password tidak pernah dikirim balik ke browser dan tidak pernah ditampilkan di Riwayat aktivitas |
| Sesi | Token acak di cookie `httpOnly`, `SameSite=Lax`, dan `Secure` di produksi, dengan awalan `__Host-` supaya tidak bisa ditimpa subdomain lain; token disimpan sebagai hash. Maksimal 8 jam dan 30 menit tidak aktif, atau 7 hari dan 8 jam tidak aktif dengan "Ingat saya" |
| Login | Blokir 15 menit setelah 5 gagal per IP atau 20 gagal per akun, plus batas 20 percobaan per menit per IP. Pesan gagal selalu sama supaya keberadaan akun tidak terbongkar |
| Hak akses | Diperiksa di server untuk setiap halaman dan setiap aksi (`menu.aksi`). Menyembunyikan tombol hanya untuk tampilan |
| Input | Semua input divalidasi Zod di server. Hanya kolom yang diizinkan yang disimpan |
| Argumen Server Action | ID, boolean, dan teks yang dikirim langsung ke Server Action diperiksa tipenya (`src/lib/args.ts`) |
| Database | Query Drizzle dan `pg` selalu berparameter |
| XSS | React meng-escape teks. HTML buatan sendiri (render Tom Select) memakai fungsi `escape`. Satu-satunya `dangerouslySetInnerHTML` adalah skrip tema yang isinya konstan |
| Redirect | Parameter `?dari=` hanya menerima nilai yang dikenal dan tanggal atau ID yang lolos pola |
| Header | CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, dan HSTS di produksi (`src/proxy.ts`) |
| Laju permintaan | Login, cek ketersediaan, notifikasi, dan kembalikan data dibatasi (`src/backend/security/rate-limit.ts`) |
| Audit | Login, login gagal, logout, dan semua perubahan data tercatat di Riwayat aktivitas dengan IP, perangkat, versi data, dan alasan hapus |

## Alamat IP pengguna

Aplikasi membaca IP dari `X-Real-IP`, lalu dari **entri terakhir** `X-Forwarded-For` (entri yang ditambahkan reverse proxy, bukan yang dikirim browser). Di Nginx:

```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

Jangan membuka port aplikasi (3000) langsung ke internet tanpa reverse proxy, karena header IP bisa dipalsukan.

## Aturan saat mengubah kode

- Setiap Server Action baru wajib memeriksa sesi dan hak `menu.aksi` di awal fungsi, dan memeriksa tipe argumen yang bukan objek form dengan `isId`, `isBoolean`, atau `isText`.
- Jangan memakai `sql.raw` atau merangkai string ke query dengan input pengguna.
- Jangan memakai `dangerouslySetInnerHTML` untuk data dari pengguna atau database.
- Jangan menambah redirect ke alamat yang diambil dari input pengguna.
- Rahasia hanya di `.env` dan tidak pernah memakai awalan `NEXT_PUBLIC_`.
- Jalankan `pnpm audit` sebelum rilis.

## Melaporkan celah keamanan

Jangan melaporkan celah keamanan lewat Issue publik. Hubungi pembuat langsung lewat [GitHub](https://github.com/fedyfsgerana).
