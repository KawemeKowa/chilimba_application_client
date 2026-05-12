'use client';

import { useEffect, useState } from 'react';
import { superAdmin } from '@/lib/api';
import type { AuditLog, PaginatedResponse } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { FileText, Filter, X } from 'lucide-react';

export default function AuditLogsPage() {
  const [data, setData] = useState<PaginatedResponse<AuditLog> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', entityType: '', startDate: '', endDate: '' });

  const load = (p = 1) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(p), limit: '20' };
    if (filters.action) params.action = filters.action;
    if (filters.entityType) params.entityType = filters.entityType;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    superAdmin.auditLogs(params)
      .then(r => { setData(r); setPage(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const clear = () => {
    setFilters({ action: '', entityType: '', startDate: '', endDate: '' });
    load(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500 mt-1">Full audit trail of all platform actions</p>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-gray-500" />
          <h2 className="font-medium text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input label="Action" placeholder="e.g. user_banned" value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))} />
          <Select label="Entity Type" value={filters.entityType} onChange={e => setFilters(f => ({ ...f, entityType: e.target.value }))}>
            <option value="">All</option>
            <option value="user">User</option>
            <option value="group">Group</option>
            <option value="payout">Payout</option>
            <option value="withdrawal">Withdrawal</option>
          </Select>
          <Input label="Start Date" type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
          <Input label="End Date" type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
        </div>
        <div className="flex gap-3 mt-4">
          <Button onClick={() => load(1)}><Filter size={14} /> Apply</Button>
          <Button variant="ghost" onClick={clear}><X size={14} /> Clear</Button>
        </div>
      </Card>

      <Card padding={false}>
        {loading ? <PageSpinner /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Date', 'Action', 'Actor', 'Entity Type', 'Details'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.data.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-12 text-gray-400">
                      <FileText size={32} className="mx-auto mb-2 text-gray-300" />
                      No audit logs found
                    </td></tr>
                  )}
                  {data?.data.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <code className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{log.action}</code>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">{log.actorName || log.actorId}</td>
                      <td className="px-5 py-3 text-sm text-gray-600 capitalize">{log.entityType || '—'}</td>
                      <td className="px-5 py-3 text-sm text-gray-500 max-w-48 truncate">{log.details || '—'}</td>
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
