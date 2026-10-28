# Standar ikon dan warna aksi

Semua tombol aksi memakai `ACTION_STYLE` di `src/frontend/components/ui/action-style.ts`, supaya ikon dan warnanya sama di tabel, kepala modal, dan tombol konfirmasi. Jangan menulis ikon atau warna aksi langsung di komponen.

| Aksi                    | Kunci           | Ikon           | Tombol di tabel | Modal dan tombol konfirmasi |
| ----------------------- | --------------- | -------------- | --------------- | --------------------------- |
| Lihat detail            | `view`          | Eye            | Netral          | Biru (primary)              |
| Tambah                  | `create`        | Plus           | Biru            | Biru (primary)              |
| Ubah                    | `update`        | Pencil         | Biru            | Biru (primary)              |
| Hapus                   | `delete`        | Trash2         | Merah           | Merah (danger)              |
| Kembalikan data / versi | `restore`       | RotateCcw      | Kuning          | Kuning (warn)               |
| Jadwal ulang            | `reschedule`    | CalendarClock  | Kuning          | Kuning (warn)               |
| Batalkan booking        | `cancel`        | CircleX        | Merah           | Merah (danger)              |
| Setujui (penyetuju)     | `approve`       | CircleCheck    | Hijau           | Hijau (success)             |
| Ruang siap (PJ ruang)   | `check`         | ClipboardCheck | Hijau           | Hijau (success)             |
| Tolak                   | `reject`        | X              | Merah           | Merah (danger)              |
| Atur ulang password     | `resetPassword` | KeyRound       | Kuning          | Kuning (warn)               |
| Aktifkan                | `activate`      | CircleCheck    | Hijau           | Hijau (success)             |
| Nonaktifkan             | `deactivate`    | Ban            | Merah           | Merah (danger)              |
| Sinkronkan              | `sync`          | RefreshCw      | Biru            | Biru (primary)              |

Aturan warna:

- **Merah** untuk aksi yang menghapus, membatalkan, menolak, atau mematikan.
- **Kuning** untuk aksi yang mengubah kembali atau menimpa data, tapi masih bisa dibatalkan.
- **Hijau** untuk aksi yang menyetujui atau mengaktifkan.
- **Biru** untuk aksi biasa: tambah, ubah, simpan, dan sinkronkan.
- **Netral** untuk aksi yang hanya melihat.

Badge aksi di Riwayat aktivitas memakai warna yang sama (`ACTIVITY_ACTION_TONE` di `src/lib/activity.ts`).

## Satu modal dalam satu waktu

Modal tidak boleh saling menimpa. Setelah aksi di dalam dialog selesai, **tutup dialognya dulu**, baru tampilkan modal status (berhasil atau gagal):

```ts
const result = await someAction();
setTarget(null);
notify(result.message, result.ok ? "success" : "error");
```

Pengecualian: kesalahan isian (`fieldErrors`) tetap ditampilkan di dalam dialog, tanpa modal status.
