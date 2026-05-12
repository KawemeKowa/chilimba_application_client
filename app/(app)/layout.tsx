'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageSpinner } from '@/components/ui/Spinner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) return <PageSpinner />;

  if (!user) {
    router.replace('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuToggle={() => setSidebarOpen(true)} />
      {user.status === 'pending_verification' && (
        <div className="bg-amber-400 text-white px-6 py-3 flex items-center justify-between">
          <div>
            <span className="font-medium">Status: </span>
            <span>Complete your identity verification to unlock all features</span>
          </div>
          <button className="bg-teal-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-teal-700 cursor-pointer">
            Complete Verification
          </button>
        </div>
      )}
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 lg:p-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
