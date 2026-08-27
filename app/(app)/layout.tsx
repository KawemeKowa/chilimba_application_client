'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { PageSpinner } from '@/components/ui/Spinner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [loading, user, router]);

  if (loading || !user) return <PageSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar onMenuToggle={() => setSidebarOpen(true)} />
      {!user.idVerified && (
        <div className="bg-amber-400 dark:bg-amber-600 text-white px-6 py-3 flex items-center justify-between">
          <div className="min-w-0">
            {user.kycSubmittedAt && !user.kycRejectionReason ? (
              <span>Your identity documents are <span className="font-medium">under review</span>. We&apos;ll notify you once approved.</span>
            ) : user.kycRejectionReason ? (
              <span>Your identity verification was <span className="font-medium">rejected</span>. Please resubmit your documents.</span>
            ) : (
              <span><span className="font-medium">Verify your identity</span> to activate your account — upload your national ID on your profile.</span>
            )}
          </div>
          <button
            onClick={() => router.push('/profile')}
            className="bg-teal-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-teal-700 cursor-pointer shrink-0 ml-4"
          >
            {user.kycSubmittedAt && !user.kycRejectionReason ? 'View Profile' : 'Verify Now'}
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
