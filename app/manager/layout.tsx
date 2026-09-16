import React from 'react';
import ManagerSidebar from '@/components/ManagerSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        {/* ================= SIDEBAR ================= */}
        <ManagerSidebar />

        {/* ================= MAIN AREA ================= */}
        <div className="flex-1 min-w-0">
          <main className="pt-8 md:pt-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
