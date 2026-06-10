'use client';

import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';
import type { Withdrawal, PaginatedResponse } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { Select } from '@/components/ui/Input';
import { ArrowLeftRight } from 'lucide-react';

export default function AdminWithdrawalsPage() {
  const [data, setData] = useState<PaginatedResponse<Withdrawal> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const load = (p = 1) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(p), limit: '20' };
    if (statusFilter) params.status = statusFilter;
    admin.withdrawals.list(params)
      .then(r => { setData(r); setPage(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Withdrawals</h1>
        <p className="text-gray-500 mt-1">Monitor all withdrawal requests across the platform</p>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); }} className="w-48">
          <option value="">All Statuses</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="approved">Approved</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </Select>
      </div>

      <Card padding={false}>
        {loading ? <PageSpinner /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Group', 'Requested By', 'Amount', 'Reason', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.data.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                      <ArrowLeftRight size={32} className="mx-auto mb-2 text-gray-300" />
                      No withdrawals found
                    </td></tr>
                  )}
                  {data?.data.map(w => (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm text-gray-600">{w.groupName || w.groupId}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{w.requesterName || w.requestedBy}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900">ZMW {(w.amount ?? 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 max-w-48 truncate">{w.reason}</td>
                      <td className="px-5 py-3"><Badge label={w.status} variant={statusVariant(w.status)} /></td>
                      <td className="px-5 py-3 text-sm text-gray-500">{new Date(w.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && (
              <div className="px-5 py-3 border-t border-gray-100">
                <Pagination page={page} totalPages={data.pagination.totalPages} total={data.pagination.total} onPage={load} />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
