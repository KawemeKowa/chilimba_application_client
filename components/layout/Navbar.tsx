'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, User, ChevronDown, Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 h-16 flex items-center px-4 lg:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <Link href="/dashboard" className="flex items-center">
          <div className="bg-white rounded-lg px-2 py-1">
            <Image src="/logo.JPG" alt="Chilimba" width={110} height={38} className="h-9 w-auto object-contain" priority />
          </div>
        </Link>
      </div>

      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-slate-400">
        <Link href="/dashboard" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Dashboard</Link>
        <Link href="/wallet" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Wallets</Link>
        <Link href="/groups" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Groups</Link>
        <Link href="/transactions" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Transactions</Link>
        <Link href="/approvals" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Approvals</Link>
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <Link href="/admin" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">Admin</Link>
        )}
      </nav>

      <div className="flex items-center gap-1 ml-4">
        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <Link href="/notifications" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 relative">
          <Bell size={20} />
        </Link>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900 rounded-full flex items-center justify-center">
                <span className="text-teal-700 dark:text-teal-300 text-sm font-semibold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300 hidden sm:block">{user.firstName}</span>
              <ChevronDown size={14} className="text-gray-500 dark:text-slate-500 hidden sm:block" />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700 py-1 z-20">
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700" onClick={() => setDropdownOpen(false)}>
                    <User size={15} /> Profile
                  </Link>
                  <hr className="my-1 border-gray-100 dark:border-slate-700" />
                  <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left cursor-pointer">
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800">Log In</Link>
            <Link href="/auth/register" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
}
