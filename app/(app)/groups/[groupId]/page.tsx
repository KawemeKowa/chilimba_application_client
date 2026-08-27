'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { groups } from '@/lib/api';
import type { GroupDetail, GroupMember, PendingInvitation } from '@/lib/api';
import { Mail } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users, Coins, ArrowLeft, Copy, RefreshCw,
  MessageSquare, ArrowLeftRight, Gift, List, Trash2, Phone, PlusCircle, ScrollText,
  Plus, X, Send, Clock, RotateCcw, CheckCircle2, CircleDashed, Zap, AlertTriangle, DollarSign
} from 'lucide-react';

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [togglingPerm, setTogglingPerm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteTab, setInviteTab] = useState<'send' | 'pending'>('send');
  const [inviteEmails, setInviteEmails] = useState<string[]>(['']);
  const [inviting, setInviting] = useState(false);
  const [inviteResults, setInviteResults] = useState<{ email: string; ok: boolean; msg: string }[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [editingInvite, setEditingInvite] = useState<{ id: string; email: string } | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [profileMember, setProfileMember] = useState<GroupMember | null>(null);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState('');

  const load = async () => {
    try {
      const gRes = await groups.get(groupId);
      setGroup(gRes.data);
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

  const remainingSlots = group
    ? (group.maxMembers ?? 0) - (group.memberCount ?? group.members?.length ?? 0)
    : 0;

  const openInviteModal = (tab: 'send' | 'pending' = 'send') => {
    setInviteTab(tab);
    setInviteEmails(['']);
    setInviteResults([]);
    setEditingInvite(null);
    setInviteOpen(true);
    if (tab === 'pending') loadPendingInvitations();
  };

  const loadPendingInvitations = async () => {
    setLoadingPending(true);
    try {
      const res = await groups.listInvitations(groupId);
      setPendingInvitations(res.data ?? []);
    } catch { setPendingInvitations([]); }
    finally { setLoadingPending(false); }
  };

  const addEmailRow = () => {
    if (inviteEmails.length < remainingSlots) {
      setInviteEmails(prev => [...prev, '']);
    }
  };

  const removeEmailRow = (idx: number) => {
    setInviteEmails(prev => prev.length === 1 ? [''] : prev.filter((_, i) => i !== idx));
  };

  const updateEmail = (idx: number, val: string) => {
    setInviteEmails(prev => prev.map((e, i) => i === idx ? val : e));
  };

  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const emails = inviteEmails.map(e => e.trim()).filter(Boolean);
    if (!emails.length) return;
    setInviting(true);
    setInviteResults([]);
    const results: { email: string; ok: boolean; msg: string }[] = [];
    for (const email of emails) {
      try {
        await groups.invite(groupId, email);
        results.push({ email, ok: true, msg: 'Invitation sent' });
      } catch (err: unknown) {
        results.push({ email, ok: false, msg: err instanceof Error ? err.message : 'Failed' });
      }
    }
    setInviteResults(results);
    setInviteEmails(['']);
    setInviting(false);
    load();
  };

  const handleResend = async (inv: PendingInvitation) => {
    setResendingId(inv.id);
    try {
      await groups.invite(groupId, inv.email);
      await loadPendingInvitations();
    } catch { /* show nothing — resend is best-effort */ }
    finally { setResendingId(null); }
  };

  const handleEditResend = async (invId: string, newEmail: string) => {
    if (!newEmail.trim()) return;
    setResendingId(invId);
    try {
      await groups.cancelInvitation(groupId, invId);
      await groups.invite(groupId, newEmail.trim());
      setEditingInvite(null);
      await loadPendingInvitations();
    } catch { /* keep editing state */ }
    finally { setResendingId(null); }
  };

  const handleCancelInvitation = async (invId: string) => {
    setCancellingId(invId);
    try {
      await groups.cancelInvitation(groupId, invId);
      await loadPendingInvitations();
    } catch { }
    finally { setCancellingId(null); }
  };

  const handleActivate = async () => {
    setActivating(true);
    setActivateError('');
    try {
      await groups.activate(groupId);
      await load();
    } catch (err: unknown) {
      setActivateError(err instanceof Error ? err.message : 'Activation failed. Please try again.');
    } finally {
      setActivating(false);
    }
  };

  if (loading) return <PageSpinner />;
  if (!group) return <div className="text-center py-16 text-gray-500 dark:text-slate-400">Group not found</div>;

  const myRole = group.members?.find(m => m.userId === user?.id)?.role;
  const isAdmin = myRole === 'owner' || myRole === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-gray-600 dark:text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{group.name}</h1>
            <Badge label={group.status} variant={statusVariant(group.status)} />
          </div>
          {group.description && <p className="text-gray-500 dark:text-slate-400 mt-1">{group.description}</p>}
        </div>
      </div>

      {/* Activation panel — only shown when group is inactive and user is admin */}
      {group.status === 'inactive' && isAdmin && (() => {
        const memberCount = group.memberCount ?? group.members?.length ?? 0;
        const pendingCount = group.pendingInvitationsCount ?? 0;
        const checks = [
          {
            label: 'Group rules configured',
            done: true,
            detail: 'Contribution amount, payout day, and approval mode are set.',
          },
          {
            label: `Members have joined (${memberCount} of ${group.maxMembers})`,
            done: memberCount >= 2,
            detail: memberCount >= 2 ? 'At least 2 members have joined.' : 'Invite members to the group — at least 2 must join.',
          },
          {
            label: 'No pending invitations',
            done: pendingCount === 0,
            detail: pendingCount === 0 ? 'All invitations have been accepted or cancelled.' : `${pendingCount} invitation${pendingCount !== 1 ? 's' : ''} still pending — waiting for acceptance.`,
          },
        ];
        const allReady = checks.every(c => c.done);
        return (
          <div className="rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">Group is not yet active</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                  Complete the checklist below, then activate the group to start the savings cycle.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {checks.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  {c.done
                    ? <CheckCircle2 size={18} className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    : <CircleDashed size={18} className="text-amber-400 dark:text-amber-500 flex-shrink-0 mt-0.5" />}
                  <div>
                    <p className={`text-sm font-medium ${c.done ? 'text-gray-700 dark:text-slate-200' : 'text-amber-700 dark:text-amber-300'}`}>{c.label}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{c.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {activateError && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {activateError}
              </p>
            )}

            <Button
              onClick={handleActivate}
              loading={activating}
              disabled={!allReady}
              className="w-full"
            >
              <Zap size={16} /> Activate Group
            </Button>
            {!allReady && (
              <p className="text-xs text-center text-amber-600 dark:text-amber-500">
                Complete all checklist items above to enable activation.
              </p>
            )}
          </div>
        );
      })()}

      {/* My balance in this group */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-teal-100 text-sm font-medium">Your Balance in {group.name}</p>
          <p className="text-3xl font-bold mt-1">
            {group.currency ?? 'ZMW'} {group.myWalletBalance.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
          </p>
          {group.monthlyAmount ? (
            <p className="text-teal-200 text-sm mt-1">
              {group.myWalletBalance >= group.monthlyAmount
                ? `${Math.floor(group.myWalletBalance / group.monthlyAmount)} month${Math.floor(group.myWalletBalance / group.monthlyAmount) !== 1 ? 's' : ''} covered`
                : `Monthly due: ${group.currency ?? 'ZMW'} ${group.monthlyAmount.toLocaleString()} — top up needed`}
            </p>
          ) : null}
        </div>
        <Link href={`/wallet?deposit=${groupId}`}>
          <Button variant="secondary" size="sm"><PlusCircle size={14} /> Top Up</Button>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[
          { href: `/groups/${groupId}/contributions`, icon: Coins, label: 'Contributions' },
          { href: `/groups/${groupId}/withdrawals`, icon: ArrowLeftRight, label: 'Withdrawals' },
          { href: `/groups/${groupId}/committees`, icon: Gift, label: 'Committees' },
          { href: `/groups/${groupId}/messages`, icon: MessageSquare, label: 'Messages' },
          { href: `/wallet?deposit=${groupId}`, icon: PlusCircle, label: 'Top Up' },
          { href: `/groups/${groupId}/payouts`, icon: List, label: 'Payouts' },
          { href: `/groups/${groupId}/money-owed`, icon: DollarSign, label: 'Money Owed' },
          { href: `/groups/${groupId}/constitution`, icon: ScrollText, label: 'Rules' },
        ].map((action, i) => (
          <Link key={i} href={action.href}>
            <div className={`bg-white dark:bg-slate-800 border rounded-xl p-4 text-center hover:shadow-sm transition-all cursor-pointer ${
              action.label === 'Top Up'
                ? 'border-teal-200 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 hover:border-teal-400'
                : 'border-gray-100 dark:border-slate-700 hover:border-teal-200 dark:hover:border-teal-700'
            }`}>
              <action.icon size={22} className="text-teal-600 dark:text-teal-400 mx-auto mb-2" />
              <p className={`text-sm font-medium ${action.label === 'Top Up' ? 'text-teal-700 dark:text-teal-300' : 'text-gray-700 dark:text-slate-300'}`}>{action.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Group info */}
        <Card>
          <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Group Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-slate-400">Monthly Amount</dt>
              <dd className="font-medium text-gray-900 dark:text-slate-100">{group.currency ?? 'ZMW'} {(group.monthlyAmount ?? 0).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-slate-400">Members</dt>
              <dd className="font-medium text-gray-900 dark:text-slate-100">{group.memberCount || group.members?.length || 0}/{group.maxMembers}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-slate-400">Contribution Day</dt>
              <dd className="font-medium text-gray-900 dark:text-slate-100">{group.contributionDay}th of month</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-slate-400">Payout Day</dt>
              <dd className="font-medium text-gray-900 dark:text-slate-100">{group.payoutDay}th of month</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-slate-400">Min Approvals</dt>
              <dd className="font-medium text-gray-900 dark:text-slate-100">{group.minApprovalsWithdrawal}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-slate-400">Currency</dt>
              <dd className="font-medium text-gray-900 dark:text-slate-100">{group.currency}</dd>
            </div>
          </dl>

          {isAdmin && group.inviteCode && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Invite Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-50 dark:bg-slate-700 px-3 py-2 rounded-lg text-sm font-mono text-gray-800 dark:text-slate-200">
                  {group.inviteCode}
                </code>
                <button onClick={copyInvite} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer" title="Copy">
                  <Copy size={14} className={copied ? 'text-teal-600' : 'text-gray-500 dark:text-slate-400'} />
                </button>
                <button onClick={handleRotateInvite} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer" title="Rotate">
                  <RefreshCw size={14} className="text-gray-500 dark:text-slate-400" />
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Members */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <Users size={18} /> Members ({group.members?.length || 0})
            </h2>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => openInviteModal('pending')}>
                  <Clock size={14} /> Pending
                </Button>
                <Button size="sm" onClick={() => openInviteModal('send')}>
                  <Mail size={14} /> Invite
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {group.members?.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <div
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => setProfileMember(m)}
                >
                  <div className="w-9 h-9 bg-teal-100 dark:bg-teal-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-teal-700 dark:text-teal-300 text-sm font-semibold">
                      {m.firstName?.[0]}{m.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{m.firstName} {m.lastName}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {m.role === 'admin' ? 'Group Admin' : 'Member'} · Joined {new Date(m.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.payoutOrder && <span className="text-xs text-gray-500 dark:text-slate-400">#{m.payoutOrder}</span>}
                  <Badge label={m.role} variant={m.role === 'admin' ? 'info' : 'neutral'} />
                  {isAdmin && m.userId !== user?.id && (
                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      disabled={removing === m.userId}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer disabled:opacity-40"
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

      {/* Member profile modal */}
      <Modal
        open={!!profileMember}
        onClose={() => setProfileMember(null)}
        title="Member Profile"
      >
        {profileMember && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-teal-100 dark:bg-teal-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-teal-700 dark:text-teal-300 text-xl font-bold">
                  {profileMember.firstName?.[0]}{profileMember.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  {profileMember.firstName} {profileMember.lastName}
                </p>
                <Badge
                  label={profileMember.role === 'owner' ? 'Owner' : profileMember.role === 'admin' ? 'Admin' : 'Member'}
                  variant={profileMember.role === 'owner' || profileMember.role === 'admin' ? 'info' : 'neutral'}
                />
              </div>
            </div>
            <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-slate-300">{profileMember.email || '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-slate-300">{profileMember.phone || '—'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-slate-400">
                <span>Joined {new Date(profileMember.joinedAt).toLocaleDateString('en-ZM', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                {profileMember.payoutOrder && <span>· Payout #{profileMember.payoutOrder}</span>}
              </div>
            </div>

            {/* Approver permission (group admins only; owner always keeps it) */}
            {isAdmin && (
              <div className="pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Approver permission</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                    Can change the payout order and trigger disbursements
                  </p>
                </div>
                {profileMember.role === 'owner' ? (
                  <Badge label="Always approver" variant="info" />
                ) : (
                  <Button
                    size="sm"
                    variant={profileMember.permissions?.includes('approver') ? 'secondary' : 'primary'}
                    loading={togglingPerm}
                    onClick={async () => {
                      setTogglingPerm(true);
                      try {
                        const has = profileMember.permissions?.includes('approver') ?? false;
                        await groups.setPermission(groupId, profileMember.userId, 'approver', !has);
                        setProfileMember({
                          ...profileMember,
                          permissions: has
                            ? (profileMember.permissions ?? []).filter(p => p !== 'approver')
                            : [...(profileMember.permissions ?? []), 'approver'],
                        });
                        load();
                      } finally {
                        setTogglingPerm(false);
                      }
                    }}
                  >
                    {profileMember.permissions?.includes('approver') ? 'Revoke approver' : 'Grant approver'}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Invite member modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Manage Invitations" size="lg">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 dark:border-slate-700 -mx-1 mb-5">
          <button
            onClick={() => { setInviteTab('send'); setInviteResults([]); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              inviteTab === 'send'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
          >
            <span className="flex items-center gap-1.5"><Send size={13} /> Send Invitations</span>
          </button>
          <button
            onClick={() => { setInviteTab('pending'); loadPendingInvitations(); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              inviteTab === 'pending'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Clock size={13} /> Pending
              {pendingInvitations.length > 0 && (
                <span className="ml-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                  {pendingInvitations.length}
                </span>
              )}
            </span>
          </button>
        </div>

        {/* ── Send tab ── */}
        {inviteTab === 'send' && (
          <form onSubmit={handleBulkInvite} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {remainingSlots > 0
                  ? `${remainingSlots} slot${remainingSlots !== 1 ? 's' : ''} available — invite up to ${remainingSlots} member${remainingSlots !== 1 ? 's' : ''} at once`
                  : 'Group is full — no more members can be added'}
              </p>
            </div>

            {/* Result feedback from previous send */}
            {inviteResults.length > 0 && (
              <div className="space-y-1.5">
                {inviteResults.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${
                      r.ok
                        ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {r.ok ? <Send size={13} /> : <X size={13} />}
                    <span className="font-medium">{r.email}</span>
                    <span className="text-xs opacity-80">— {r.msg}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Email rows */}
            <div className="space-y-2">
              {inviteEmails.map((email, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={e => updateEmail(idx, e.target.value)}
                      placeholder={`member${idx + 1}@example.com`}
                      required={idx === 0}
                      disabled={remainingSlots === 0}
                      className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                    />
                  </div>
                  {inviteEmails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEmailRow(idx)}
                      className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add row button */}
            {inviteEmails.length < remainingSlots && (
              <button
                type="button"
                onClick={addEmailRow}
                className="flex items-center gap-1.5 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium cursor-pointer"
              >
                <Plus size={14} /> Add another email
              </button>
            )}

            <p className="text-xs text-gray-400 dark:text-slate-500">
              Invitations expire after 7 days. Existing pending invitations to the same email are replaced.
            </p>

            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>Close</Button>
              <Button type="submit" loading={inviting} disabled={remainingSlots === 0}>
                <Send size={14} /> Send {inviteEmails.filter(e => e.trim()).length > 1 ? `${inviteEmails.filter(e => e.trim()).length} Invitations` : 'Invitation'}
              </Button>
            </div>
          </form>
        )}

        {/* ── Pending tab ── */}
        {inviteTab === 'pending' && (
          <div className="space-y-3">
            {loadingPending ? (
              <div className="py-8 text-center text-sm text-gray-400 dark:text-slate-500">Loading…</div>
            ) : pendingInvitations.length === 0 ? (
              <div className="py-8 text-center">
                <Clock size={32} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-gray-400 dark:text-slate-500">No pending invitations</p>
              </div>
            ) : (
              pendingInvitations.map(inv => (
                <div key={inv.id} className="border border-gray-100 dark:border-slate-700 rounded-xl p-3 space-y-2">
                  {editingInvite?.id === inv.id ? (
                    /* Edit mode */
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={editingInvite.email}
                        onChange={e => setEditingInvite({ ...editingInvite, email: e.target.value })}
                        className="flex-1 border border-teal-400 dark:border-teal-500 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        loading={resendingId === inv.id}
                        onClick={() => handleEditResend(inv.id, editingInvite.email)}
                      >
                        <Send size={12} /> Resend
                      </Button>
                      <button
                        onClick={() => setEditingInvite(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    /* View mode */
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{inv.email}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                          Sent {new Date(inv.createdAt).toLocaleDateString()} ·
                          Expires {new Date(inv.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          title="Resend invitation"
                          disabled={resendingId === inv.id}
                          onClick={() => handleResend(inv)}
                          className="p-1.5 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          title="Edit email and resend"
                          onClick={() => setEditingInvite({ id: inv.id, email: inv.email })}
                          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Mail size={14} />
                        </button>
                        <button
                          title="Cancel invitation"
                          disabled={cancellingId === inv.id}
                          onClick={() => handleCancelInvitation(inv.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div className="flex justify-end pt-1">
              <Button variant="secondary" onClick={() => setInviteOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
