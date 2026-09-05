// 'use client';

// import { LayoutDashboard, Package, Users, LogOut } from 'lucide-react';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';

// const AdminSidebar = () => {
//   const pathname = usePathname();

//   const navItems = [
//     {
//       name: 'Dashboard',
//       href: '/admin/dashboard',
//       icon: LayoutDashboard,
//     },
//     {
//       name: 'Inventory',
//       href: '/admin/inventory',
//       icon: Package,
//     },
//     {
//       name: 'Staff Management',
//       href: '/admin/staffManagement',
//       icon: Users,
//     },
//   ];

//   return (
//     <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-6">
//       <div>
//         {/* Logo */}
//         <div className="flex items-center gap-3 mb-8 px-2">
//           <div className="bg-indigo-600 p-2 rounded-lg text-white">
//             <Package size={20} />
//           </div>
//           <span className="font-bold text-xl tracking-tight">StoreKeeper</span>
//         </div>

//         {/* Navigation */}
//         <nav className="space-y-1">
//           {navItems.map((item) => {
//             const Icon = item.icon;

//             // Highlights nested routes too
//             const isActive =
//               pathname === item.href || pathname.startsWith(item.href + '/');

//             return (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
//                   isActive
//                     ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-4 border-indigo-600'
//                     : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
//                 }`}
//               >
//                 <Icon size={18} />
//                 <span>{item.name}</span>
//               </Link>
//             );
//           })}
//         </nav>
//       </div>

//       {/* Logout */}
//       <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors font-medium">
//         <LogOut size={18} />
//         <span>Logout</span>
//       </button>
//     </aside>
//   );
// };

// export default AdminSidebar;

'use client';

import { useState } from 'react';
import { LayoutDashboard, Package, Users, LogOut, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const AdminSidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* ============================================
          MOBILE HEADER
          Only visible below md
      ============================================ */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-16 flex items-center px-4">
        <div className="flex items-center gap-3">
          {/* Hamburger */}
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex items-center justify-center p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle sidebar"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Package size={20} />
            </div>

            <span className="font-bold text-xl tracking-tight">
              StoreKeeper
            </span>
          </div>
        </div>
      </header>

      {/* ============================================
          MOBILE BACKDROP
          Only exists when sidebar is open
          Only below md
      ============================================ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* ============================================
          SIDEBAR
      ============================================ */}
      <aside
        className={`
          fixed
          top-0
          left-0
          bottom-0
          z-50
          w-64
          bg-white
          border-r
          border-slate-200
          flex
          flex-col
          justify-between
          p-6

          transform
          transition-transform
          duration-300
          ease-in-out

          ${isOpen ? 'translate-x-0' : '-translate-x-full'}

          md:relative
          md:translate-x-0
          md:transform-none
          md:flex
          md:shrink-0
          md:min-h-screen
        `}
      >
        {/* ============================================
            SIDEBAR CONTENT
        ============================================ */}
        <div>
          {/* Logo */}
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Package size={20} />
              </div>

              <span className="font-bold text-xl tracking-tight">
                StoreKeeper
              </span>
            </div>

            {/* Close button - mobile only */}
            <button
              type="button"
              onClick={closeSidebar}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg md:hidden"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`
                    flex
                    items-center
                    gap-3
                    px-3
                    py-2.5
                    rounded-lg
                    transition-all
                    duration-200

                    ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-4 border-indigo-600'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout */}
        <button
          type="button"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors font-medium"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
};

export default AdminSidebar;
