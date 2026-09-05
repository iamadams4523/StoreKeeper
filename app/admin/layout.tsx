import React from 'react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        {/* ================= SIDEBAR ================= */}
        <AdminSidebar />

        {/* ================= MAIN AREA ================= */}
        <div className="flex-1 min-w-0">
          {/* 
            Mobile spacing:
            The mobile StoreKeeper header is fixed at 64px,
            so we add top padding below md.
          */}
          <main className="pt-16 md:pt-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
