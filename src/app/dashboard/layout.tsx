import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { DemoBanner } from "@/components/DemoBanner";
import { DataSyncProvider } from "@/components/DataSyncProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DataSyncProvider>
      <div className="flex min-h-screen bg-bg-base">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <DemoBanner />
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </div>
      </div>
    </DataSyncProvider>
  );
}
