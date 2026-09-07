'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { contributions } from '@/lib/api';
import type { Contribution, PaginatedResponse } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { Coins, CheckCircle } from 'lucide-react';

export default function ContributionsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<PaginatedResponse<Contribution> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = (p = 1) => {
    setLoading(true);
    contributions.group(groupId, { page: String(p), limit: '20' })
      .then(r => { setData(r); setPage(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [groupId]);

  const handlePay = async (id: string) => {
    setPaying(id);
    setMessage(null);
    try {
      await contributions.pay(id);
      setMessage({ ok: true, text: 'Contribution paid from your group wallet.' });
      load(page);
    } catch (err: unknown) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Payment failed' });
    } finally {
      setPaying(null);
    }
  };

  if (loading && !data) return <PageSpinner />;

  // Your own unpaid rows, soonest first
  const myOutstanding = (data?.data ?? [])
    .filter(c => c.userId === user?.id && (c.status === 'pending' || c.status === 'late'))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const myTotalDue = myOutstanding.reduce((sum, c) => sum + Number(c.amount ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contributions"
        backHref={`/groups/${groupId}`}
        backLabel="group"
        subtitle="Every member's monthly contribution for this group. Pay your own row below — the money comes out of your group wallet, so top that up first."
      />

      {/* What you personally still owe — the reason most people open this page */}
      {myOutstanding.length > 0 && (
        <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-teal-800 dark:text-teal-300">
              You owe ZMW {myTotalDue.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-teal-700 dark:text-teal-400 mt-0.5">
              {myOutstanding.length} unpaid contribution{myOutstanding.length !== 1 ? 's' : ''} ·
              next due {new Date(myOutstanding[0].dueDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/wallet?deposit=${groupId}`}>
              <Button size="sm" variant="outline">Top Up Wallet</Button>
            </Link>
            <Button size="sm" loading={paying === myOutstanding[0].id} onClick={() => handlePay(myOutstanding[0].id)}>
              <CheckCircle size={14} /> Pay Next
            </Button>
          </div>
        </div>
      )}

      {message && (
        <div className={`p-3 rounded-lg text-sm border flex items-center justify-between gap-4 ${message.ok
          ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'}`}>
          <span>{message.text}</span>
          {!message.ok && (
            <Link href={`/wallet?deposit=${groupId}`} className="flex-shrink-0">
              <Button size="sm" variant="outline">Top Up</Button>
            </Link>
          )}
        </div>
      )}

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Member', 'Amount', 'Due Date', 'Paid At', 'Cycle', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    <Coins size={32} className="mx-auto mb-2 text-gray-300" />
                    No contributions found
                  </td>
                </tr>
              )}
              {data?.data.map(c => {
                const isMine = c.userId === user?.id;
                const owing = c.status === 'pending' || c.status === 'late';
                return (
                  <tr key={c.id} className={isMine ? 'bg-teal-50/40 dark:bg-teal-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'}>
                    <td className="px-5 py-3 text-sm text-gray-900 dark:text-slate-100">
                      {c.firstName || c.lastName ? `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() : '—'}
                      {isMine && <span className="ml-2 text-xs font-semibold text-teal-600 dark:text-teal-400">You</span>}
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-slate-100">
                      ZMW {(c.amount ?? 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-slate-400">
                      {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-slate-400">
                      {c.paidAt ? new Date(c.paidAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600 dark:text-slate-400">{c.cycleNumber ?? '—'}</td>
                    <td className="px-5 py-3"><Badge label={c.status} variant={statusVariant(c.status)} /></td>
                    <td className="px-5 py-3">
                      {/* Only your own rows are payable — the API rejects paying
                          for someone else, so offering the button would mislead */}
                      {isMine && owing ? (
                        <Button size="sm" loading={paying === c.id} onClick={() => handlePay(c.id)}>
                          <CheckCircle size={14} /> Pay
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data && (
          <div className="px-5 py-3 border-t border-gray-100">
            <Pagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              onPage={load}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
