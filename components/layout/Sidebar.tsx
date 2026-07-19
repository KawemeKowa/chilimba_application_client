'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Wallet, Users, ArrowLeftRight,
  CheckSquare, Settings, X, Shield, BarChart3,
  Bell, UserCircle, TrendingUp, Banknote
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const memberLinks = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/wallet', icon: Wallet, label: 'Wallets' },
    { href: '/groups', icon: Users, label: 'Groups' },
    { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
    { href: '/approvals', icon: CheckSquare, label: 'Approvals' },
    { href: '/notifications', icon: Bell, label: 'Notifications' },
    { href: '/profile', icon: UserCircle, label: 'Profile' },
  ];

  const adminLinks = [
    { href: '/admin', icon: Shield, label: 'Admin Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/groups', icon: Users, label: 'Groups' },
    { href: '/admin/payouts', icon: Wallet, label: 'Payouts' },
    { href: '/admin/withdrawals', icon: ArrowLeftRight, label: 'Withdrawals' },
    { href: '/admin/fees', icon: Settings, label: 'Fee Config' },
  ];

  const superAdminLinks = [
    { href: '/superadmin', icon: TrendingUp, label: 'Overview' },
    { href: '/superadmin/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/superadmin/finance', icon: Banknote, label: 'Finance' },
    { href: '/superadmin/settings', icon: Settings, label: 'Settings' },
    { href: '/superadmin/admins', icon: Shield, label: 'Admins' },
    { href: '/superadmin/audit', icon: CheckSquare, label: 'Audit Logs' },
  ];

  const NavLink = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
    return (
      <Link
        href={href}
        onClick={onClose}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-teal-600 text-white'
            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100'
        }`}
      >
        <Icon size={18} />
        {label}
      </Link>
    );
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 z-40 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:static lg:h-auto`}
      >
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-gray-100 dark:border-slate-700">
          <span className="font-bold text-teal-600">CHILIMBA</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer text-gray-600 dark:text-slate-400">
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {memberLinks.map(link => <NavLink key={link.href} {...link} />)}

          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <>
              <div className="pt-4 pb-1">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-3">Admin</p>
              </div>
              {adminLinks.map(link => <NavLink key={link.href} {...link} />)}
            </>
          )}

          {user?.role === 'super_admin' && (
            <>
              <div className="pt-4 pb-1">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider px-3">Super Admin</p>
              </div>
              {superAdminLinks.map(link => <NavLink key={link.href} {...link} />)}
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
