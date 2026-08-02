'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { groups } from '@/lib/api';
import type { PayoutOrderData, PayoutOrderMember } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft, ArrowUp, ArrowDown, ArrowDownAZ, Save, X,
  Banknote, ShieldCheck, Clock, ThumbsUp, ThumbsDown, ListOrdered
} from 'lucide-react';

export default function PayoutManagementPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [data, setData]       = useState<PayoutOrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState<PayoutOrderMember[]>([]);
  const [saving, setSaving]   = useState(false);
  const [voting, setVoting]   = useState(false);
  const [disbursing, setDisbursing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () =>
    groups.payoutOrder(groupId)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [groupId]);

  if (loading) return <PageSpinner />;
  if (!data) return <div className="text-center py-16 text-gray-500 dark:text-slate-400">Failed to load payout data</div>;

  const has = (p: string) => data.myPermissions.includes('*') || data.myPermissions.includes(p);
  const canSetOrder = has('payout.set_order');
  const canApprove  = has('payout.approve_order');
  const canDisburse = has('payout.disburse');
  const isApprover  = canSetOrder || canApprove || canDisburse;
  const proposal   = data.pendingProposal;
  const iVoted     = proposal?.votes.some(v => v.approverId === user?.id);
  const iProposed  = proposal?.proposedBy === user?.id;
  const nextPayout = data.duePayouts[0] ?? null;

  // Approval / threshold gate for the next scheduled payout (constitution)
  const ap = data.nextPayoutApproval;
  const approvalsMet = !ap || ap.approvalMode !== 'majority' || ap.approvalsCount >= ap.approvalsRequired;
  const thresholdMet = !ap || ap.thresholdMet;
  const disburseReady = approvalsMet && thresholdMet;
  const iAmRecipient = (id: string) => nextPayout?.userId === user?.id && nextPayout?.id === id;

  const startEdit = () => {
    setDraft([...data.members]);
    setEditing(true);
    setMessage(null);
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...draft];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
  };

  const sortAlphabetical = () => {
    setDraft([...draft].sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)));
  };

  const submitOrder = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await groups.proposePayoutOrder(groupId, {
        newOrder: draft.map((m, i) => ({ userId: m.userId, payoutOrder: i + 1 })),
      });
      setMessage({ ok: true, text: res.message });
      setEditing(false);
      load();
    } catch (err: unknown) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Failed to save order' });
    } finally {
      setSaving(false);
    }
  };

  const vote = async (action: 'approved' | 'rejected') => {
    if (!proposal) return;
    setVoting(true);
    setMessage(null);
    try {
      const res = await groups.votePayoutOrder(groupId, proposal.id, action);
      setMessage({ ok: true, text: res.message });
      load();
    } catch (err: unknown) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Vote failed' });
    } finally {
      setVoting(false);
    }
  };

  const disburse = async (payoutScheduleId: string) => {
    setDisbursing(payoutScheduleId);
    setMessage(null);
    try {
      const res = await groups.disbursePayout(groupId, payoutScheduleId);
      setMessage({ ok: true, text: `Disbursed ZMW ${res.data.netPayout.toLocaleString()} (fee: ZMW ${res.data.feeCharged.toLocaleString()})` });
      load();
    } catch (err: unknown) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Disbursement failed' });
    } finally {
      setDisbursing(null);
    }
  };

  const votePayout = async (payoutScheduleId: string, action: 'approved' | 'rejected') => {
    setVoting(true);
    setMessage(null);
    try {
      const res = await groups.approvePayout(groupId, payoutScheduleId, action);
      setMessage({ ok: true, text: res.message });
      load();
    } catch (err: unknown) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Vote failed' });
    } finally {
      setVoting(false);
    }
  };

  const list = editing ? draft : data.members;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-gray-600 dark:text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Payout Management</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Set the payout order and disburse to the next member
            {isApprover && <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400"><ShieldCheck size={13} /> Approver</span>}
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm border ${message.ok
          ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* Pending proposal banner */}
      {proposal && (
        <Card className="border-amber-200 dark:border-amber-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <Clock size={17} className="text-amber-500" /> Payout Order Change Pending
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
                Proposed by <strong>{proposal.proposerName}</strong> ·{' '}
                {proposal.approvalsCount}/{proposal.approvalsNeeded} approvals ·{' '}
                {new Date(proposal.createdAt).toLocaleDateString()}
              </p>
            </div>
            {canApprove && !iProposed && !iVoted && (
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => vote('approved')} loading={voting}
                  className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20">
                  <ThumbsUp size={14} /> Approve
                </Button>
                <Button variant="outline" size="sm" onClick={() => vote('rejected')} loading={voting}
                  className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <ThumbsDown size={14} /> Reject
                </Button>
              </div>
            )}
            {iProposed && <Badge label="Awaiting other approvers" variant="warning" />}
            {iVoted && !iProposed && <Badge label="You voted" variant="info" />}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payout order */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <ListOrdered size={18} /> Payout Order
            </h2>
            {canSetOrder && !editing && !proposal && (
              <Button size="sm" variant="outline" onClick={startEdit}>Edit Order</Button>
            )}
            {editing && (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={sortAlphabetical} title="Sort alphabetically">
                  <ArrowDownAZ size={14} /> A–Z
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
                  <X size={14} />
                </Button>
                <Button size="sm" onClick={submitOrder} loading={saving}>
                  <Save size={14} /> Save
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {list.map((m, i) => (
              <div key={m.userId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {editing ? i + 1 : (m.payoutOrder ?? i + 1)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{m.firstName} {m.lastName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {m.role !== 'member' && <Badge label={m.role} variant="info" />}
                      {m.permissions.includes('approver') && (
                        <span className="inline-flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400"><ShieldCheck size={11} /> approver</span>
                      )}
                    </div>
                  </div>
                </div>
                {editing && (
                  <div className="flex gap-1">
                    <button onClick={() => move(i, -1)} disabled={i === 0}
                      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-30 cursor-pointer text-gray-600 dark:text-slate-300">
                      <ArrowUp size={15} />
                    </button>
                    <button onClick={() => move(i, 1)} disabled={i === list.length - 1}
                      className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600 disabled:opacity-30 cursor-pointer text-gray-600 dark:text-slate-300">
                      <ArrowDown size={15} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {editing && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-3">
              {data.members.filter(m => m.permissions.includes('approver')).length > 1
                ? 'All other approvers must approve this change before it takes effect.'
                : 'You are the only approver — changes apply immediately.'}
            </p>
          )}
        </Card>

        {/* Due payouts */}
        <Card>
          <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-4">
            <Banknote size={18} /> Due for Payout
          </h2>
          {data.duePayouts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-8">No scheduled payouts</p>
          ) : (
            <div className="space-y-2">
              {data.duePayouts.map(p => {
                const isNext = nextPayout?.id === p.id;
                return (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg ${isNext
                    ? 'bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800'
                    : 'bg-gray-50 dark:bg-slate-700/50'}`}>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                        #{p.payoutOrder} · {p.firstName} {p.lastName}
                        {isNext && <span className="ml-2 text-xs font-semibold text-teal-600 dark:text-teal-400">NEXT</span>}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Cycle {p.cycleNumber} · {new Date(p.scheduledDate).toLocaleDateString()} ·
                        ZMW {Number(p.expectedAmount).toLocaleString()}
                      </p>
                    </div>
                    {canDisburse && isNext && (
                      <Button size="sm" onClick={() => disburse(p.id)} loading={disbursing === p.id} disabled={!disburseReady}>
                        <Banknote size={14} /> Disburse
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Approval + threshold status for the next payout */}
          {ap && nextPayout && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 space-y-3">
              {/* Contribution threshold */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-slate-400">Contributions collected ({ap.thresholdPercent}% required)</span>
                  <span className={`font-medium ${thresholdMet ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    ZMW {ap.collected.toLocaleString()} / {ap.expectedPool.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                  <div className={`h-full ${thresholdMet ? 'bg-green-500' : 'bg-amber-500'}`}
                    style={{ width: `${ap.expectedPool > 0 ? Math.min(100, (ap.collected / ap.expectedPool) * 100) : 100}%` }} />
                </div>
              </div>

              {/* Approval votes */}
              {ap.approvalMode === 'majority' ? (
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-500 dark:text-slate-400">Payout approvals</span>
                    <span className={`font-medium ${approvalsMet ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-slate-300'}`}>
                      {ap.approvalsCount} / {ap.approvalsRequired}
                    </span>
                  </div>
                  {!ap.iVoted && !iAmRecipient(nextPayout.id) && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => votePayout(nextPayout.id, 'approved')} loading={voting}
                        className="flex-1 text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20">
                        <ThumbsUp size={14} /> Approve payout
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => votePayout(nextPayout.id, 'rejected')} loading={voting}
                        className="flex-1 text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <ThumbsDown size={14} /> Reject
                      </Button>
                    </div>
                  )}
                  {ap.iVoted && <Badge label="You voted" variant="info" />}
                  {iAmRecipient(nextPayout.id) && <p className="text-xs text-gray-400 dark:text-slate-500">You are the recipient — you can&apos;t vote on your own payout.</p>}
                </div>
              ) : (
                <p className="text-xs text-gray-400 dark:text-slate-500">This group requires no payout approvals.</p>
              )}

              {canDisburse && !disburseReady && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {!thresholdMet ? 'Contribution threshold not yet met. ' : ''}
                  {!approvalsMet ? 'Waiting for the required approvals.' : ''}
                </p>
              )}
            </div>
          )}

          {!canDisburse && data.duePayouts.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-3">
              Only members with the disburse permission can trigger payouts.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
