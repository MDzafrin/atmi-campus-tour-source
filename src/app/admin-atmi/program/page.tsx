import { redirect } from "next/navigation";
import { isAdminServer } from "@/lib/admin-auth";
import { DashboardShell } from "@/components/dashboard/shell";
import { ProgramsView } from "@/components/dashboard/programs-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Program Visit — Dashboard ATMI Campus Tour",
  robots: { index: false },
};

export default async function ProgramPage() {
  if (!(await isAdminServer())) redirect("/admin-atmi/login");

  return (
    <DashboardShell
      title="Program Visit"
      subtitle="Kelola program tur: nama, deskripsi (ID/EN), durasi, kapasitas, foto, dan status aktif."
    >
      <ProgramsView />
    </DashboardShell>
  );
}
