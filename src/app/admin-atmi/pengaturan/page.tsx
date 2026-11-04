import { redirect } from "next/navigation";
import { isAdminServer } from "@/lib/admin-auth";
import { DashboardShell } from "@/components/dashboard/shell";
import { SettingsView } from "@/components/dashboard/settings-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pengaturan Formulir — Dashboard ATMI Campus Tour",
  robots: { index: false },
};

export default async function PengaturanPage() {
  if (!(await isAdminServer())) redirect("/admin-atmi/login");

  return (
    <DashboardShell
      title="Pengaturan Formulir Reservasi"
      subtitle="Atur jumlah peserta, durasi visit, sesi waktu, dan tanggal yang dibuka untuk kunjungan."
    >
      <SettingsView />
    </DashboardShell>
  );
}
