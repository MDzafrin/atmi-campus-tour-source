# Setup Supabase untuk ATMI Campus Tour

Aplikasi ini sekarang memakai PostgreSQL (Supabase) lewat Prisma. Struktur tabelnya tidak berubah dari versi SQLite, jadi kode aplikasi tidak perlu diubah.

Tabelnya ada empat: `Reservation` (pendaftar dan token verifikasi), `TourProgram` (program visit), `SiteSetting` (pengaturan formulir), dan `EmailLog` (salinan email keluar).

## 1. Buat project Supabase

Daftar atau masuk di supabase.com, buat project baru, lalu simpan database password-nya. Password itu hanya muncul sekali. Untuk region, pilih yang paling dekat dengan pengguna, misalnya Singapore.

## 2. Ambil dua connection string

Buka project, klik tombol **Connect** di dashboard, lalu salin dua string dari bagian pooler:

- Transaction pooler (port 6543) untuk `DATABASE_URL`. Tambahkan `?pgbouncer=true` di ujungnya. Ini yang dipakai aplikasi saat berjalan.
- Session pooler (port 5432) untuk `DIRECT_URL`. Ini yang dipakai perintah Prisma seperti `db push`.

Kenapa dua? Prisma CLI tidak jalan baik lewat transaction pooler, jadi migrasi dan push tabel perlu jalur sendiri. Pakai Session pooler, bukan koneksi direct `db.xxx.supabase.co`, karena koneksi direct itu hanya IPv6 dan sering gagal di jaringan rumah atau kampus yang belum dapat IPv6.

Ganti `[PASSWORD]` dengan password database. Kalau password mengandung karakter khusus seperti `@` atau `#`, ubah dulu ke bentuk URL-encoded (`@` jadi `%40`).

## 3. Isi .env

Salin `.env.example` jadi `.env`, lalu isi `DATABASE_URL` dan `DIRECT_URL`. Sekalian cek variabel lain:

```env
APP_URL=https://domain-anda.com
ADMIN_PASSWORD=password-kuat-anda
```

`APP_URL` dipakai untuk link verifikasi di email. Isi juga `SMTP_*` kalau email mau terkirim sungguhan.

## 4. Buat tabel

```bash
bun run db:generate
bun run db:push
```

Setelah ini keempat tabel muncul di Table Editor Supabase. Program visit dan pengaturan default dibuat otomatis oleh aplikasi saat pertama dibuka (`ensureSeed`).

Catatan: script `db:push` memakai `--accept-data-loss`. Aman untuk database kosong, tapi kalau nanti tabel sudah berisi data asli dan skema berubah, baca dulu pesan Prisma sebelum lanjut.

## 5. Pindahkan data lama (opsional)

Kalau data di `db/custom.db` masih mau dipakai, jalankan:

```bash
bun scripts/migrate-sqlite-ke-supabase.ts
```

Skrip ini menyalin pengaturan, program, reservasi, dan log email. Aman dijalankan ulang karena baris yang sudah ada dilewati.

## 6. Jalankan

```bash
bun run dev
# atau
bun run build && bun run start
```

## Checklist

- [ ] `.env` berisi `DATABASE_URL` (6543, `?pgbouncer=true`) dan `DIRECT_URL` (5432)
- [ ] `APP_URL` dan `ADMIN_PASSWORD` sudah diganti untuk produksi
- [ ] `SMTP_*` terisi kalau email mau terkirim asli
- [ ] `bun run db:generate && bun run db:push` berhasil
- [ ] Data lama dipindah (kalau perlu)
- [ ] `.env` dan `db/custom.db` tidak ikut di-commit atau dikirim ke orang lain
