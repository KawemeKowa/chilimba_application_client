'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { groups } from '@/lib/api';
import type { GroupDetail, PayoutSchedule } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users, Calendar, Coins, ArrowLeft, Copy, RefreshCw,
  MessageSquare, ArrowLeftRight, CheckSquare, Gift, List, Trash2
} from 'lucide-react';

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [schedule, setSchedule] = useState<PayoutSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    try {
      const [gRes, sRes] = await Promise.all([
        groups.get(groupId),
        groups.payoutSchedule(groupId),
      ]);
      setGroup(gRes.data);
      setSchedule(sRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [groupId]);

  const copyInvite = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRotateInvite = async () => {
    await groups.rotateInvite(groupId);
    load();
  };

  const handleRemoveMember = async (userId: string) => {
    setRemoving(userId);
    try { await groups.removeMember(groupId, userId); load(); }
    finally { setRemoving(null); }
  };

  if (loading) return <PageSpinner />;
  if (!group) return <div className="text-center py-16 text-gray-500">Group not found</div>;

  const isAdmin = group.members?.find(m => m.userId === user?.id)?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <Badge label={group.status} variant={statusVariant(group.status)} />
          </div>
          {group.description && <p className="text-gray-500 mt-1">{group.description}</p>}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { href: `/groups/${groupId}/contributions`, icon: Coins, label: 'Contributions' },
          { href: `/groups/${groupId}/withdrawals`, icon: ArrowLeftRight, label: 'Withdrawals' },
          { href: `/groups/${groupId}/committees`, icon: Gift, label: 'Committees' },
          { href: `/groups/${groupId}/messages`, icon: MessageSquare, label: 'Messages' },
          { onClick: () => setScheduleOpen(true), icon: List, label: 'Payout Schedule' },
        ].map((action, i) => (
          action.href ? (
            <Link key={i} href={action.href}>
              <div className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-teal-200 hover:shadow-sm transition-all cursor-pointer">
                <action.icon size={22} className="text-teal-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700">{action.label}</p>
              </div>
            </Link>
          ) : (
            <div key={i} onClick={action.onClick} className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:border-teal-200 hover:shadow-sm transition-all cursor-pointer">
              <action.icon size={22} className="text-teal-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">{action.label}</p>
            </div>
          )
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Group info */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Group Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">Monthly Amount</dt>
              <dd className="font-medium">ZMW {(group.monthlyAmount ?? 0).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Members</dt>
              <dd className="font-medium">{group.memberCount || group.members?.length || 0}/{group.maxMembers}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Contribution Day</dt>
              <dd className="font-medium">{group.contributionDay}th of month</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Payout Day</dt>
              <dd className="font-medium">{group.payoutDay}th of month</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Min Approvals</dt>
              <dd className="font-medium">{group.minApprovalsWithdrawal}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Currency</dt>
              <dd className="font-medium">{group.currency}</dd>
            </div>
          </dl>

          {isAdmin && group.inviteCode && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Invite Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm font-mono text-gray-800">
                  {group.inviteCode}
                </code>
                <button onClick={copyInvite} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer" title="Copy">
                  <Copy size={14} className={copied ? 'text-teal-600' : 'text-gray-500'} />
                </button>
                <button onClick={handleRotateInvite} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer" title="Rotate">
                  <RefreshCw size={14} className="text-gray-500" />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Members */}
        <Card className="lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users size={18} /> Members ({group.members?.length || 0})
          </h2>
          <div className="space-y-2">
            {group.members?.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-700 text-sm font-semibold">
                      {m.firstName?.[0]}{m.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.firstName} {m.lastName}</p>
                    <p className="text-xs text-gray-500">
                      {m.role === 'admin' ? 'Group Admin' : 'Member'} · Joined {new Date(m.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.payoutOrder && <span className="text-xs text-gray-500">#{m.payoutOrder}</span>}
                  <Badge label={m.role} variant={m.role === 'admin' ? 'info' : 'neutral'} />
                  {isAdmin && m.userId !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      disabled={removing === m.userId}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Payout schedule modal */}
      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Payout Schedule" size="lg">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {schedule.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No schedule available yet</p>
          ) : (
            schedule.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div>
                  <p className="font-medium text-gray-900">
                    Cycle {s.cycleNumber} · #{s.payoutOrder} – {s.firstName} {s.lastName}
                  </p>
                  <p className="text-gray-500">{new Date(s.scheduledDate).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">ZMW {(s.expectedAmount ?? 0).toLocaleString()}</span>
                  <Badge label={s.status} variant={statusVariant(s.status)} />
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
