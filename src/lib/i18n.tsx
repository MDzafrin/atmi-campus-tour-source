"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Locale = "id" | "en";

const id = {
  "nav.home": "Beranda",
  "nav.about": "Tentang",
  "nav.tours": "Program Tur",
  "nav.facilities": "Fasilitas",
  "nav.testimonials": "Testimoni",
  "nav.news": "Berita",
  "nav.location": "Lokasi",
  "nav.reserve": "Reservasi Tur",
  "nav.tagline": "Campus Tour Resmi",

  "topbar.phone": "Marketing & Info: 0812 8833 1700",
  "topbar.address": "Jl. Kampus Hijau No. 3, Jababeka Education Park, Cikarang",

  "hero.badge": "ATMI Campus Tour",
  "hero.title1": "Jelajahi Bagaimana ATMI Mengubah",
  "hero.title2": "Potensi Menjadi Kompetensi",
  "hero.subtitle":
    "Kunjungi kampus vokasi industri Katolik di jantung kawasan Jababeka. Rasakan langsung sistem PBET: 67% praktik produksi, satu mahasiswa satu mesin, dan budaya kerja industri yang nyata.",
  "hero.ctaReserve": "Reservasi Sekarang",
  "hero.ctaPrograms": "Lihat Program Tur",
  "hero.scroll": "Gulir untuk menjelajah",
  "hero.stats.alumni": "Alumni Telah Bekerja",
  "hero.stats.prodi": "Program Studi",
  "hero.stats.practice": "Praktik Produksi (PBET)",
  "hero.stats.years": "Tahun Menghasilkan SDM Industri",

  "about.kicker": "Tentang ATMI",
  "about.title": "Mempersiapkan Generasi untuk Dunia Industri",
  "about.p1":
    "Politeknik Industri ATMI Cikarang merupakan perguruan tinggi vokasi yang berdiri sejak tahun 2003 di bawah naungan Yayasan Karya ATMI. Berlokasi di kawasan industri Jababeka, ATMI berfokus pada pendidikan di bidang industri dengan menggabungkan pembelajaran teori dan praktik secara langsung.",
  "about.p2":
    "Melalui kegiatan praktik dan proyek industri, mahasiswa dibekali keterampilan serta pengalaman yang sesuai dengan kebutuhan dunia kerja. Pendidikan di ATMI juga berlandaskan lima nilai utama, yaitu Competence, Conscience, Compassion, Commitment, dan Leadership, untuk membentuk lulusan yang terampil, bertanggung jawab, dan memiliki karakter.",
  "about.motto": "Kompetensi · Nurani · Welas Asih",
  "about.why.title": "Mengapa kuliah di ATMI berbeda?",
  "about.why.1.title": "Learning by Doing",
  "about.why.1.desc":
    "Kurikulum PBET memadukan 67% praktik produksi nyata dan 33% teori, dirancang bersama industri.",
  "about.why.2.title": "One Student, One Machine",
  "about.why.2.desc":
    "Setiap mahasiswa mengelola mesinnya sendiri di Teaching Factory yang melayani pesanan industri.",
  "about.why.3.title": "Asrama Tahun Pertama",
  "about.why.3.desc":
    "Mahasiswa tahun pertama tinggal di asrama untuk membangun disiplin, karakter, dan mental kerja industri.",
  "about.why.4.title": "Di Tengah Kawasan Industri",
  "about.why.4.desc":
    "Berada di kawasan Jababeka — kota industri terbesar di Indonesia — membuka peluang magang dan karier tanpa batas.",

  "tours.kicker": "Program Tur",
  "tours.title": "Pilih Tur Sesuai Kelompokmu",
  "tours.subtitle":
    "Setiap tur dipandu staf dan mahasiswa ATMI. Kuota 10–30 peserta per sesi agar pengalaman tetap personal dan mendalam.",
  "tours.general.name": "General Course Tour",
  "tours.general.audience":
    "Untuk umum, instansi, komunitas, serta mitra industri yang ingin mengenal ATMI dan sistem pendidikan produksinya.",
  "tours.general.includes.1": "Welcome drink & pengenalan profil ATMI",
  "tours.general.includes.2": "Tur Teaching Factory & workshop produksi",
  "tours.general.includes.3": "Demo proses machining & mekatronika",
  "tours.general.includes.4": "Sesi diskusi dengan perwakilan kampus",
  "tours.student.name": "Student Course Tour",
  "tours.student.audience":
    "Untuk pelajar SMA/SMK/sederajat dan mahasiswa yang menjajaki kelanjutan studi di bidang teknik dan manajemen industri.",
  "tours.student.includes.1": "Semua rangkaian General Course Tour",
  "tours.student.includes.2": "Trial class singkat bersama dosen praktisi",
  "tours.student.includes.3": "Konsultasi prodi & informasi pendaftaran",
  "tours.student.includes.4": "Kunjungan asrama mahasiswa tahun pertama",
  "tours.meta.capacityTpl": "Maksimal {n} peserta",
  "tours.meta.durationTpl": "± {h} jam",
  "tours.meta.days": "Senin – Jumat",
  "tours.cta": "Reservasi Program Ini",
  "tours.note":
    "Butuh kunjungan khusus (industri, studi banding, atau agenda lembaga)? Hubungi kami di 0812 8833 1700 untuk menyusun agenda sesuai kebutuhan.",

  "facilities.kicker": "Fasilitas",
  "facilities.title": "Belajar dengan Fasilitas Berstandar Industri",
  "facilities.subtitle":
    "Selama tur, kamu akan berkeliling langsung ke fasilitas produksi dan pembelajaran ATMI.",
  "facilities.1.title": "Teaching Factory",
  "facilities.1.desc":
    "Tempat belajar sekaligus praktik langsung melalui proses produksi dengan suasana dan standar kerja industri.",
  "facilities.2.title": "Workshop Mesin & CNC",
  "facilities.2.desc":
    "Dilengkapi berbagai mesin konvensional hingga CNC, konsep one student one machine membuat setiap mahasiswa benar-benar menguasai mesinnya.",
  "facilities.3.title": "Lab Mekatronika & Robotika",
  "facilities.3.desc":
    "PLC, pneumatik-hidrolik, hingga robot arm industri untuk program Sarjana Terapan Teknologi Rekayasa Mekatronika.",
  "facilities.4.title": "Asrama Mahasiswa",
  "facilities.4.desc":
    "Dormitory wajib tahun pertama yang menumbuhkan kedisiplinan, kemandirian, dan solidaritas antar angkatan.",

  "res.kicker": "Reservasi Tur",
  "res.title": "Jadwalkan Kunjunganmu ke ATMI",
  "res.subtitle":
    "Isi formulir 4 langkah berikut. Tim kami akan menghubungimu untuk konfirmasi ketersediaan jadwal.",
  "res.steps.1": "Program",
  "res.steps.2": "Jadwal",
  "res.steps.3": "Data Pemohon",
  "res.steps.4": "Konfirmasi",
  "res.program": "Program Tur",
  "res.participants": "Jumlah Peserta",
  "res.participantsHintTpl": "Minimal {min} dan maksimal {max} peserta per sesi",
  "res.date": "Tanggal Kunjungan",
  "res.datePlaceholder": "Pilih tanggal",
  "res.time": "Sesi Waktu",
  "res.slot.morning": "09.00 – 11.00 WIB",
  "res.slot.afternoon": "13.30 – 15.30 WIB",
  "res.name": "Nama Lengkap",
  "res.namePlaceholder": "Nama penanggung jawab",
  "res.institution": "Sekolah / Lembaga / Perusahaan",
  "res.institutionPlaceholder": "Contoh: SMK Negeri 1 Cikarang",
  "res.email": "Email",
  "res.emailPlaceholder": "nama@lembaga.sch.id",
  "res.phone": "No. WhatsApp / Telepon",
  "res.phonePlaceholder": "08xxxxxxxxxx",
  "res.notes": "Catatan (opsional)",
  "res.notesPlaceholder":
    "Kebutuhan khusus, jumlah bus, atau fokus kunjungan yang diinginkan",
  "res.agree":
    "Saya menyatakan data di atas benar dan bersedia dihubungi tim ATMI untuk konfirmasi reservasi.",
  "res.back": "Kembali",
  "res.next": "Lanjut",
  "res.submit": "Ajukan Pendaftaran",
  "res.submitting": "Mengirim pengajuan...",
  "res.err.participantsTpl": "Jumlah peserta harus antara {min}–{max} orang",
  "res.err.date": "Pilih tanggal kunjungan",
  "res.dateNone": "Belum ada tanggal visit yang dibuka. Hubungi Marketing ATMI di 0812 8833 1700.",
  "res.err.slot": "Pilih sesi waktu kunjungan",
  "res.err.name": "Nama lengkap wajib diisi",
  "res.err.institution": "Nama sekolah/lembaga wajib diisi",
  "res.err.email": "Alamat email tidak valid",
  "res.err.phone": "Nomor telepon/WhatsApp tidak valid",
  "res.err.agree": "Centang pernyataan untuk melanjutkan",
  "res.err.submit": "Gagal mengirim reservasi. Coba lagi atau hubungi 0812 8833 1700.",
  "res.summary": "Ringkasan Reservasi",
  "res.summary.program": "Program",
  "res.summary.date": "Tanggal",
  "res.summary.time": "Sesi",
  "res.summary.participants": "Peserta",
  "res.summary.contact": "Kontak",
  "res.success.title": "Berhasil Mendaftar!",
  "res.success.statusLabel": "Status Pengajuan",
  "res.success.statusValue": "Menunggu verifikasi admin ATMI",
  "res.success.toast":
    "Pengajuan berhasil — langsung masuk ke dashboard admin ATMI untuk diverifikasi.",
  "res.success.desc":
    "Pengajuan pendaftaran Anda berhasil dibuat dan langsung masuk ke dashboard admin ATMI. Belum ada email yang dikirim pada tahap ini — kartu bukti pendaftaran (PDF) baru dikirim otomatis setelah admin memverifikasi pengajuan Anda.",
  "res.success.emailLater": "Kartu bukti pendaftaran (PDF) nanti dikirim ke",
  "res.success.note":
    "Proses verifikasi biasanya selesai dalam 1×24 jam kerja. Pertanyaan? WhatsApp Marketing ATMI di 0812 8833 1700.",
  "res.success.again": "Kembali ke Formulir",
  "res.success.auto": "Formulir baru terbuka otomatis dalam {n} detik…",
  "res.info.title": "Kenapa harus reservasi?",
  "res.info.1": "Dipandu langsung oleh staf & mahasiswa ATMI",
  "res.info.2": "Tur kelompok kecil — maksimal 30 peserta",
  "res.info.3": "Gratis untuk sekolah dan lembaga pendidikan",
  "res.info.4": "Bisa request fokus kunjungan sesuai kebutuhan",
  "res.info.contact": "Butuh bantuan? Hubungi Marketing:",

  // "testi.kicker": "Testimoni",
  // "testi.title": "Kata Mereka yang Tumbuh di ATMI",
  // "testi.subtitle":
  //   "Belajar di ATMI bukan sekadar teori — inilah pengalaman nyata alumni yang kini berkiprah di industri.",
  // "testi.1.quote":
  //   "Materi kuliah sangat relevan dan terkoneksi dengan dunia kerja yang saya masuki. Kuncinya kerja keras dan learning by doing.",
  // "testi.1.name": "Ayup Riyadi Prihantoro",
  // "testi.1.role": "CEO PT Lastika Prima Teknik — Alumni ATMI",
  // "testi.2.quote":
  //   "Pengalaman di ATMI membantu saya berkembang dalam keberanian, kepedulian, dan disiplin. Ilmu yang saya peroleh saya terapkan hingga di Republik Ceko.",
  // "testi.2.name": "Theo Zefanya",
  // "testi.2.role": "Skoda Transportation, Republik Ceko — Angkatan 2021",
  // "testi.3.quote":
  //   "Pendidikan yang melatih mahasiswa untuk lebih kreatif dan mampu beradaptasi — manfaatnya masih saya rasakan hingga saat ini.",
  // "testi.3.name": "Agatha Evalina Christy",
  // "testi.3.role": "Alumni Muda Politeknik Industri ATMI",

  // "news.kicker": "Berita Terbaru",
  // "news.title": "What's On di Politeknik Industri ATMI",
  // "news.subtitle": "Kabar terkini dari kegiatan kampus dan civitas akademika.",
  // "news.readMore": "Baca selengkapnya",
  // "news.1.date": "30 Oktober 2026",
  // "news.1.tag": "News",
  // "news.1.title":
  //   "Wisuda 2026: “It’s Time to Reclaim Our Legacy and Lead the Future”",
  // "news.2.date": "19 Agustus 2026",
  // "news.2.tag": "Campus Life",
  // "news.2.title":
  //   "Arrupe Insight Eps. 8: “Bekerja Bukan dengan Perasaan, Melainkan Profesionalitas”",
  // "news.3.date": "14 Agustus 2026",
  // "news.3.tag": "Campus Life",
  // "news.3.title":
  //   "Arrupe Insight Eps. 7: “Jika Kita Tidak Membidik Sesuatu, Maka Kita Tidak Akan Mendapatkan Sesuatu”",

  "loc.kicker": "Lokasi & Kontak",
  "loc.title": "Temukan Kami di Jababeka Education Park",
  "loc.address.label": "Alamat Kampus",
  "loc.address.value":
    "Jl. Kampus Hijau No. 3, Jababeka Education Park, Cikarang Baru, Bekasi 17520, Jawa Barat",
  "loc.contact.label": "Marketing & Informasi",
  "loc.hours.label": "Jam Operasional Tur",
  "loc.hours.value": "Senin – Jumat, 08.00 – 16.00 WIB",
  "loc.wa": "Chat WhatsApp",
  "loc.maps": "Buka di Google Maps",
  "loc.follow": "Ikuti kami",

  "footer.blurb":
    "Politeknik Industri ATMI Cikarang — kampus vokasi Katolik penghasil SDM industri unggul sejak 2003. Competentia, Conscientia, Compassio.",
  "footer.links": "Navigasi",
  "footer.contact": "Kontak",
  "footer.programs": "Program Studi",
  "footer.prog.1": "D3 Mesin Industri",
  "footer.prog.2": "Sarjana Terapan Teknologi Rekayasa Mekatronika",
  "footer.prog.3": "D3 Manajemen Industri",
  "footer.rights":
    "© 2026 Politeknik Industri ATMI Cikarang. All Rights Reserved.",
  "footer.disclaimer":
    "Website demo non-resmi yang terinspirasi dari konsep hmmifactorytour.co.id — dibuat untuk keperluan konsep Campus Tour ATMI.",

  "common.langLabel": "Bahasa",
};

