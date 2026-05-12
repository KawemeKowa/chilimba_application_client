'use client';

import { useEffect, useState, useCallback } from 'react';
import { wallet } from '@/lib/api';
import type { Transaction, PaginatedResponse } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { Input, Select } from '@/components/ui/Input';
import { ArrowLeftRight, Filter, X } from 'lucide-react';

const TX_TYPES = ['contribution', 'payout', 'withdrawal', 'fee', 'committee', 'refund', 'adjustment'];

export default function TransactionsPage() {
  const [data, setData] = useState<PaginatedResponse<Transaction> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', startDate: '', endDate: '' });
  const [applied, setApplied] = useState(false);

  const load = useCallback((p = 1, f = filters) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(p), limit: '20' };
    if (f.type) params.type = f.type;
    if (f.startDate) params.startDate = f.startDate;
    if (f.endDate) params.endDate = f.endDate;
    wallet.transactions(params)
      .then(r => { setData(r); setPage(p); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, []);

  const applyFilters = () => { setApplied(true); load(1, filters); };
  const clearFilters = () => {
    const empty = { type: '', startDate: '', endDate: '' };
    setFilters(empty);
    setApplied(false);
    load(1, empty);
  };

  const txTypeColor = (type: string) => {
    if (['payout', 'contribution'].includes(type)) return 'text-green-600';
    if (['withdrawal', 'fee'].includes(type)) return 'text-red-500';
    return 'text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-gray-500 mt-1">View, filter, and export your complete financial activity</p>
      </div>

      {/* Filters */}
      <Card>
        <h2 className="font-medium text-gray-900 mb-4 flex items-center gap-2"><Filter size={16} /> Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select label="Transaction Type" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
            <option value="">All Types</option>
            {TX_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </Select>
          <Input label="From Date" type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
          <Input label="To Date" type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
        </div>
        <div className="flex gap-3 mt-4">
          <Button onClick={applyFilters}><Filter size={14} /> Apply Filters</Button>
          {applied && <Button variant="ghost" onClick={clearFilters}><X size={14} /> Clear</Button>}
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <PageSpinner />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Date', 'Type', 'From', 'To', 'Amount', 'Status', 'Reference'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-5 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.data.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                      <ArrowLeftRight size={32} className="mx-auto mb-2 text-gray-300" />
                      No transactions found
                    </td></tr>
                  )}
                  {data?.data.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm text-gray-600">{new Date(tx.createdAt).toLocaleDateString()}</td>
                      <td className={`px-5 py-3 text-sm font-medium capitalize ${txTypeColor(tx.type)}`}>{tx.type}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 max-w-24 truncate">{tx.from || '—'}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 max-w-24 truncate">{tx.to || '—'}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900">ZMW {tx.amount.toLocaleString()}</td>
                      <td className="px-5 py-3"><Badge label={tx.status} variant={statusVariant(tx.status)} /></td>
                      <td className="px-5 py-3 text-xs text-gray-400 font-mono truncate max-w-28">{tx.reference || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && (
              <div className="px-5 py-3 border-t border-gray-100">
                <Pagination page={page} totalPages={data.pagination.totalPages} total={data.pagination.total} onPage={p => load(p)} />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
