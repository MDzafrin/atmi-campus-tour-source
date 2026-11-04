import { redirect } from "next/navigation";
import { isAdminServer } from "@/lib/admin-auth";
import { DashboardShell } from "@/components/dashboard/shell";
import { ReservationsView } from "@/components/dashboard/reservations-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Data Reservasi — Dashboard ATMI Campus Tour",
  robots: { index: false },
};

export default async function DashboardPage() {
  if (!(await isAdminServer())) redirect("/admin-atmi/login");

  return (
    <DashboardShell
      title="Data Reservasi"
      subtitle="Semua pendaftar Campus Tour — kode unik bisa dihubungi tim marketing, data bisa dihapus bila dibatalkan."
    >
      <ReservationsView />
    </DashboardShell>
  );
}