export type DictKey = keyof typeof id;

const en: Record<DictKey, string> = {
  "nav.home": "Home",
  "nav.about": "About",
  "nav.tours": "Tour Programs",
  "nav.facilities": "Facilities",
  "nav.testimonials": "Testimonials",
  "nav.news": "News",
  "nav.location": "Location",
  "nav.reserve": "Book a Tour",
  "nav.tagline": "Official Campus Tour",

  "topbar.phone": "Marketing & Info: +62 812 8833 1700",
  "topbar.address": "Jl. Kampus Hijau No. 3, Jababeka Education Park, Cikarang",

  "hero.badge": "ATMI Campus Tour",
  "hero.title1": "Explore How ATMI Turns",
  "hero.title2": "Potential into Competence",
  "hero.subtitle":
    "Visit the Catholic industrial polytechnic in the heart of Jababeka. Experience the PBET system first-hand: 67% production practice, one student one machine, and a real industrial work culture.",
  "hero.ctaReserve": "Book Your Tour",
  "hero.ctaPrograms": "View Tour Programs",
  "hero.scroll": "Scroll to explore",
  "hero.stats.alumni": "Alumni Employed",
  "hero.stats.prodi": "Study Programs",
  "hero.stats.practice": "Production Practice (PBET)",
  "hero.stats.years": "Years Shaping Industrial Talent",

  "about.kicker": "About ATMI",
  "about.title": "An Industrial Polytechnic in the Heart of Jababeka",
  "about.p1":
    "Politeknik Industri ATMI Cikarang is a Catholic vocational college founded in 2003 under the Karya ATMI Foundation. Located in Jababeka Education Park, Cikarang, the campus grows alongside hundreds of surrounding manufacturing companies.",
  "about.p2":
    "Guided by the motto Competentia, Conscientia, Compassio — Competence, Conscience, and Compassion — ATMI shapes industrial engineers and managers who are not only skilled but also people of integrity.",
  "about.motto": "Competence · Conscience · Compassion",
  "about.why.title": "Why studying at ATMI is different?",
  "about.why.1.title": "Learning by Doing",
  "about.why.1.desc":
    "The PBET curriculum blends 67% real production practice with 33% theory, designed together with industry.",
  "about.why.2.title": "One Student, One Machine",
  "about.why.2.desc":
    "Every student operates their own machine in the Teaching Factory that serves real industrial orders.",
  "about.why.3.title": "First-Year Dormitory",
  "about.why.3.desc":
    "First-year students live in the dormitory to build discipline, character, and industrial work ethic.",
  "about.why.4.title": "Inside an Industrial Estate",
  "about.why.4.desc":
    "Located in Jababeka — Indonesia's largest industrial city — opening limitless internship and career opportunities.",

  "tours.kicker": "Tour Programs",
  "tours.title": "Choose the Tour That Fits Your Group",
  "tours.subtitle":
    "Every tour is guided by ATMI staff and students. Capacity of 10–30 participants per session keeps the experience personal and in-depth.",
  "tours.general.name": "General Course Tour",
  "tours.general.audience":
    "For the general public, institutions, communities, and industry partners who want to know ATMI and its production-based education.",
  "tours.general.includes.1": "Welcome drink & ATMI profile introduction",
  "tours.general.includes.2": "Teaching Factory & production workshop tour",
  "tours.general.includes.3": "Machining & mechatronics process demo",
  "tours.general.includes.4": "Discussion session with campus representatives",
  "tours.student.name": "Student Course Tour",
  "tours.student.audience":
    "For high/vocational school students and undergraduates exploring further studies in engineering and industrial management.",
  "tours.student.includes.1": "All General Course Tour sessions",
  "tours.student.includes.2": "Short trial class with practitioner lecturers",
  "tours.student.includes.3": "Study program consultation & admission info",
  "tours.student.includes.4": "First-year student dormitory visit",
  "tours.meta.capacityTpl": "Up to {n} participants",
  "tours.meta.durationTpl": "± {h} hours",
  "tours.meta.days": "Monday – Friday",
  "tours.cta": "Book This Program",
  "tours.note":
    "Need a special visit (corporate, benchmarking, or institutional agenda)? Call us at +62 812 8833 1700 to tailor the agenda.",

  "facilities.kicker": "Facilities",
  "facilities.title": "A Campus that Operates Like Industry",
  "facilities.subtitle":
    "During the tour, you will walk directly through ATMI's production and learning facilities.",
  "facilities.1.title": "Teaching Factory",
  "facilities.1.desc":
    "A real production unit handling industrial orders — students learn while manufacturing components to factory standards.",
  "facilities.2.title": "Machining & CNC Workshop",
  "facilities.2.desc":
    "Turning, milling, and CNC lines — the one student one machine concept ensures every student truly masters their machine.",
  "facilities.3.title": "Mechatronics & Robotics Lab",
  "facilities.3.desc":
    "PLC, pneumatics-hydraulics, and industrial robot arms for the Applied Bachelor of Mechatronics Engineering Technology.",
  "facilities.4.title": "Student Dormitory",
  "facilities.4.desc":
    "Mandatory first-year dormitory that grows discipline, independence, and cross-cohort solidarity.",

  "res.kicker": "Tour Reservation",
  "res.title": "Schedule Your Visit to ATMI",
  "res.subtitle":
    "Fill in this 4-step form. Our team will contact you to confirm schedule availability.",
  "res.steps.1": "Program",
  "res.steps.2": "Schedule",
  "res.steps.3": "Applicant",
  "res.steps.4": "Confirm",
  "res.program": "Tour Program",
  "res.participants": "Number of Participants",
  "res.participantsHintTpl": "Minimum {min} and maximum {max} participants per session",
  "res.date": "Visit Date",
  "res.datePlaceholder": "Pick a date",
  "res.time": "Time Session",
  "res.slot.morning": "09.00 – 11.00 WIB",
  "res.slot.afternoon": "13.30 – 15.30 WIB",
  "res.name": "Full Name",
  "res.namePlaceholder": "Person in charge's name",
  "res.institution": "School / Institution / Company",
  "res.institutionPlaceholder": "e.g. SMK Negeri 1 Cikarang",
  "res.email": "Email",
  "res.emailPlaceholder": "name@institution.sch.id",
  "res.phone": "WhatsApp / Phone Number",
  "res.phonePlaceholder": "08xxxxxxxxxx",
  "res.notes": "Notes (optional)",
  "res.notesPlaceholder":
    "Special needs, number of buses, or the desired focus of the visit",
  "res.agree":
    "I confirm the data above is correct and agree to be contacted by the ATMI team for reservation confirmation.",
  "res.back": "Back",
  "res.next": "Next",
  "res.submit": "Submit Registration",
  "res.submitting": "Submitting...",
  "res.err.participantsTpl": "Participants must be between {min}–{max} people",
  "res.err.date": "Pick a visit date",
  "res.dateNone": "No visit dates are open yet. Contact ATMI Marketing at +62 812 8833 1700.",
  "res.err.slot": "Choose a time session",
  "res.err.name": "Full name is required",
  "res.err.institution": "School/institution name is required",
  "res.err.email": "Invalid email address",
  "res.err.phone": "Invalid phone/WhatsApp number",
  "res.err.agree": "Check the statement to continue",
  "res.err.submit":
    "Failed to submit the reservation. Try again or contact +62 812 8833 1700.",
  "res.summary": "Reservation Summary",
  "res.summary.program": "Program",
  "res.summary.date": "Date",
  "res.summary.time": "Session",
  "res.summary.participants": "Participants",
  "res.summary.contact": "Contact",
  "res.success.title": "Successfully Registered!",
  "res.success.statusLabel": "Application Status",
  "res.success.statusValue": "Awaiting ATMI admin verification",
  "res.success.toast":
    "Submission successful — it goes straight to the ATMI admin dashboard for verification.",
  "res.success.desc":
    "Your registration was submitted successfully and goes straight to the ATMI admin dashboard. No email is sent at this stage — the registration card (PDF) is only sent automatically after the admin verifies your submission.",
  "res.success.emailLater": "The registration card (PDF) will later be sent to",
  "res.success.note":
    "Verification usually completes within 1×24 business hours. Questions? Contact ATMI Marketing at +62 812 8833 1700.",
  "res.success.again": "Back to the Form",
  "res.success.auto": "A fresh form opens automatically in {n} seconds…",
  "res.info.title": "Why make a reservation?",
  "res.info.1": "Guided directly by ATMI staff & students",
  "res.info.2": "Small group tour — maximum 30 participants",
  "res.info.3": "Free for schools and educational institutions",
  "res.info.4": "You can request a visit focus that fits your needs",
  "res.info.contact": "Need help? Contact Marketing:",

  "testi.kicker": "Testimonials",
  "testi.title": "What Those Who Grew at ATMI Say",
  "testi.subtitle":
    "Studying at ATMI is more than theory — here are real experiences of alumni now active in the industry.",
  "testi.1.quote":
    "The course materials are highly relevant and connected to the industry I joined. The key is hard work and learning by doing.",
  "testi.1.name": "Ayup Riyadi Prihantoro",
  "testi.1.role": "CEO PT Lastika Prima Teknik — ATMI Alumnus",
  "testi.2.quote":
    "My experience at ATMI helped me grow in courage, care, and discipline. I still apply what I learned here in the Czech Republic.",
  "testi.2.name": "Theo Zefanya",
  "testi.2.role": "Skoda Transportation, Czech Republic — Class of 2021",
  "testi.3.quote":
    "An education that trains students to be creative and adaptive — I still feel the benefits to this day.",
  "testi.3.name": "Agatha Evalina Christy",
  "testi.3.role": "Young Alumna of Politeknik Industri ATMI",

  "news.kicker": "Latest News",
  "news.title": "What's On at Politeknik Industri ATMI",
  "news.subtitle": "The latest news from campus activities and the academic community.",
  "news.readMore": "Read more",
  "news.1.date": "October 30, 2026",
  "news.1.tag": "News",
  "news.1.title":
    "Graduation 2026: “It’s Time to Reclaim Our Legacy and Lead the Future”",
  "news.2.date": "August 19, 2026",
  "news.2.tag": "Campus Life",
  "news.2.title":
    "Arrupe Insight Ep. 8: “Work Not with Feelings, but with Professionalism”",
  "news.3.date": "August 14, 2026",
  "news.3.tag": "Campus Life",
  "news.3.title":
    "Arrupe Insight Ep. 7: “If You Don't Aim for Something, You Won't Get Anything”",

  "loc.kicker": "Location & Contact",
  "loc.title": "Find Us at Jababeka Education Park",
  "loc.address.label": "Campus Address",
  "loc.address.value":
    "Jl. Kampus Hijau No. 3, Jababeka Education Park, Cikarang Baru, Bekasi 17520, West Java",
  "loc.contact.label": "Marketing & Information",
  "loc.hours.label": "Tour Operating Hours",
  "loc.hours.value": "Monday – Friday, 08.00 – 16.00 WIB",
  "loc.wa": "WhatsApp Chat",
  "loc.maps": "Open in Google Maps",
  "loc.follow": "Follow us",

  "footer.blurb":
    "Politeknik Industri ATMI Cikarang — a Catholic vocational campus producing outstanding industrial talent since 2003. Competentia, Conscientia, Compassio.",
  "footer.links": "Navigation",
  "footer.contact": "Contact",
  "footer.programs": "Study Programs",
  "footer.prog.1": "D3 Industrial Machinery",
  "footer.prog.2": "Applied Bachelor of Mechatronics Engineering Technology",
  "footer.prog.3": "D3 Industrial Management",
  "footer.rights":
    "© 2026 Politeknik Industri ATMI Cikarang. All Rights Reserved.",
  "footer.disclaimer":
    "Unofficial demo website inspired by the hmmifactorytour.co.id concept — created for the ATMI Campus Tour design concept.",

  "common.langLabel": "Language",
};

const dict: Record<Locale, Record<DictKey, string>> = { id, en };

type LangContextValue = {
  lang: Locale;
  setLang: (l: Locale) => void;
  t: (key: DictKey) => string;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Locale>("id");

  useEffect(() => {
    const saved = window.localStorage.getItem("atmi-lang");
    if (saved === "id" || saved === "en") {
      // Restore persisted language preference from localStorage (external system).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLangState(saved);
    }
  }, []);

  const setLang = useCallback((l: Locale) => {
    setLangState(l);
    window.localStorage.setItem("atmi-lang", l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback((key: DictKey) => dict[lang][key] ?? key, [lang]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
