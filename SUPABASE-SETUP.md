# Panduan Setup Supabase — ATMI Campus Tour

Website ini dirancang agar bisa dipindahkan dari SQLite (demo) ke **Supabase
(PostgreSQL)** dengan perubahan minimal. Struktur database sudah dibuat ramah
Supabase: tanpa tipe khusus SQLite, tanpa enum Prisma, dan semua daftar
disimpan sebagai string biasa.

## Model yang ada

| Model          | Fungsi                                                        |
| -------------- | ------------------------------------------------------------- |
| `Reservation`  | Data pendaftar campus tour + token verifikasi email           |
| `TourProgram`  | Program visit (diedit dari dashboard)                         |
| `SiteSetting`  | Pengaturan formulir: peserta, durasi, sesi waktu, tanggal buka |
| `EmailLog`     | Salinan email verifikasi (audit / kotak masuk demo)           |

## Langkah migrasi ke Supabase

### 1. Buat project Supabase

1. Daftar/masuk di [supabase.com](https://supabase.com) → **New project**.
2. Simpan **database password** yang muncul (hanya ditampilkan sekali).

### 2. Ambil connection string

1. Buka project → **Project Settings** (ikon gear) → **Database**.
2. Bagian **Connection string** → pilih **URI**.
3. Gunakan yang **Connection pooling** (port `6543`) untuk aplikasi web,
   contohnya:

   ```
   postgresql://postgres.xxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

4. Ganti `[PASSWORD]` dengan password database Anda.

### 3. Ubah konfigurasi Prisma

**a. Edit `prisma/schema.prisma`** — ubah provider SQLite menjadi PostgreSQL:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**b. Edit `.env`** — ganti `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres.xxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

> Tips: untuk migration/seed (bukan runtime) Supabase menyarankan koneksi
> langsung port `5432`. Anda boleh memakai dua variabel terpisah, tapi
> untuk kebutuhan app ini satu connection string pooling sudah cukup.

### 4. Buat tabel di Supabase

Jalankan:

```bash
bun run db:generate
bun run db:push
```

Semua tabel (`Reservation`, `TourProgram`, `SiteSetting`, `EmailLog`) akan
dibuat otomatis. Data awal (2 program visit + pengaturan default) dibuat
sendiri oleh aplikasi saat pertama dijalankan (`ensureSeed`).

### 5. Perbarui URL produksi

Di `.env`, sesuaikan:

```env
APP_URL=https://domain-anda.com   # dipakai untuk link verifikasi di email
ADMIN_PASSWORD=password-kuat-anda # password login dashboard
```

### 6. (Opsional) Verifikasi tabel di dashboard Supabase

Buka **Table Editor** di dashboard Supabase — keempat tabel akan terlihat
di sana. Anda bisa melihat/mengedit data reservasi langsung dari Supabase
bila perlu.

## Checklist pindah server

- [ ] `prisma/schema.prisma` → `provider = "postgresql"`
- [ ] `.env` → `DATABASE_URL` Supabase
- [ ] `.env` → `APP_URL` domain produksi (agar tombol verifikasi email benar)
- [ ] `.env` → `ADMIN_PASSWORD` baru
- [ ] `.env` → kredensial `SMTP_*` (agar email verifikasi terkirim asli)
- [ ] `bun run db:generate && bun run db:push`
- [ ] Jalankan `bun run dev` / `bun run build && bun run start`

## Catatan struktur untuk Supabase

- Kolom bertipe `String` panjang (mis. `EmailLog.bodyHtml`) otomatis jadi
  `TEXT` di PostgreSQL.
- Daftar seperti `SiteSetting.timeSlots` dan `openDates` disimpan sebagai
  string dipisah koma — sengaja begitu agar identik antara SQLite dan
  PostgreSQL dan tetap mudah diedit dari dashboard.
- `Reservation.status` bernilai `PENDING` (menunggu verifikasi email) atau
  `CONFIRMED` (sudah verifikasi) — dikelola aplikasi, tidak perlu enum DB.
