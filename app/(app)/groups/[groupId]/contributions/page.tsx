'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { contributions } from '@/lib/api';
import type { Contribution, PaginatedResponse } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { Coins, CheckCircle } from 'lucide-react';

export default function ContributionsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [data, setData] = useState<PaginatedResponse<Contribution> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);

  const load = (p = 1) => {
    setLoading(true);
    contributions.group(groupId, { page: String(p), limit: '20' })
      .then(r => { setData(r); setPage(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [groupId]);

  const handlePay = async (id: string) => {
    setPaying(id);
    try {
      await contributions.pay(id);
      load(page);
    } finally {
      setPaying(null);
    }
  };

  if (loading && !data) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contributions</h1>
        <p className="text-gray-500 mt-1">Track all contributions for this group</p>
      </div>

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
              {data?.data.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-900">{c.userId}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-gray-900">ZMW {c.amount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{new Date(c.dueDate).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{c.paidAt ? new Date(c.paidAt).toLocaleDateString() : '—'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{c.cycleNumber ?? '—'}</td>
                  <td className="px-5 py-3"><Badge label={c.status} variant={statusVariant(c.status)} /></td>
                  <td className="px-5 py-3">
                    {c.status === 'pending' || c.status === 'late' ? (
                      <Button size="sm" loading={paying === c.id} onClick={() => handlePay(c.id)}>
                        <CheckCircle size={14} /> Pay
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
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
