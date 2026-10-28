export type ErrorCode =
  | "400"
  | "401"
  | "403"
  | "404"
  | "408"
  | "429"
  | "500"
  | "502"
  | "503"
  | "504"
  | "offline";

export type ErrorContent = { code: string; title: string; description: string };

export const ERROR_CONTENT: Record<ErrorCode, ErrorContent> = {
  "400": {
    code: "400",
    title: "Permintaan tidak valid",
    description:
      "Data yang dikirim tidak bisa diproses. Periksa kembali isian Anda, lalu coba lagi.",
  },
  "401": {
    code: "401",
    title: "Sesi Anda berakhir",
    description:
      "Anda belum masuk atau sesi sudah berakhir. Silakan masuk kembali untuk melanjutkan.",
  },
  "403": {
    code: "403",
    title: "Akses ditolak",
    description:
      "Akun Anda tidak punya hak untuk membuka halaman ini. Hubungi administrator bila Anda memerlukan akses.",
  },
  "404": {
    code: "404",
    title: "Halaman tidak ditemukan",
    description:
      "Halaman yang Anda cari tidak ada, sudah dipindah, atau alamatnya salah ketik.",
  },
  "408": {
    code: "408",
    title: "Waktu permintaan habis",
    description:
      "Server terlalu lama menunggu permintaan Anda. Periksa koneksi, lalu coba lagi.",
  },
  "429": {
    code: "429",
    title: "Terlalu banyak permintaan",
    description:
      "Anda mengirim terlalu banyak permintaan dalam waktu singkat. Tunggu sebentar, lalu coba lagi.",
  },
  "500": {
    code: "500",
    title: "Terjadi kesalahan",
    description:
      "Ada masalah di server kami. Coba muat ulang halaman beberapa saat lagi. Kalau masih terjadi, laporkan ID kesalahan di bawah ke administrator.",
  },
  "502": {
    code: "502",
    title: "Layanan sedang bermasalah",
    description:
      "Server tidak memberi jawaban yang benar. Biasanya pulih dalam beberapa saat.",
  },
  "503": {
    code: "503",
    title: "Sedang pemeliharaan",
    description:
      "Meeting Room Booking sedang diperbarui agar lebih baik. Silakan kembali beberapa saat lagi.",
  },
  "504": {
    code: "504",
    title: "Server terlalu lama merespons",
    description:
      "Permintaan Anda membutuhkan waktu lebih lama dari biasanya. Coba lagi beberapa saat lagi.",
  },
  offline: {
    code: "Offline",
    title: "Tidak ada koneksi internet",
    description:
      "Perangkat Anda sedang tidak terhubung ke jaringan. Periksa Wi-Fi atau kabel LAN, lalu coba lagi.",
  },
};
