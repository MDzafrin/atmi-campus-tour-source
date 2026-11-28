// Fungsi murni untuk pesan WhatsApp lewat tautan wa.me (tanpa akses database).
// Dipakai di dashboard: tombol "Kirim WA" membuka WhatsApp dengan pesan yang sudah terisi.

export type WaKind = "RECEIVED" | "VERIFIED";

/**
 * "0812-3456-7890", "+62 812 3456 7890", "62812..." -> "6281234567890".
 * Mengembalikan null kalau nomor tidak masuk akal.
 */
export function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  let d = trimmed.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (!hasPlus && d.startsWith("8")) d = "62" + d;
  if (!/^\d{9,15}$/.test(d)) return null;
  if (d.startsWith("62") && d.length < 11) return null;
  return d;
}

export interface WaReservation {
  name: string;
  code: string;
  programName: string;
  companionName?: string;
  participants: number;
  date: string; // yyyy-MM-dd
  timeSlot: string; // "09:00-11:00"
}

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const day = DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${day}, ${d} ${MONTHS[m - 1]} ${y}`;
}

function fmtSlot(slot: string): string {
  const [a, b] = slot.split("-");
  if (!a || !b) return slot;
  return `${a.replace(":", ".")} - ${b.replace(":", ".")} WIB`;
}

// Baris bantuan di akhir pesan. Ubah di sini kalau nomor atau kalimatnya berganti.
const HELP_LINE = "Butuh bantuan atau perubahan jadwal? Hubungi Marketing ATMI di 0812 8833 1700.";

function detailLines(r: WaReservation): string[] {
  return [
    `Kode reservasi: *${r.code}*`,
    `Program: ${r.programName}`,
    ...(r.companionName ? [`Pendamping: ${r.companionName}`] : []),
    `Tanggal: ${fmtDate(r.date)}`,
    `Sesi: ${fmtSlot(r.timeSlot)}`,
    `Jumlah peserta: ${r.participants} orang`,
  ];
}

/** Pesan saat pendaftaran baru masuk (belum diverifikasi admin). */
export function buildReceivedMessage(r: WaReservation): string {
  return [
    `Halo ${r.name}, terima kasih sudah mendaftar Campus Tour Politeknik Industri ATMI Cikarang.`,
    "",
    "Pendaftaran Anda sudah kami terima:",
    ...detailLines(r),
    "",
    "Tim kami akan memverifikasi pendaftaran Anda. Setelah terverifikasi, kartu reservasi dikirim ke WhatsApp ini dan ke email Anda.",
    "",
    HELP_LINE,
  ].join("\n");
}

/** Pesan setelah admin memverifikasi, berisi tautan unduh kartu. */
export function buildVerifiedMessage(r: WaReservation, cardUrl: string): string {
  return [
    `Halo ${r.name}, kabar baik! Reservasi Campus Tour Anda sudah *terverifikasi*.`,
    "",
    ...detailLines(r),
    "",
    "Unduh kartu reservasi Anda di sini:",
    cardUrl,
    "",
    "Tunjukkan kartu tersebut kepada petugas keamanan saat tiba di kampus. Mohon datang 15 menit sebelum sesi dimulai.",
    "",
    HELP_LINE,
  ].join("\n");
}
