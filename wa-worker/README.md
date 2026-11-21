# WA Worker

Program kecil yang mengirim pesan WhatsApp ke pendaftar Campus Tour. Ia membaca antrean pesan dari aplikasi web, lalu mengirimnya lewat WhatsApp Web dari sebuah nomor khusus.

Cara kerjanya:

1. Pendaftar menekan reservasi, aplikasi web memasukkan pesan "pendaftaran diterima" ke antrean (tabel `WaMessage`).
2. Admin memverifikasi reservasi, aplikasi web memasukkan pesan "terverifikasi" berisi tautan kartu.
3. Program ini mengecek antrean tiap beberapa detik, mengirim pesan satu per satu dengan jeda acak, lalu melaporkan hasilnya ke aplikasi web.

Program ini harus **menyala terus** di satu komputer (laptop atau PC yang tidak dimatikan). Ia tidak bisa jalan di Vercel.

## Peringatan penting

Ini memakai WhatsApp Web secara otomatis, bukan jalur resmi Meta. Cara ini melanggar ketentuan WhatsApp, dan nomor yang dipakai bisa diblokir kapan saja.

- Pakai **nomor khusus** yang rela hilang. Jangan pakai nomor Marketing (0812 8833 1700). Program ini menolak jalan kalau QR dipindai dengan nomor di `WA_BLOCKED_NUMBERS`.
- Kirim hanya ke orang yang baru mendaftar sendiri lewat formulir. Jangan dipakai untuk broadcast atau promosi.
- Pakai nomor itu secara normal dulu beberapa hari (kirim dan terima chat biasa, pasang nama dan foto profil) sebelum dihubungkan ke program ini. Nomor yang baru dibuat lalu langsung mengirim pesan otomatis lebih mudah diblokir.
- Biarkan jeda dan batas harian di `.env` tetap konservatif.

## Pasang

Butuh Node.js versi 20 atau lebih baru.

1. Di PowerShell, masuk ke folder ini dan pasang paket (sekali saja, mengunduh Chromium sekitar 200 MB):

   ```powershell
   cd wa-worker
   npm install
   ```

2. Buat file `.env`:

   ```powershell
   Copy-Item .env.example .env
   ```

   Isi `WA_APP_URL` dan `WA_WORKER_SECRET`. Untuk `WA_WORKER_SECRET`, buat string acak panjang, misalnya dari:

   ```powershell
   -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
   ```

3. Di **aplikasi web**, tambahkan dua baris ini ke `.env` (dan ke Environment Variables di Vercel kalau situsnya sudah online), dengan kunci yang sama persis:

   ```
   WA_ENABLED=true
   WA_WORKER_SECRET=isi-kunci-yang-sama
   ```

4. Di folder utama proyek, buat tabel antrean di database (sekali saja):

   ```powershell
   npx prisma db push
   ```

   Lalu restart aplikasi web.

## Jalankan

Pastikan aplikasi web sudah jalan, lalu di folder `wa-worker`:

```powershell
npm start
```

Saat pertama kali, muncul kode QR di terminal. Di HP nomor khusus: WhatsApp, Perangkat tertaut, Tautkan perangkat, lalu pindai. Login tersimpan di folder `.wwebjs_auth`, jadi lain kali nggak perlu pindai lagi.

Kalau terminal bertuliskan `Siap. Mengirim sebagai nomor ...`, program sudah aktif.

## Coba

Buat satu reservasi lewat situs dengan nomor HP milik sendiri. Dalam beberapa detik, pesan "pendaftaran diterima" masuk. Verifikasi reservasi itu di dashboard, dan pesan kedua berisi tautan kartu menyusul.

Status tiap pesan (`PENDING`, `SENDING`, `SENT`, `FAILED`) dan pesan error-nya bisa dilihat di tabel `WaMessage` lewat `npx prisma studio`.

## Kalau bermasalah

- **Pesan nggak keluar sama sekali:** cek `WA_ENABLED=true` di aplikasi web dan sudah restart, kunci rahasia di dua `.env` sama persis, dan `WA_APP_URL` benar. Kalau salah kunci, terminal menampilkan `HTTP 401`.
- **`HTTP 503`:** `WA_WORKER_SECRET` di aplikasi web kosong atau kurang dari 16 karakter.
- **Link kartu nggak bisa dibuka di HP pendaftar:** `APP_URL` di aplikasi web masih `localhost`. Link baru berguna kalau situsnya sudah online.
- **QR nggak muncul atau login macet:** tutup program, hapus folder `.wwebjs_auth` dan `.wwebjs_cache`, lalu jalankan ulang.
- **Status `FAILED` dengan `NOMOR_TIDAK_ADA_DI_WHATSAPP`:** nomor yang diisi pendaftar nggak punya WhatsApp. Pesan itu nggak dicoba lagi.
- **Nomor terblokir:** ganti nomor khusus, hapus `.wwebjs_auth`, pindai QR dengan nomor baru.
