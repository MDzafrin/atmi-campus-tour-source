// ============================================================
// Template HTML email brand ATMI
// (navy #17357f / merah #ce2029 / krem #faf7f1 / emas #c9a227)
// 1) buildAdminNotifyEmail  — notifikasi pendaftaran baru (untuk admin)
// 2) buildCardEmail         — kartu reservasi terverifikasi (untuk pendaftar)
// ============================================================

export interface AdminNotifyData {
  code: string;
  name: string;
  institution: string;
  email: string;
  phone: string;
  programName: string;
  companionName?: string;
  participants: number;
  date: string; // yyyy-MM-dd
  slot: string;
  inboxUrl: string; // tautan halaman Kotak Masuk untuk verifikasi
}

export interface CardEmailData {
  name: string;
  code: string;
  programName: string;
  companionName?: string;
  participants: number;
  date: string; // yyyy-MM-dd
  slot: string;
  cardUrl: string; // tautan unduh PDF
}

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dt = new Date(y, m - 1, d);
  return `${days[dt.getDay()]}, ${d} ${months[m - 1]} ${y}`;
};

const fmtSlot = (s: string) => `${s.replace("-", " – ")} WIB`;

const shell = (inner: string, badge = "NOTIFIKASI ADMIN") => `<!DOCTYPE html>
<html lang="id">
<body style="margin:0;padding:0;background-color:#f3f1ec;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f1ec;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(23,53,127,0.12);">
          <tr>
            <td style="background-color:#17357f;padding:26px 32px 22px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="color:#ffffff;font-size:11px;letter-spacing:3px;font-weight:bold;">POLITEKNIK INDUSTRI</div>
                    <div style="color:#ffffff;font-size:24px;font-weight:bold;">ATMI Cikarang</div>
                    <div style="color:#c9a227;font-size:12px;margin-top:4px;letter-spacing:2.5px;font-weight:bold;">CAMPUS TOUR</div>
                  </td>
                  <td align="right" valign="top">
                    <div style="background-color:#ce2029;color:#ffffff;font-size:10px;font-weight:bold;letter-spacing:1.2px;padding:7px 12px;border-radius:999px;">${badge}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr><td style="padding:28px 32px 8px;">${inner}</td></tr>
          <tr>
            <td style="background:#17357f;padding:18px 32px;text-align:center;">
              <div style="color:#ffffff;opacity:0.85;font-size:12px;">
                Politeknik Industri ATMI Cikarang &middot; Jababeka Education Park, Cikarang, Bekasi
              </div>
              <div style="color:#c9a227;font-size:11px;margin-top:4px;letter-spacing:1px;">
                Competentia &middot; Conscientia &middot; Compassio
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Baris "Pendamping" hanya muncul kalau pendaftar memilih pendamping. */
const companionRow = (name?: string): [string, string][] =>
  name ? [["Pendamping", escapeHtml(name)]] : [];

const detailTable = (rows: [string, string][]) => {
  const row = (label: string, value: string) => `
      <tr>
        <td style="padding:7px 0;border-bottom:1px solid #efe9dc;color:#6b7280;font-size:13px;width:42%;">${label}</td>
        <td align="right" style="padding:7px 0;border-bottom:1px solid #efe9dc;font-size:13px;font-weight:bold;color:#1f2937;">${value}</td>
      </tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.map(([l, v]) => row(l, v)).join("")}</table>`;
};

/** Email notifikasi pendaftaran baru — untuk ADMIN (internal, bukan untuk pendaftar). */
export function buildAdminNotifyEmail(d: AdminNotifyData): string {
  const inner = `
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 16px;margin-bottom:18px;">
      <p style="margin:0;font-size:12px;color:#17357f;line-height:1.7;">
        <strong>Email internal — khusus ADMIN ATMI.</strong><br/>
        Pendaftar <strong>belum menerima email apa pun</strong> pada tahap ini.
        Kartu reservasi (PDF) baru dikirim otomatis ke email pendaftar
        <em>setelah</em> Anda menekan tombol <strong>“Verifikasi &amp; Kirim
        Kartu”</strong> di halaman <strong>Kotak Masuk</strong>.
      </p>
    </div>

    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6;">
      Ada <strong style="color:#ce2029;">pendaftaran baru</strong> yang
      <strong>menunggu verifikasi</strong> di halaman Kotak Masuk admin:
    </p>

    <div style="background:#faf7f1;border:1px solid #e5e0d5;border-radius:12px;padding:18px 22px;margin-bottom:20px;">
      <div style="font-size:11px;letter-spacing:2.5px;color:#8a8474;font-weight:bold;margin-bottom:8px;">KODE RESERVASI</div>
      <div style="font-size:22px;font-weight:bold;color:#ce2029;letter-spacing:1.5px;font-family:Courier New,monospace;">${d.code}</div>
      <div style="margin-top:12px;">${detailTable([
        ["Pemohon", d.name],
        ["Institusi", d.institution],
        ["Program", d.programName],
        ...companionRow(d.companionName),
        ["Tanggal", fmtDate(d.date)],
        ["Sesi", fmtSlot(d.slot)],
        ["Peserta", `${d.participants} orang`],
        ["Kontak", `${d.email} · ${d.phone}`],
      ])}</div>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:6px 0 10px;">
          <a href="${d.inboxUrl}"
             style="display:inline-block;background-color:#17357f;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:15px 40px;border-radius:12px;letter-spacing:0.5px;">
            Buka Kotak Masuk &amp; Verifikasi
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:12px 0 0;font-size:12px;color:#8a8474;text-align:center;line-height:1.6;">
      Email ini hanya dikirim ke admin — pendaftar baru menerima kartu setelah
      Anda menekan Verifikasi di halaman Kotak Masuk.
    </p>`;
  return shell(inner);
}

/** Email kartu reservasi terverifikasi — untuk PENDAFTAR. */
export function buildCardEmail(d: CardEmailData): string {
  const inner = `
    <p style="margin:0 0 16px;font-size:14px;color:#4b5563;line-height:1.6;">
      Halo <strong style="color:#17357f;">${d.name}</strong>, kabar baik!
      Pendaftaran Campus Tour Anda telah <strong style="color:#1a7f37;">DIVERIFIKASI</strong>
      oleh tim ATMI. Kartu reservasi Anda siap diunduh:
    </p>

    <div style="background:#f0f9f1;border:1px solid #bbf7d0;border-radius:12px;padding:14px 20px;margin-bottom:20px;text-align:center;">
      <span style="color:#1a7f37;font-size:13px;font-weight:bold;">&#10003; STATUS: TERVERIFIKASI — SIAP KUNJUNGAN</span>
    </div>

    <div style="background:#faf7f1;border:2px solid #17357f;border-radius:12px;padding:18px 22px;margin-bottom:20px;">
      <div style="font-size:11px;letter-spacing:2.5px;color:#8a8474;font-weight:bold;text-align:center;">KODE RESERVASI</div>
      <div style="font-size:26px;font-weight:bold;color:#ce2029;letter-spacing:2px;font-family:Courier New,monospace;text-align:center;margin-top:6px;">${d.code}</div>
      <div style="margin-top:12px;">${detailTable([
        ["Program", d.programName],
        ...companionRow(d.companionName),
        ["Tanggal", fmtDate(d.date)],
        ["Sesi", fmtSlot(d.slot)],
        ["Peserta", `${d.participants} orang`],
      ])}</div>
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:6px 0 10px;">
          <a href="${d.cardUrl}"
             style="display:inline-block;background-color:#ce2029;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;padding:16px 44px;border-radius:12px;letter-spacing:0.5px;">
            &#8681; Unduh Kartu Reservasi (PDF)
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:12px 0 0;font-size:12px;color:#8a8474;text-align:center;line-height:1.6;">
      PDF juga terlampir pada email ini. Tombol tidak berfungsi? Salin tautan ini ke browser:<br/>
      <a href="${d.cardUrl}" style="color:#17357f;word-break:break-all;">${d.cardUrl}</a>
    </p>

    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-top:20px;">
      <p style="margin:0;font-size:12px;color:#92400e;line-height:1.7;">
        <strong>Penting pada hari kunjungan:</strong><br/>
        1. Cetak kartu PDF ini atau tampilkan dari HP saat tiba di gerbang kampus.<br/>
        2. Tunjukkan kepada <strong>petugas keamanan (satpam)</strong> — petugas akan
        memberi <strong>cap &amp; tanda tangan</strong> pada kotak yang tersedia di kartu.<br/>
        3. Datang 15 menit sebelum sesi dimulai.
      </p>
    </div>

    <p style="margin:20px 0 0;font-size:12px;color:#8a8474;line-height:1.6;">
      Butuh bantuan / perubahan jadwal? WhatsApp Marketing ATMI: <strong>0812 8833 1700</strong>.
    </p>`;
  return shell(inner, "TERVERIFIKASI");
}
