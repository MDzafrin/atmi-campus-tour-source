import { redirect } from "next/navigation";
import { isAdminServer } from "@/lib/admin-auth";
import { DashboardShell } from "@/components/dashboard/shell";
import { CompanionsView } from "@/components/dashboard/companions-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Pendamping — Dashboard ATMI Campus Tour",
  robots: { index: false },
};

export default async function PendampingPage() {
  if (!(await isAdminServer())) redirect("/admin-atmi/login");

  return (
    <DashboardShell
      title="Pendamping"
      subtitle="Kelola bagian pendamping (Marketing, Produksi, Recycle, dst.) dan anggotanya. Anggota nonaktif tidak muncul di formulir reservasi."
    >
      <CompanionsView />
    </DashboardShell>
  );
}
