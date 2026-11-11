// ============================================================
// Generator PDF "Kartu Reservasi — Bukti Verifikasi"
// Dibuat dengan pdf-lib (font standar WinAnsi — hindari glyph non-Latin1).
// Warna brand: navy #17357f / merah #ce2029 / krem #faf7f1 / emas #c9a227
// ============================================================
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface CardPdfData {
  code: string;
  name: string;
  institution: string;
  email: string;
  phone: string;
  programName: string;
  companionName?: string;
  participants: number;
  date: string; // yyyy-MM-dd
  slot: string; // "09:00-11:00"
  verifiedAt: Date;
}

const NAVY = rgb(0x17 / 255, 0x35 / 255, 0x7f / 255);
const NAVY_DARK = rgb(0x0f / 255, 0x24 / 255, 0x5a / 255);
const RED = rgb(0xce / 255, 0x20 / 255, 0x29 / 255);
const CREAM = rgb(0xfa / 255, 0xf7 / 255, 0xf1 / 255);
const GOLD = rgb(0xc9 / 255, 0xa2 / 255, 0x27 / 255);
const GREEN = rgb(0x1a / 255, 0x7f / 255, 0x37 / 255);
const GRAY = rgb(0x6b / 255, 0x72 / 255, 0x80 / 255);
const DARK = rgb(0x1f / 255, 0x29 / 255, 0x37 / 255);
const LIGHT_LINE = rgb(0xe5 / 255, 0xe0 / 255, 0xd5 / 255);
const WHITE = rgb(1, 1, 1);

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const dt = new Date(y, m - 1, d);
  return `${DAYS[dt.getDay()]}, ${d} ${MONTHS[m - 1]} ${y}`;
}

function fmtDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())} WIB`;
}

/** Font standar PDF hanya mengenal karakter Latin-1; karakter lain diganti "?" agar PDF tidak gagal dibuat. */
const latin1 = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

/** Efek letter-spacing manual: sisipkan spasi antar karakter. */
const track = (s: string) => s.split("").join(" ");

export async function buildReservationCardPdf(d: CardPdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Kartu Reservasi Campus Tour ATMI — ${d.code}`);
  pdf.setAuthor("Politeknik Industri ATMI Cikarang");

  const page = pdf.addPage([595.28, 841.89]); // A4
  const W = 595.28;
  const M = 40; // margin

  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdf.embedFont(StandardFonts.Helvetica);
  const mono = await pdf.embedFont(StandardFonts.CourierBold);

  let y = 841.89;

  // ===== Header navy =====
  const headerH = 108;
  y -= headerH;
  page.drawRectangle({ x: 0, y, width: W, height: headerH, color: NAVY });
  page.drawRectangle({ x: 0, y, width: W, height: 4, color: GOLD });

  page.drawText(track("POLITEKNIK INDUSTRI"), {
    x: M, y: y + headerH - 30, size: 10, font: bold,
    color: rgb(0.85, 0.88, 1),
  });
  page.drawText("ATMI Cikarang", {
    x: M, y: y + headerH - 54, size: 24, font: bold, color: WHITE,
  });
  page.drawText(track("CAMPUS TOUR"), {
    x: M, y: y + headerH - 74, size: 12, font: bold,
    color: GOLD,
  });

  // Badge merah kanan
  const badgeW = 150;
  page.drawRectangle({
    x: W - M - badgeW, y: y + headerH - 52, width: badgeW, height: 30, color: RED,
  });
  const badgeText = "KARTU RESERVASI";
  const bw = bold.widthOfTextAtSize(badgeText, 10.5);
  page.drawText(badgeText, {
    x: W - M - badgeW + (badgeW - bw) / 2, y: y + headerH - 42,
    size: 10.5, font: bold, color: WHITE,
  });

  // ===== Strip pengingat =====
  y -= 26;
  page.drawRectangle({ x: 0, y, width: W, height: 26, color: CREAM });
  const strip = "BUKTI VERIFIKASI RESERVASI - WAJIB DIBAWA (CETAK / LAYAR HP) SAAT KUNJUNGAN";
  const sw = reg.widthOfTextAtSize(strip, 8.5);
  page.drawText(strip, { x: (W - sw) / 2, y: y + 9, size: 8.5, font: bold, color: NAVY });

  // ===== Status terverifikasi =====
  y -= 52;
  page.drawRectangle({ x: M, y, width: W - 2 * M, height: 38, color: rgb(0.9, 0.96, 0.91) });
  page.drawRectangle({ x: M, y, width: 5, height: 38, color: GREEN });
  page.drawText("TERVERIFIKASI", { x: M + 16, y: y + 21, size: 13, font: bold, color: GREEN });
  page.drawText(`Disetujui tim ATMI pada ${fmtDateTime(d.verifiedAt)}`, {
    x: M + 16, y: y + 7, size: 8.5, font: reg, color: GRAY,
  });

  // ===== Kode reservasi =====
  y -= 64;
  page.drawText(track("KODE RESERVASI"), {
    x: M, y: y + 26, size: 9, font: bold, color: GRAY,
  });
  page.drawText(d.code, { x: M, y, size: 30, font: mono, color: RED });
  const codeW = mono.widthOfTextAtSize(d.code, 30);
  page.drawText("(simpan / tangkap layar kode ini)", {
    x: M + codeW + 12, y: y + 8, size: 8.5, font: reg, color: GRAY,
  });

  // ===== Detail kunjungan =====
  y -= 22;
  page.drawText(track("DETAIL KUNJUNGAN"), {
    x: M, y, size: 9, font: bold, color: NAVY,
  });
  y -= 14;

  const rows: [string, string][] = [
    ["Program", d.programName],
    ...(d.companionName ? [["Pendamping", latin1(d.companionName)] as [string, string]] : []),
    ["Tanggal Kunjungan", fmtDate(d.date)],
    ["Sesi", `${d.slot.replace("-", " - ")} WIB`],
    ["Jumlah Peserta", `${d.participants} orang`],
    ["Pemohon", d.name],
    ["Institusi / Sekolah", d.institution],
    ["Email", d.email],
    ["No. HP / WhatsApp", d.phone],
  ];
  for (const [label, value] of rows) {
    y -= 26;
    page.drawLine({
      start: { x: M, y: y + 20 }, end: { x: W - M, y: y + 20 },
      thickness: 0.7, color: LIGHT_LINE,
    });
    page.drawText(label, { x: M, y, size: 10, font: reg, color: GRAY });
    page.drawText(value, {
      x: W - M - bold.widthOfTextAtSize(value, 10), y, size: 10, font: bold, color: DARK,
    });
  }

  // ===== Kotak cap & tanda tangan satpam =====
  y -= 34;
  page.drawText(track("UNTUK PETUGAS KEAMANAN (SATPAM) PADA HARI KUNJUNGAN"), {
    x: M, y, size: 9, font: bold, color: NAVY,
  });

  y -= 16;
  const boxH = 150;
  page.drawRectangle({
    x: M, y: y - boxH, width: W - 2 * M, height: boxH,
    borderColor: NAVY, borderWidth: 1.5, color: WHITE,
  });

  // Kolom kiri: isian petugas
  const inner = M + 18;
  let sy = y - 30;
  page.drawText("Nama Petugas Penerima:", { x: inner, y: sy, size: 9.5, font: bold, color: DARK });
  page.drawLine({
    start: { x: inner + 150, y: sy - 2 }, end: { x: W - M - 170, y: sy - 2 },
    thickness: 0.8, color: GRAY,
  });
  sy -= 26;
  page.drawText("Instansi / Sekolah Pengantar:", { x: inner, y: sy, size: 9.5, font: bold, color: DARK });
  page.drawLine({
    start: { x: inner + 150, y: sy - 2 }, end: { x: W - M - 170, y: sy - 2 },
    thickness: 0.8, color: GRAY,
  });
  sy -= 26;
  page.drawText("Jumlah peserta hadir:", { x: inner, y: sy, size: 9.5, font: bold, color: DARK });
  page.drawText("................... orang", {
    x: inner + 150, y: sy, size: 9.5, font: reg, color: GRAY,
  });
  sy -= 26;
  page.drawText("Keterangan (bila ada):", { x: inner, y: sy, size: 9.5, font: bold, color: DARK });
  page.drawLine({
    start: { x: inner + 150, y: sy - 2 }, end: { x: W - M - 170, y: sy - 2 },
    thickness: 0.8, color: GRAY,
  });

  // Kotak kanan: cap & tanda tangan
  const signW = 140;
  const signX = W - M - signW - 14;
  page.drawRectangle({
    x: signX, y: y - boxH + 14, width: signW, height: boxH - 28,
    borderColor: GOLD, borderWidth: 1.2, color: CREAM,
  });
  const capLabel1 = "CAP / STEMPEL &";
  const capLabel2 = "TANDA TANGAN";
  page.drawText(capLabel1, {
    x: signX + (signW - bold.widthOfTextAtSize(capLabel1, 9)) / 2, y: y - 38,
    size: 9, font: bold, color: GRAY,
  });
  page.drawText(capLabel2, {
    x: signX + (signW - bold.widthOfTextAtSize(capLabel2, 9)) / 2, y: y - 50,
    size: 9, font: bold, color: GRAY,
  });

  // Catatan bawah kotak
  page.drawText(
    "Petugas diminta memverifikasi kehadiran rombongan, memberi cap & tanda tangan pada kotak di atas.",
    { x: M, y: y - boxH - 14, size: 8, font: reg, color: GRAY },
  );

  // ===== Footer =====
  const footH = 64;
  page.drawRectangle({ x: 0, y: 0, width: W, height: footH, color: NAVY_DARK });
  page.drawText("Politeknik Industri ATMI Cikarang - Jababeka Education Park, Cikarang Baru, Bekasi 17520", {
    x: (W - reg.widthOfTextAtSize("Politeknik Industri ATMI Cikarang - Jababeka Education Park, Cikarang Baru, Bekasi 17520", 9)) / 2,
    y: 34, size: 9, font: reg, color: rgb(0.85, 0.88, 1),
  });
  page.drawText("Competentia  |  Conscientia  |  Compassio", {
    x: (W - bold.widthOfTextAtSize("Competentia  |  Conscientia  |  Compassio", 9)) / 2,
    y: 18, size: 9, font: bold, color: GOLD,
  });

  return pdf.save();
}
