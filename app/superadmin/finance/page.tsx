'use client';

import { useEffect, useState } from 'react';
import { superAdmin } from '@/lib/api';
import type { FinanceOverview, LipilaTransaction } from '@/lib/api';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import {
  Wallet, TrendingUp, TrendingDown, Clock,
  CheckCircle, XCircle, AlertTriangle, RefreshCw, Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

function statusBadge(status: string) {
  if (status === 'successful') return <Badge label="Successful" variant="success" />;
  if (status === 'failed')     return <Badge label="Failed"     variant="danger"  />;
  return                              <Badge label="Pending"    variant="warning" />;
}

function statusIcon(status: string) {
  if (status === 'successful') return <CheckCircle size={16} className="text-green-500" />;
  if (status === 'failed')     return <XCircle     size={16} className="text-red-500"   />;
  return                              <Clock       size={16} className="text-amber-500" />;
}

export default function FinancePage() {
  const [data, setData]       = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await superAdmin.finance();
      setData(res.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <PageSpinner />;
  if (!data)   return <div className="text-center py-16 text-gray-500">Failed to load finance data</div>;

  const { summary, groupFunds, recentPayouts, recentDeposits } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Overview</h1>
          <p className="text-gray-500 mt-1">Lipila wallet, group funds, and payout trail</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => load(true)} loading={refreshing}>
          <RefreshCw size={14} /> Refresh
        </Button>
      </div>

      {/* Live Lipila wallet balance */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-indigo-200 text-sm font-medium">Lipila Wallet Balance (Live)</p>
            {data.lipilaBalanceError ? (
              <div className="flex items-center gap-2 mt-2">
                <AlertTriangle size={20} className="text-amber-300" />
                <span className="text-lg text-amber-200">Unable to fetch — check API key</span>
              </div>
            ) : (
              <p className="text-4xl font-bold mt-1">
                ZMW {(data.lipilaWalletBalance ?? 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          <div className="p-3 bg-white/10 rounded-xl">
            <Wallet size={28} className="text-white" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-indigo-200 text-sm">
            Platform virtual balance: <span className="text-white font-semibold">
              ZMW {data.totalVirtualBalance.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
            </span>
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp size={20} className="text-green-600" />}
          label="Total Deposits"
          value={`ZMW ${Number(summary.deposits_total).toLocaleString()}`}
          iconBg="bg-green-100"
        />
        <StatCard
          icon={<TrendingDown size={20} className="text-blue-600" />}
          label="Total Payouts"
          value={`ZMW ${Number(summary.payouts_total).toLocaleString()}`}
          iconBg="bg-blue-100"
        />
        <StatCard
          icon={<CheckCircle size={20} className="text-teal-600" />}
          label="Successful Txns"
          value={Number(summary.deposits_count) + Number(summary.payouts_count)}
          iconBg="bg-teal-100"
        />
        <StatCard
          icon={<Clock size={20} className="text-amber-600" />}
          label="Pending"
          value={Number(summary.pending_count)}
          iconBg="bg-amber-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Group fund breakdown */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={18} /> Group Fund Breakdown
          </h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {groupFunds.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No active groups</p>
            ) : groupFunds.map(g => (
              <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-gray-900">{g.name}</p>
                  <p className="text-xs text-gray-500">{g.member_count} members</p>
                </div>
                <span className="font-semibold text-gray-900">
                  {g.currency} {Number(g.group_balance).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent deposits */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} /> Recent Deposits
          </h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentDeposits.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No deposits yet</p>
            ) : recentDeposits.map(t => (
              <TransactionRow key={t.id} t={t} />
            ))}
          </div>
        </Card>
      </div>

      {/* Payout trail */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingDown size={18} /> Payout Trail
        </h2>
        {recentPayouts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No payouts recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="pb-3 pr-4">Recipient</th>
                  <th className="pb-3 pr-4">Group</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3 pr-4">Mobile</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentPayouts.map(t => (
                  <tr key={t.id} className="py-2">
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      {t.firstName} {t.lastName}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{t.groupName || '—'}</td>
                    <td className="py-3 pr-4 font-semibold">
                      ZMW {Number(t.amount).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{t.accountNumber || '—'}</td>
                    <td className="py-3 pr-4">{statusBadge(t.status)}</td>
                    <td className="py-3 text-gray-500 text-xs">
                      {new Date(t.createdAt).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function TransactionRow({ t }: { t: LipilaTransaction }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
      <div className="flex items-center gap-3">
        {t.status === 'successful'
          ? <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
          : t.status === 'failed'
          ? <XCircle size={14} className="text-red-500 flex-shrink-0" />
          : <Clock size={14} className="text-amber-500 flex-shrink-0" />}
        <div>
          <p className="font-medium text-gray-900">{t.firstName} {t.lastName}</p>
          <p className="text-xs text-gray-500">
            {t.accountNumber} · {new Date(t.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">ZMW {Number(t.amount).toLocaleString()}</p>
        <p className="text-xs text-gray-500">{t.paymentType || 'MoMo'}</p>
      </div>
    </div>
  );
}
