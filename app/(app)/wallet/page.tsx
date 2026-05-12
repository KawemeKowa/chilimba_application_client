'use client';

import { useEffect, useState } from 'react';
import { wallet } from '@/lib/api';
import type { Wallet } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { Wallet as WalletIcon, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function WalletPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wallet.list().then(r => setWallets(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const total = wallets.reduce((sum, w) => sum + w.balance, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Wallets</h1>
        <p className="text-gray-500 mt-1">View your personal and group wallet balances</p>
      </div>

      {/* Total balance card */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white">
        <p className="text-teal-100 text-sm font-medium">Total Balance</p>
        <p className="text-4xl font-bold mt-1">ZMW {total.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}</p>
        <p className="text-teal-200 text-sm mt-2">{wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map(w => (
          <Card key={w.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${w.type === 'personal' ? 'bg-teal-100' : 'bg-purple-100'}`}>
                {w.type === 'personal' ? (
                  <WalletIcon size={22} className="text-teal-600" />
                ) : (
                  <Users size={22} className="text-purple-600" />
                )}
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${w.type === 'personal' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>
                {w.type === 'personal' ? 'Personal' : 'Group'}
              </span>
            </div>
            {w.groupName && <p className="text-sm font-medium text-gray-900 mb-1">{w.groupName}</p>}
            <p className="text-2xl font-bold text-gray-900">
              {w.currency} {w.balance.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
            </p>
            <Link href={`/transactions?walletId=${w.id}`} className="mt-4 block">
              <Button variant="outline" size="sm" className="w-full">
                <TrendingUp size={14} /> View Transactions
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
