'use client';

import { LayoutDashboard, Package, Users, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const AdminSidebar = () => {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Inventory',
      href: '/admin/inventory',
      icon: Package,
    },
    {
      name: 'Staff Management',
      href: '/admin/staffManagement',
      icon: Users,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-6">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <Package size={20} />
          </div>
          <span className="font-bold text-xl tracking-tight">StoreKeeper</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            // Highlights nested routes too
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-4 border-indigo-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout */}
      <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors font-medium">
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default AdminSidebar;
