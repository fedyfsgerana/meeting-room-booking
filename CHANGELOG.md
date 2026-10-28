# Changelog

Semua perubahan penting dicatat di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/), dan versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

## [1.0.0] - Belum dirilis

Rilis pertama.

### Ditambahkan

- Login dengan email dan password, sesi lewat cookie `httpOnly` dengan batas maksimal dan batas tidak aktif, serta opsi "Ingat saya".
- Keamanan akun: hash Argon2id, kebijakan kekuatan password, wajib ganti password awal, ganti password sendiri, dan blokir sementara setelah login gagal berulang.
- Beranda berisi status setiap ruang dan timeline harian.
- Booking ruang dengan cek ketersediaan langsung, teleconference, jadwal ulang yang terhubung ke booking lama, dan pembatalan dengan alasan.
- Persetujuan dua tahap oleh Penyetuju departemen dan Penanggung Jawab Ruang, beserta notifikasi lonceng.
- Draft batal otomatis dan booking selesai otomatis lewat penjadwal pg-boss.
- Monitoring pemakaian ruang per tanggal.
- Master data: ruangan, departemen, penyetuju, penanggung jawab ruang, pengguna, dan hak akses per menu dan aksi.
- Pengaturan batas waktu Draft, jam dan hari operasional, serta hari libur.
- Riwayat aktivitas dengan versi data, alasan hapus, dan fitur kembalikan data.
- Pengamanan aplikasi: header keamanan, pembatasan laju permintaan, validasi argumen Server Action, dan konfigurasi produksi.
- Tema terang, gelap, dan sistem; tampilan responsif; halaman error dan mode pemeliharaan.
- Tes Vitest untuk aturan inti.
- Dokumentasi SETUP, DEPLOYMENT, RUNBOOK, SECURITY, dan ACTION-STANDARDS.
