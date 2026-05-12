'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, User, ChevronDown, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface NavbarProps {
  onMenuToggle?: () => void;
}

export function Navbar({ onMenuToggle }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600 cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">C</span>
          </div>
          <span className="text-teal-600 font-bold text-lg hidden sm:block">CHILIMBA</span>
        </Link>
      </div>

      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-gray-600">
        <Link href="/dashboard" className="hover:text-teal-600 transition-colors">Dashboard</Link>
        <Link href="/wallet" className="hover:text-teal-600 transition-colors">Wallets</Link>
        <Link href="/groups" className="hover:text-teal-600 transition-colors">Groups</Link>
        <Link href="/transactions" className="hover:text-teal-600 transition-colors">Transactions</Link>
        <Link href="/approvals" className="hover:text-teal-600 transition-colors">Approvals</Link>
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <Link href="/admin" className="hover:text-teal-600 transition-colors">Admin</Link>
        )}
      </nav>

      <div className="flex items-center gap-2 ml-4">
        <Link href="/notifications" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 relative">
          <Bell size={20} />
        </Link>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                <span className="text-teal-700 text-sm font-semibold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.firstName}</span>
              <ChevronDown size={14} className="text-gray-500 hidden sm:block" />
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                    <User size={15} /> Profile
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left cursor-pointer">
                    <LogOut size={15} /> Logout
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Log In</Link>
            <Link href="/auth/register" className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
}
