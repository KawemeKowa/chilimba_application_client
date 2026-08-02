'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { groups } from '@/lib/api';
import type { GroupDetail, GroupMember } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Mail } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users, Coins, ArrowLeft, Copy, RefreshCw,
  MessageSquare, ArrowLeftRight, Gift, List, Trash2, Phone, PlusCircle, ScrollText
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
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [profileMember, setProfileMember] = useState<GroupMember | null>(null);

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

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      await groups.invite(groupId, inviteEmail);
      setInviteSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
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
              <Button size="sm" onClick={() => { setInviteError(''); setInviteSuccess(''); setInviteOpen(true); }}>
                <Mail size={14} /> Invite Member
              </Button>
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
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Member by Email">
        <form onSubmit={handleInvite} className="space-y-4">
          {inviteError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">{inviteError}</div>
          )}
          {inviteSuccess && (
            <div className="p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg text-sm text-teal-700 dark:text-teal-300">{inviteSuccess}</div>
          )}
          <Input
            label="Email address"
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="member@example.com"
            required
          />
          <p className="text-xs text-gray-500 dark:text-slate-400">
            They will receive an email with a link to accept the invitation. The link expires in 7 days.
          </p>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button type="submit" loading={inviting}>
              <Mail size={14} /> Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
