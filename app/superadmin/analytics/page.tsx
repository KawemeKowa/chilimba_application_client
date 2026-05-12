'use client';

import { useEffect, useState } from 'react';
import { superAdmin } from '@/lib/api';
import { Card, StatCard } from '@/components/ui/Card';
import { PageSpinner } from '@/components/ui/Spinner';
import { TrendingUp, Users, Layers, Wallet } from 'lucide-react';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [userGrowth, setUserGrowth] = useState<{ month: string; count: number }[]>([]);
  const [topGroups, setTopGroups] = useState<{ name: string; volume: number; members: number }[]>([]);
  const [revenue, setRevenue] = useState<{ period: string; amount: number }[]>([]);
  const [compliance, setCompliance] = useState<{ groupName: string; rate: number }[]>([]);

  useEffect(() => {
    Promise.allSettled([
      superAdmin.analytics.userGrowth().then((r: unknown) => {
        const data = r as { data: { month: string; count: number }[] };
        setUserGrowth(data.data || []);
      }),
      superAdmin.analytics.topGroups().then((r: unknown) => {
        const data = r as { data: { name: string; volume: number; members: number }[] };
        setTopGroups(data.data || []);
      }),
      superAdmin.analytics.revenue().then((r: unknown) => {
        const data = r as { data: { period: string; amount: number }[] };
        setRevenue(data.data || []);
      }),
      superAdmin.analytics.compliance().then((r: unknown) => {
        const data = r as { data: { groupName: string; rate: number }[] };
        setCompliance(data.data || []);
      }),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-gray-500 mt-1">Deep insights into platform performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={<Users size={20} className="text-blue-600" />} label="User Growth (7d)" value={userGrowth.slice(-7).reduce((s, g) => s + (g.count || 0), 0)} iconBg="bg-blue-100" />
        <StatCard icon={<Layers size={20} className="text-purple-600" />} label="Top Groups Tracked" value={topGroups.length} iconBg="bg-purple-100" />
      </div>

      {/* User Growth */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-teal-600" /> User Growth (Monthly)
        </h2>
        {userGrowth.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No data available</p>
        ) : (
          <div className="space-y-2">
            {userGrowth.slice(-6).map((g, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-24 flex-shrink-0">{g.month || `Month ${i + 1}`}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{ width: `${Math.max(5, Math.min(100, (g.count / Math.max(...userGrowth.map(x => x.count), 1)) * 100))}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-10 text-right">{g.count}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Top Groups */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Layers size={18} className="text-purple-600" /> Top Groups by Volume
        </h2>
        {topGroups.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 px-3 text-xs text-gray-500 font-semibold uppercase">Group</th>
                  <th className="text-right py-2 px-3 text-xs text-gray-500 font-semibold uppercase">Volume</th>
                  <th className="text-right py-2 px-3 text-xs text-gray-500 font-semibold uppercase">Members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {topGroups.slice(0, 10).map((g, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium text-gray-900">{g.name}</td>
                    <td className="py-2.5 px-3 text-right text-gray-700">ZMW {(g.volume || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-gray-600">{g.members || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Revenue */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Wallet size={18} className="text-green-600" /> Revenue Breakdown
        </h2>
        {revenue.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No data available</p>
        ) : (
          <div className="space-y-2">
            {revenue.slice(-6).map((r, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">{r.period || `Period ${i + 1}`}</span>
                <span className="text-sm font-semibold text-gray-900">ZMW {(r.amount || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Compliance */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Contribution Compliance Rates</h2>
        {compliance.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No data available</p>
        ) : (
          <div className="space-y-3">
            {compliance.slice(0, 10).map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-48 flex-shrink-0 truncate">{c.groupName}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.rate >= 80 ? 'bg-green-500' : c.rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${c.rate}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-12 text-right">{c.rate}%</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
