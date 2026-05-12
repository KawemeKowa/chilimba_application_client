'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { admin } from '@/lib/api';
import type { PayoutSchedule } from '@/lib/api';
import { Card, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { Users, Wallet, ArrowLeftRight, Settings, CheckCircle, ArrowRight } from 'lucide-react';

export default function AdminDashboard() {
  const [pendingPayouts, setPendingPayouts] = useState<PayoutSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [disbursing, setDisbursing] = useState<string | null>(null);

  useEffect(() => {
    admin.payouts.pending().then(r => setPendingPayouts(r.data)).finally(() => setLoading(false));
  }, []);

  const disburse = async (id: string) => {
    if (!id) return;
    setDisbursing(id);
    try {
      await admin.payouts.disburse(id);
      const r = await admin.payouts.pending();
      setPendingPayouts(r.data);
    } finally {
      setDisbursing(null);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage users, groups, and platform operations</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} className="text-blue-600" />} label="Manage Users" value="View →" iconBg="bg-blue-100" />
        <StatCard icon={<Users size={20} className="text-purple-600" />} label="Manage Groups" value="View →" iconBg="bg-purple-100" />
        <StatCard icon={<Wallet size={20} className="text-teal-600" />} label="Pending Payouts" value={pendingPayouts.length} iconBg="bg-teal-100" />
        <StatCard icon={<Settings size={20} className="text-amber-600" />} label="Fee Config" value="Configure →" iconBg="bg-amber-100" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/admin/users', label: 'Users', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
          { href: '/admin/groups', label: 'Groups', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
          { href: '/admin/withdrawals', label: 'Withdrawals', icon: ArrowLeftRight, color: 'text-orange-600', bg: 'bg-orange-100' },
          { href: '/admin/fees', label: 'Fees', icon: Settings, color: 'text-teal-600', bg: 'bg-teal-100' },
        ].map(l => (
          <Link key={l.href} href={l.href}>
            <div className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-teal-200 hover:shadow-sm transition-all cursor-pointer">
              <div className={`${l.bg} w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <l.icon size={20} className={l.color} />
              </div>
              <p className="text-sm font-medium text-gray-700">{l.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Pending payouts */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Pending Payouts</h2>
          <Link href="/admin/payouts">
            <Button variant="ghost" size="sm">View all <ArrowRight size={14} /></Button>
          </Link>
        </div>
        {pendingPayouts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
            <p className="text-gray-500">No pending payouts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingPayouts.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.firstName} {p.lastName}</p>
                  <p className="text-xs text-gray-500">Cycle {p.cycleNumber} · {new Date(p.scheduledDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">ZMW {p.expectedAmount.toLocaleString()}</span>
                  <Badge label={p.status} variant={statusVariant(p.status)} />
                  <Button size="sm" loading={disbursing === String(i)} onClick={() => disburse(String(i))}>
                    Disburse
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
