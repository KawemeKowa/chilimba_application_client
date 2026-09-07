'use client';

import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';
import type { PaymentReview, PaymentEvent, LedgerEntry } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, Search, ShieldCheck } from 'lucide-react';

const money = (n: number, cur = 'ZMW') =>
  `${cur} ${Number(n ?? 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}`;

/** Why this row is in the queue — the thing an admin needs to decide about. */
function issueOf(t: PaymentReview): { label: string; tone: 'danger' | 'warning' } {
  if (t.discrepancy) return { label: t.discrepancy, tone: 'danger' };
  if (t.status === 'pending') {
    return {
      label: `Stuck pending since ${new Date(t.created_at).toLocaleString()} — provider never confirmed`,
      tone: 'warning',
    };
  }
  return { label: 'Flagged for review', tone: 'warning' };
}

export default function PaymentReconciliationPage() {
  const [rows, setRows] = useState<PaymentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [detail, setDetail] = useState<{
    transaction: PaymentReview; events: PaymentEvent[]; ledger: LedgerEntry[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [resolveFor, setResolveFor] = useState<PaymentReview | null>(null);
  const [action, setAction] = useState<'credit' | 'fail' | 'clear_flag'>('credit');
  const [note, setNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const load = () =>
    admin.reconciliation.review()
      .then(r => setRows(r.data ?? []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const runSweep = async (referenceId?: string) => {
    setRunning(true);
    setMessage(null);
    try {
      const res = await admin.reconciliation.run(referenceId);
      setMessage({ ok: true, text: res.message });
      load();
    } catch (err: unknown) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Reconciliation failed' });
    } finally {
      setRunning(false);
    }
  };

  const openDetail = async (t: PaymentReview) => {
    setDetailLoading(true);
    try {
      const res = await admin.reconciliation.detail(t.reference_id);
      setDetail(res.data);
    } catch (err: unknown) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Could not load history' });
    } finally {
      setDetailLoading(false);
    }
  };

  const submitResolve = async () => {
    if (!resolveFor) return;
    setResolving(true);
    setMessage(null);
    try {
      const res = await admin.reconciliation.resolve(resolveFor.reference_id, action, note);
      setMessage({ ok: true, text: res.message });
      setResolveFor(null);
      setNote('');
      load();
    } catch (err: unknown) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Could not apply correction' });
    } finally {
      setResolving(false);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Payment Reconciliation</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Payments that didn&apos;t settle cleanly — stuck pending, amount mismatches, or credited nowhere.
          </p>
        </div>
        <Button onClick={() => runSweep()} loading={running}>
          <RefreshCw size={16} /> Re-check All Pending
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm border ${message.ok
          ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}

      {rows.length === 0 ? (
        <Card className="text-center py-16">
          <ShieldCheck size={44} className="text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">Everything reconciled</h3>
          <p className="text-gray-500 dark:text-slate-400 mt-2">
            No stuck payments and no amount mismatches.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map(t => {
            const issue = issueOf(t);
            return (
              <Card key={t.id}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-slate-100">
                        {money(t.amount, t.currency)}
                      </span>
                      <Badge
                        label={t.status}
                        variant={t.status === 'successful' ? 'success' : t.status === 'failed' ? 'danger' : 'warning'}
                      />
                      <span className="text-xs uppercase tracking-wide text-gray-400 dark:text-slate-500">
                        {t.type}
                      </span>
                      {t.discrepancy && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
                          <AlertTriangle size={12} /> Mismatch
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-slate-300 mt-1">
                      {t.first_name ? `${t.first_name} ${t.last_name}` : 'Unknown member'}
                      {t.email && <span className="text-gray-400 dark:text-slate-500"> · {t.email}</span>}
                      {t.group_name && <span className="text-gray-400 dark:text-slate-500"> · {t.group_name}</span>}
                    </p>

                    <p className={`text-xs mt-1 ${issue.tone === 'danger'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-amber-600 dark:text-amber-400'}`}>
                      {issue.label}
                    </p>

                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-mono break-all">
                      {t.reference_id}
                      {t.check_attempts ? ` · checked ${t.check_attempts}×` : ''}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openDetail(t)} loading={detailLoading}>
                      <Search size={14} /> History
                    </Button>
                    {t.status === 'pending' && (
                      <Button variant="outline" size="sm" onClick={() => runSweep(t.reference_id)} loading={running}>
                        <RefreshCw size={14} /> Re-check
                      </Button>
                    )}
                    <Button size="sm" onClick={() => { setResolveFor(t); setAction(t.status === 'pending' ? 'credit' : 'clear_flag'); setNote(''); }}>
                      Resolve
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Audit trail */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Payment History" size="lg">
        {detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Amount</p>
                <p className="font-semibold text-gray-900 dark:text-slate-100">
                  {money(detail.transaction.amount, detail.transaction.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Provider reference</p>
                <p className="font-mono text-xs text-gray-900 dark:text-slate-100 break-all">
                  {detail.transaction.lipila_id || '—'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Event trail</h3>
              <div className="space-y-2">
                {detail.events.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-slate-500">No events recorded.</p>
                )}
                {detail.events.map(e => (
                  <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                    {e.event === 'credited' ? <CheckCircle size={15} className="text-green-500 mt-0.5 flex-shrink-0" />
                      : e.event === 'discrepancy' ? <AlertTriangle size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
                      : <Clock size={15} className="text-gray-400 mt-0.5 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                        {e.event.replace(/_/g, ' ')}
                        <span className="ml-2 text-xs font-normal text-gray-400 dark:text-slate-500">
                          via {e.source}
                          {e.actor_first_name && ` · ${e.actor_first_name} ${e.actor_last_name}`}
                        </span>
                      </p>
                      {e.detail && <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">{e.detail}</p>}
                      {e.expected_amount != null && e.reported_amount != null
                        && Math.abs(e.expected_amount - e.reported_amount) > 0.001 && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                          expected {money(e.expected_amount)} · reported {money(e.reported_amount)}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        {new Date(e.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {detail.ledger.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2">Wallet ledger</h3>
                <div className="space-y-1.5">
                  {detail.ledger.map(l => (
                    <div key={l.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-gray-50 dark:bg-slate-700/50">
                      <span className="text-gray-600 dark:text-slate-300">{l.description || l.type}</span>
                      <span className="font-mono text-gray-900 dark:text-slate-100">
                        {l.direction === 'credit' ? '+' : '−'}{money(l.amount)}
                        <span className="text-gray-400 dark:text-slate-500 ml-2">
                          {money(l.balance_before)} → {money(l.balance_after)}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Manual correction */}
      <Modal open={!!resolveFor} onClose={() => setResolveFor(null)} title="Resolve Payment" size="sm">
        {resolveFor && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Amount</span>
                <span className="font-semibold text-gray-900 dark:text-slate-100">
                  {money(resolveFor.amount, resolveFor.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Member</span>
                <span className="text-gray-900 dark:text-slate-100">
                  {resolveFor.first_name} {resolveFor.last_name}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {([
                ['credit', 'Credit the wallet', 'Money confirmed received. Credits the wallet and marks it successful.'],
                ['fail', 'Mark as failed', 'Money never arrived. Closes it without crediting.'],
                ['clear_flag', 'Clear the review flag', 'Leave amounts as they are; just take it off this queue.'],
              ] as const).map(([val, label, help]) => (
                <label key={val} className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                  action === val
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                    : 'border-gray-200 dark:border-slate-600 hover:border-teal-300'
                }`}>
                  <div className="flex items-start gap-2">
                    <input
                      type="radio" name="resolve-action" value={val} checked={action === val}
                      onChange={() => setAction(val)} className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{label}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{help}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <Textarea
              label="Reason for this correction (required)"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Confirmed with MTN — transaction ID 8842, funds settled to merchant account"
            />
            <p className="text-xs text-gray-400 dark:text-slate-500">
              This is recorded permanently against the payment, with your name.
            </p>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setResolveFor(null)}>Cancel</Button>
              <Button className="flex-1" loading={resolving} disabled={!note.trim()} onClick={submitResolve}>
                Apply Correction
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
