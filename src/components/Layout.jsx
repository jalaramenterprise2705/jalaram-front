import { useState } from 'react';
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import {
  FiFileText,
  FiPlusCircle,
  FiShoppingBag,
  FiUsers,
  FiBox,
  FiBarChart2,
  FiSettings,
  FiMenu,
  FiLogOut,
  FiX,
} from 'react-icons/fi';

import { cn } from '../lib/utils';
import { GlobalLoader } from './Loader';

const groups = [
  {
    title: 'Sales',
    items: [{
      to: '/sales',
      label: 'View Sales',
      icon: FiFileText,
      end: true,
    }, { to: '/sales/new', label: 'Add Sales', icon: FiPlusCircle }],
  },
  {
    title: 'Purchase',
    items: [{
      to: '/bills',
      label: 'View Bill',
      icon: FiShoppingBag,
      end: true,
    }, { to: '/bills/new', label: 'Add Bill', icon: FiPlusCircle }],
  },
  {
    title: 'Master',
    items: [
      { to: '/customers', label: 'Customers', icon: FiUsers },
      { to: '/products', label: 'Stocks / Products', icon: FiBox },
      { to: '/store', label: 'Store Details', icon: FiSettings },
    ],
  },
  {
    title: 'Reports',
    items: [{ to: '/reports', label: 'Reports', icon: FiBarChart2 }],
  },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  if (!localStorage.getItem('token')) {
    return <Navigate to="/login" replace />;
  }
  const logout = () => {
    localStorage.removeItem('token');
    nav('/login');
  };
  const menu = (
    <nav className="flex h-full flex-col gap-5 overflow-y-auto p-4">
      <div className="px-2 text-lg font-bold text-white">Jalaram Enterprise</div>
      {groups.map((g) => (
        <div key={g.title}>
          <div
            className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
          >
            {g.title}
          </div>
          {g.items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-700',
                isActive && 'bg-indigo-600 text-white hover:bg-indigo-600',
              )}
            >
              <i.icon />
              {' '}
              {i.label}
            </NavLink>
          ))}
        </div>
      ))}
      <button
        onClick={logout}
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-slate-700"
      >
        <FiLogOut />
        {' '}
        Logout
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-64">
      <GlobalLoader />
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-slate-900 lg:block"
      >
        {menu}
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-64 bg-slate-900">
            <button
              className="absolute right-3 top-4 text-white"
              onClick={() => setOpen(false)}
            >
              <FiX size={20} />
            </button>
            {menu}
          </aside>
        </div>
      )}
      <header
        className="sticky top-0 z-20 flex h-14 items-center gap-3 bg-white px-4 shadow-sm lg:hidden"
      >
        <button onClick={() => setOpen(true)}><FiMenu size={22} /></button>
        <span className="font-semibold">Jalaram Enterprise</span>
      </header>
      <main className="mx-auto max-w-6xl p-3 sm:p-6"><Outlet /></main>
    </div>
  );
}
