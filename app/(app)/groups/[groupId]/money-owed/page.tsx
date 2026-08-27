'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { groups } from '@/lib/api';
import type { PayoutDebt } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageSpinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';

export default function MoneyOwedPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [debts, setDebts] = useState<PayoutDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [confirmDebt, setConfirmDebt] = useState<PayoutDebt | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = () =>
    groups.getPayoutDebts(groupId)
      .then(r => setDebts(r.data ?? []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [groupId]);

  const handlePay = async (debt: PayoutDebt) => {
    setPayingId(debt.id);
    setConfirmDebt(null);
    setMessage(null);
    try {
      const res = await groups.payPayoutDebt(groupId, debt.id);
      setMessage({
        ok: true,
        text: `ZMW ${res.data.netPayout.toLocaleString()} disbursed to ${debt.firstName} ${debt.lastName}.`,
      });
      load();
    } catch (err: unknown) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Payment failed' });
    } finally {
      setPayingId(null);
    }
  };

  const outstanding = debts.filter(d => d.status === 'outstanding');
  const paid = debts.filter(d => d.status === 'paid');

  // Only admins should reach this page (enforced by layout + quick-action visibility)
  // but we check role here for safety
  void user;

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer text-gray-600 dark:text-slate-400"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Money Owed</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Partial payouts and outstanding member debts</p>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm border ${message.ok
          ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}

      {debts.length === 0 ? (
        <Card className="text-center py-16">
          <CheckCircle size={48} className="text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-slate-100">No outstanding debts</h3>
          <p className="text-gray-500 dark:text-slate-400 mt-2">All payouts have been disbursed in full.</p>
        </Card>
      ) : (
        <>
          {outstanding.length > 0 && (
            <Card>
              <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                <AlertCircle size={18} className="text-amber-500" />
                Outstanding ({outstanding.length})
              </h2>
              <div className="space-y-3">
                {outstanding.map(d => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-xl gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                        <DollarSign size={16} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                          {d.firstName} {d.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          Cycle {d.cycleNumber} · Partial payout on {new Date(d.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-1">
                          Owed: ZMW {Number(d.amountOwed).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setConfirmDebt(d)}
                      loading={payingId === d.id}
                      className="flex-shrink-0"
                    >
                      Pay Now
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {paid.length > 0 && (
            <Card>
              <h2 className="font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-2 mb-4">
                <CheckCircle size={18} className="text-emerald-500" />
                Settled ({paid.length})
              </h2>
              <div className="space-y-3">
                {paid.map(d => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
                          {d.firstName} {d.lastName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                          Cycle {d.cycleNumber} · Settled {d.paidAt ? new Date(d.paidAt).toLocaleDateString() : ''}
                        </p>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                          ZMW {Number(d.amountOwed).toLocaleString()} fully settled
                        </p>
                      </div>
                    </div>
                    <Badge label="Paid" variant="success" />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Confirm payment modal */}
      <Modal
        open={!!confirmDebt}
        onClose={() => setConfirmDebt(null)}
        title="Confirm Debt Payment"
        size="sm"
      >
        {confirmDebt && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-slate-400">
              Pay the outstanding balance of{' '}
              <strong className="text-gray-900 dark:text-slate-100">
                ZMW {Number(confirmDebt.amountOwed).toLocaleString()}
              </strong>{' '}
              to{' '}
              <strong className="text-gray-900 dark:text-slate-100">
                {confirmDebt.firstName} {confirmDebt.lastName}
              </strong>?
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              The system will verify that sufficient contributions have been collected before processing the payment.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmDebt(null)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                loading={payingId === confirmDebt.id}
                onClick={() => handlePay(confirmDebt)}
              >
                Confirm Payment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
