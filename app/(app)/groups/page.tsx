'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { groups } from '@/lib/api';
import type { Group } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { Users, Plus, LogIn, ArrowRight, Calendar, Coins } from 'lucide-react';

export default function GroupsPage() {
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  // Constitution fields that drive conditional inputs / helpers
  const [maxMembers, setMaxMembers] = useState('12');
  const [lateFeeType, setLateFeeType] = useState<'none' | 'fixed' | 'percentage'>('none');
  const [approvalMode, setApprovalMode] = useState<'none' | 'majority'>('majority');
  // Majority size (2→2, 3→2, 4→3, 5→3, 6→4 …) for the approvals helper text
  const recommendedApprovals = Math.max(1, Math.ceil((Number(maxMembers || 0) + 1) / 2));

  const load = () =>
    groups.list().then(r => setMyGroups(r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    try {
      await groups.create(fd);
      setCreateOpen(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    setError('');
    try {
      await groups.join(inviteCode);
      setJoinOpen(false);
      setInviteCode('');
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
          <p className="text-gray-500 mt-1">Manage your Chilimba savings groups</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setError(''); setJoinOpen(true); }}>
            <LogIn size={16} /> Join Group
          </Button>
          <Button onClick={() => { setError(''); setCreateOpen(true); }}>
            <Plus size={16} /> Create Group
          </Button>
        </div>
      </div>

      {myGroups.length === 0 ? (
        <Card className="text-center py-16">
          <Users size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No groups yet</h3>
          <p className="text-gray-500 mt-2 mb-6">Create a new group or join one with an invite code</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setJoinOpen(true)}><LogIn size={16} /> Join Group</Button>
            <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> Create Group</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myGroups.map(g => (
            <div key={g.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users size={22} className="text-teal-600" />
                  </div>
                  <Badge label={g.status} variant={statusVariant(g.status)} />
                </div>
                <h3 className="font-semibold text-gray-900 mt-3">{g.name}</h3>
                {g.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{g.description}</p>}

                <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Coins size={14} className="text-teal-500" />
                    <span>ZMW {(g.monthlyAmount ?? 0).toLocaleString()}/mo</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Users size={14} className="text-teal-500" />
                    <span>{g.memberCount || 0}/{g.maxMembers}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Calendar size={14} className="text-teal-500" />
                    <span>Contributes: {g.contributionDay}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Calendar size={14} className="text-teal-500" />
                    <span>Payout: {g.payoutDay}</span>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5">
                <Link href={`/groups/${g.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Group <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal — the group constitution */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Group" size="lg">
        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 p-3 rounded-lg">{error}</p>}
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
          These rules form your group&apos;s constitution — they govern how contributions, payouts, and approvals work. Members can view them anytime.
        </p>
        <form onSubmit={handleCreate} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          <Input label="Group name" name="name" placeholder="Lusaka North Chilimba" required />
          <Textarea label="Description (optional)" name="description" placeholder="What is this group for?" />

          {/* Section 1 — Financial rules */}
          <fieldset className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <legend className="px-2 text-sm font-semibold text-gray-700 dark:text-slate-200">1. Financial Rules</legend>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Monthly contribution" name="monthlyAmount" type="number" min="1" step="0.01" placeholder="500" required />
                <Select label="Currency" name="currency" defaultValue="ZMW">
                  <option value="ZMW">ZMW – Zambian Kwacha</option>
                  <option value="USD">USD – US Dollar</option>
                  <option value="EUR">EUR – Euro</option>
                  <option value="GBP">GBP – British Pound</option>
                  <option value="ZAR">ZAR – South African Rand</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Max members" name="maxMembers" type="number" min="2" max="5000"
                  value={maxMembers} onChange={e => setMaxMembers(e.target.value)} required />
                <Input label="Grace period (days after due)" name="gracePeriodDays" type="number" min="0" max="60" placeholder="5" defaultValue="5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Contribution day" name="contributionDay" type="number" min="1" max="28" placeholder="1" defaultValue="1" required />
                <Input label="Payout day" name="payoutDay" type="number" min="1" max="28" placeholder="25" defaultValue="25" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Late payment penalty" name="lateFeeType" value={lateFeeType}
                  onChange={e => setLateFeeType(e.target.value as 'none' | 'fixed' | 'percentage')}>
                  <option value="none">None</option>
                  <option value="fixed">Fixed amount</option>
                  <option value="percentage">Percentage of contribution</option>
                </Select>
                {lateFeeType !== 'none' && (
                  <Input
                    label={lateFeeType === 'fixed' ? 'Late fee amount' : 'Late fee (%)'}
                    name="lateFeeValue" type="number" min="0" step="0.01"
                    placeholder={lateFeeType === 'fixed' ? '10' : '5'} required
                  />
                )}
              </div>
            </div>
          </fieldset>

          {/* Section 2 — Payout schedule */}
          <fieldset className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <legend className="px-2 text-sm font-semibold text-gray-700 dark:text-slate-200">2. Payout Schedule</legend>
            <div className="space-y-3">
              <Select label="Payout order" name="payoutOrderMode" defaultValue="fixed">
                <option value="fixed">Fixed order — set the sequence yourself</option>
                <option value="random">Random draw — assigned before the first cycle</option>
                <option value="admin_assigned">Admin assigned — creator chooses the order</option>
              </Select>
              <Select label="Contribution required before a payout" name="contributionThresholdPercent" defaultValue="100">
                <option value="100">Strict — 100% collected (every member paid)</option>
                <option value="80">Flexible — 80% of expected collected</option>
                <option value="75">Flexible — 75% of expected collected</option>
                <option value="50">Lenient — 50% of expected collected</option>
              </Select>
              <p className="text-xs text-gray-400 dark:text-slate-500">The payout order and membership lock automatically after the first payout.</p>
            </div>
          </fieldset>

          {/* Section 3 — Payout approval */}
          <fieldset className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
            <legend className="px-2 text-sm font-semibold text-gray-700 dark:text-slate-200">3. Payout Approval</legend>
            <div className="space-y-3">
              <Select label="Approval mode" name="payoutApprovalMode" value={approvalMode}
                onChange={e => setApprovalMode(e.target.value as 'none' | 'majority')}>
                <option value="majority">Majority vote (recommended)</option>
                <option value="none">No approval — payouts occur without a vote</option>
              </Select>
              {approvalMode === 'majority' && (
                <>
                  <Input
                    label="Approvals required per payout"
                    name="payoutApprovalsRequired" type="number" min="1" max={maxMembers || undefined}
                    placeholder={`${recommendedApprovals} (recommended)`}
                  />
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    Leave blank to auto-use a majority of active members. For {maxMembers || '—'} members, that&apos;s {recommendedApprovals}.
                  </p>
                </>
              )}
              <Input label="Min approvals for a withdrawal" name="minApprovalsWithdrawal" type="number" min="1" placeholder="2" defaultValue="2" required />
            </div>
          </fieldset>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create Group</Button>
          </div>
        </form>
      </Modal>

      {/* Join Modal */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Join a Group" size="sm">
        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
        <form onSubmit={handleJoin} className="space-y-4">
          <Input
            label="Invite code"
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
            placeholder="AB12CD34"
            required
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setJoinOpen(false)}>Cancel</Button>
            <Button type="submit" loading={joining}>Join Group</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
