'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { wallet, contributions, groups, notifications } from '@/lib/api';
import type { Wallet, Contribution, Group, Notification } from '@/lib/api';
import { Card, StatCard } from '@/components/ui/Card';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Wallet as WalletIcon, Users, Clock, Bell, ArrowRight, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [upcoming, setUpcoming] = useState<Contribution[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      wallet.list().then(r => setWallets(r.data)),
      contributions.upcoming().then(r => setUpcoming(r.data)),
      groups.list().then(r => setMyGroups(r.data)),
      notifications.list({ limit: '5', unreadOnly: 'true' }).then(r => setNotifs(r.data)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSpinner />;

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
  const personalWallet = wallets.find(w => w.type === 'personal');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Here&apos;s your financial overview</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<WalletIcon size={20} className="text-teal-600" />}
          label="Personal Balance"
          value={`ZMW ${(personalWallet?.balance ?? 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}`}
          iconBg="bg-teal-100"
        />
        <StatCard
          icon={<TrendingUp size={20} className="text-blue-600" />}
          label="Total Balance"
          value={`ZMW ${totalBalance.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}`}
          iconBg="bg-blue-100"
        />
        <StatCard
          icon={<Users size={20} className="text-purple-600" />}
          label="Active Groups"
          value={myGroups.filter(g => g.status === 'active').length}
          iconBg="bg-purple-100"
        />
        <StatCard
          icon={<Clock size={20} className="text-amber-600" />}
          label="Pending Dues"
          value={upcoming.length}
          iconBg="bg-amber-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming contributions */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Upcoming Contributions</h2>
            <Link href="/groups" className="text-sm text-teal-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-400 text-sm py-6 text-center">No upcoming contributions</p>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 5).map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{c.groupName || 'Group'}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Due: {new Date(c.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900 dark:text-slate-100">ZMW {(c.amount ?? 0).toLocaleString()}</span>
                    <Badge label={c.status} variant={statusVariant(c.status)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Notifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <Bell size={16} /> Notifications
            </h2>
            <Link href="/notifications" className="text-sm text-teal-600 hover:underline">
              All
            </Link>
          </div>
          {notifs.length === 0 ? (
            <p className="text-gray-500 dark:text-slate-400 text-sm py-6 text-center">No new notifications</p>
          ) : (
            <div className="space-y-3">
              {notifs.map(n => (
                <div key={n.id} className={`p-3 rounded-lg ${n.isRead ? 'bg-gray-50 dark:bg-slate-700/50' : 'bg-teal-50 dark:bg-teal-900/20 border-l-2 border-teal-500'}`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{n.title}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{n.body}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* My Groups */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-slate-100">My Groups</h2>
          <Link href="/groups">
            <Button variant="outline" size="sm">View All Groups</Button>
          </Link>
        </div>
        {myGroups.length === 0 ? (
          <div className="text-center py-8">
            <Users size={40} className="text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400">You haven&apos;t joined any groups yet</p>
            <Link href="/groups">
              <Button className="mt-4" size="sm">Explore Groups</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myGroups.slice(0, 6).map(g => (
              <Link key={g.id} href={`/groups/${g.id}`}>
                <div className="border border-gray-100 dark:border-slate-700 rounded-xl p-4 hover:border-teal-200 dark:hover:border-teal-700 hover:shadow-sm transition-all cursor-pointer bg-white dark:bg-slate-800/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users size={18} className="text-teal-600 dark:text-teal-400" />
                    </div>
                    <Badge label={g.status} variant={statusVariant(g.status)} />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-slate-100 mt-2 line-clamp-1">{g.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">ZMW {(g.monthlyAmount ?? 0).toLocaleString()}/month</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{g.memberCount || 0} members</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
