'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { groups } from '@/lib/api';
import type { GroupDetail } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import {
  ArrowLeft, Coins, CalendarClock, ListOrdered, ShieldCheck, Lock, ScrollText,
} from 'lucide-react';

const ORDER_MODE_LABEL: Record<string, string> = {
  fixed: 'Random draw',
  random: 'Random draw',
  admin_assigned: 'Group admin chooses order',
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 dark:border-slate-700 last:border-0">
      <dt className="text-sm text-gray-500 dark:text-slate-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 dark:text-slate-100 text-right">{value}</dd>
    </div>
  );
}

export default function ConstitutionPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    groups.get(groupId).then(r => setGroup(r.data)).finally(() => setLoading(false));
  }, [groupId]);

  if (loading) return <PageSpinner />;
  if (!group) return <div className="text-center py-16 text-gray-500 dark:text-slate-400">Group not found</div>;

  const cur = group.currency ?? 'ZMW';
  const memberCount = group.memberCount || group.members?.length || 0;
  const majority = Math.max(1, Math.ceil((memberCount + 1) / 2));
  const lateFee =
    group.lateFeeType === 'fixed' ? `${cur} ${(group.lateFeeValue ?? 0).toLocaleString()}`
    : group.lateFeeType === 'percentage' ? `${group.lateFeeValue ?? 0}% of contribution`
    : 'None';
  const approvalsRequired = group.payoutApprovalMode === 'majority'
    ? (group.payoutApprovalsRequired && group.payoutApprovalsRequired > 0 ? group.payoutApprovalsRequired : majority)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-gray-600 dark:text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <ScrollText size={22} className="text-teal-600 dark:text-teal-400" /> Group Constitution
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">The rules that govern how {group.name} operates</p>
        </div>
      </div>

      {/* Locks banner */}
      {(group.scheduleLocked || group.membersLocked) && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
          <Lock size={16} />
          The first payout has occurred — the payout schedule and membership are now locked.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial rules */}
        <Card>
          <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-3">
            <Coins size={18} className="text-teal-600 dark:text-teal-400" /> Financial Rules
          </h2>
          <dl>
            <Row label="Monthly contribution" value={`${cur} ${(group.monthlyAmount ?? 0).toLocaleString()}`} />
            <Row label="Contribution day" value={`${group.contributionDay} of each month`} />
            <Row label="Grace period" value={`${group.gracePeriodDays ?? 0} day${(group.gracePeriodDays ?? 0) !== 1 ? 's' : ''}`} />
            <Row label="Late payment penalty" value={lateFee} />
            <Row label="Max members" value={group.maxMembers} />
          </dl>
        </Card>

        {/* Payout schedule */}
        <Card>
          <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-3">
            <ListOrdered size={18} className="text-teal-600 dark:text-teal-400" /> Payout Schedule
          </h2>
          <dl>
            <Row label="Payout day" value={`${group.payoutDay} of each month`} />
            <Row label="Payout order" value={ORDER_MODE_LABEL[group.payoutOrderMode ?? 'fixed'] ?? group.payoutOrderMode} />
            <Row label="Order after first payout" value={group.scheduleLocked
              ? <Badge label="Locked" variant="warning" />
              : <Badge label="Editable" variant="info" />} />
            <Row label="Membership" value={group.membersLocked
              ? <Badge label="Locked — replacement required" variant="warning" />
              : <Badge label="Open" variant="success" />} />
          </dl>
        </Card>

        {/* Contribution requirement */}
        <Card>
          <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-3">
            <CalendarClock size={18} className="text-teal-600 dark:text-teal-400" /> Payout Eligibility
          </h2>
          <dl>
            <Row label="Contribution threshold" value={`${group.contributionThresholdPercent ?? 100}% of expected pool collected`} />
            <Row label="Expected pool" value={`${cur} ${((group.monthlyAmount ?? 0) * memberCount).toLocaleString()}`} />
            <Row label="Required before payout" value={`${cur} ${(((group.monthlyAmount ?? 0) * memberCount) * ((group.contributionThresholdPercent ?? 100) / 100)).toLocaleString()}`} />
          </dl>
        </Card>

        {/* Approval rules */}
        <Card>
          <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-3">
            <ShieldCheck size={18} className="text-teal-600 dark:text-teal-400" /> Payout Approval
          </h2>
          <dl>
            <Row label="Approval mode" value={group.payoutApprovalMode === 'majority'
              ? <Badge label="Majority vote" variant="info" />
              : <Badge label="No approval" variant="neutral" />} />
            {group.payoutApprovalMode === 'majority' && (
              <Row label="Approvals required" value={`${approvalsRequired} of ${memberCount} member${memberCount !== 1 ? 's' : ''}`} />
            )}
            <Row label="Withdrawal approvals" value={group.minApprovalsWithdrawal} />
            <Row label="Failed payout" value="Manual review by an admin" />
          </dl>
        </Card>
      </div>

      <p className="text-xs text-gray-400 dark:text-slate-500 text-center">
        Every approval, rejection, payment, and payout is recorded in the group&apos;s audit log.
      </p>
    </div>
  );
}
