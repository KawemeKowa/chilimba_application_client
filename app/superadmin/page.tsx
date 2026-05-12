'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { superAdmin } from '@/lib/api';
import type { AnalyticsOverview, HealthStatus } from '@/lib/api';
import { Card, StatCard } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import {
  Users, Layers, TrendingUp, Wallet, BarChart3,
  Settings, Shield, FileText, Activity, AlertTriangle
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      superAdmin.analytics.overview().then(r => setOverview(r.data)),
      superAdmin.health().then(r => setHealth(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-500 mt-1">Complete platform analytics and management</p>
      </div>

      {/* Health status */}
      {health && (
        <div className={`rounded-xl p-4 flex items-center gap-3 ${health.status === 'healthy' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <Activity size={20} className={health.status === 'healthy' ? 'text-green-600' : 'text-red-600'} />
          <div>
            <p className={`font-medium ${health.status === 'healthy' ? 'text-green-800' : 'text-red-800'}`}>
              Platform {health.status === 'healthy' ? 'Healthy' : 'Issues Detected'}
            </p>
            <p className="text-sm text-gray-600">
              DB: {health.database.connected ? 'Connected' : 'Disconnected'} ·
              {health.alerts.pendingPayouts} pending payouts ·
              {health.alerts.pendingKycVerifications} KYC verifications ·
              {health.alerts.expiredWithdrawals} expired withdrawals
            </p>
          </div>
        </div>
      )}

      {/* User stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Users</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Users size={20} className="text-blue-600" />} label="Total Users" value={overview?.users.total ?? 0} iconBg="bg-blue-100" />
          <StatCard icon={<Users size={20} className="text-green-600" />} label="Active Users" value={overview?.users.active ?? 0} iconBg="bg-green-100" />
          <StatCard icon={<Shield size={20} className="text-amber-600" />} label="Pending KYC" value={overview?.users.pending_verification ?? 0} iconBg="bg-amber-100" />
          <StatCard icon={<TrendingUp size={20} className="text-purple-600" />} label="Today's Signups" value={overview?.users.registered_today ?? 0} iconBg="bg-purple-100" />
        </div>
      </div>

      {/* Group stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Groups</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={<Layers size={20} className="text-teal-600" />} label="Total Groups" value={overview?.groups.total ?? 0} iconBg="bg-teal-100" />
          <StatCard icon={<Layers size={20} className="text-green-600" />} label="Active Groups" value={overview?.groups.active ?? 0} iconBg="bg-green-100" />
          <StatCard icon={<Wallet size={20} className="text-blue-600" />} label="Avg Monthly" value={`ZMW ${(overview?.groups.avg_monthly_amount ?? 0).toLocaleString()}`} iconBg="bg-blue-100" />
        </div>
      </div>

      {/* Transaction stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Transactions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={<TrendingUp size={20} className="text-teal-600" />} label="Total Volume" value={`ZMW ${Number(overview?.transactions.total_volume ?? 0).toLocaleString()}`} iconBg="bg-teal-100" />
          <StatCard icon={<Wallet size={20} className="text-green-600" />} label="Fee Revenue" value={`ZMW ${Number(overview?.transactions.fee_revenue ?? 0).toLocaleString()}`} iconBg="bg-green-100" />
          <StatCard icon={<Activity size={20} className="text-blue-600" />} label="Txns Today" value={overview?.transactions.txns_today ?? 0} iconBg="bg-blue-100" />
        </div>
      </div>

      {/* Alerts */}
      {health && (health.alerts.pendingPayouts > 0 || health.alerts.failedTransactions24h > 0 || health.alerts.expiredWithdrawals > 0) && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Active Alerts
          </h2>
          <div className="space-y-2">
            {health.alerts.pendingPayouts > 0 && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-sm text-amber-800">{health.alerts.pendingPayouts} pending payouts need disbursement</span>
                <Link href="/admin/payouts" className="text-sm font-medium text-amber-700 hover:underline">Review →</Link>
              </div>
            )}
            {health.alerts.failedTransactions24h > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-red-800">{health.alerts.failedTransactions24h} failed transactions in last 24h</span>
              </div>
            )}
            {health.alerts.expiredWithdrawals > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-orange-800">{health.alerts.expiredWithdrawals} expired withdrawal requests</span>
                <Link href="/admin/withdrawals" className="text-sm font-medium text-orange-700 hover:underline">Review →</Link>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Quick links */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/superadmin/analytics', icon: BarChart3, label: 'Analytics', color: 'text-blue-600', bg: 'bg-blue-100' },
            { href: '/superadmin/settings', icon: Settings, label: 'Settings', color: 'text-teal-600', bg: 'bg-teal-100' },
            { href: '/superadmin/admins', icon: Shield, label: 'Admins', color: 'text-purple-600', bg: 'bg-purple-100' },
            { href: '/superadmin/audit', icon: FileText, label: 'Audit Logs', color: 'text-gray-600', bg: 'bg-gray-100' },
          ].map(l => (
            <Link key={l.href} href={l.href}>
              <div className="border border-gray-100 rounded-xl p-4 text-center hover:border-teal-200 hover:shadow-sm transition-all cursor-pointer">
                <div className={`${l.bg} w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <l.icon size={20} className={l.color} />
                </div>
                <p className="text-sm font-medium text-gray-700">{l.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
