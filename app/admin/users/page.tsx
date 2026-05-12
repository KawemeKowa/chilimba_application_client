'use client';

import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';
import type { User, PaginatedResponse } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { Search, UserCheck, Ban, ShieldCheck } from 'lucide-react';

export default function AdminUsersPage() {
  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionOpen, setActionOpen] = useState(false);
  const [actionType, setActionType] = useState<'status' | 'verify'>('status');
  const [newStatus, setNewStatus] = useState('suspended');
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);

  const load = (p = 1) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(p), limit: '20' };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    admin.users.list(params)
      .then(r => { setData(r); setPage(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAction = (u: User, type: 'status' | 'verify') => {
    setSelectedUser(u);
    setActionType(type);
    setActionOpen(true);
    setReason('');
  };

  const handleAction = async () => {
    if (!selectedUser) return;
    setActing(true);
    try {
      if (actionType === 'verify') {
        await admin.users.verify(selectedUser.id);
      } else {
        await admin.users.updateStatus(selectedUser.id, newStatus, reason);
      }
      setActionOpen(false);
      load(page);
    } finally {
      setActing(false);
    }
  };

  if (loading && !data) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 mt-1">View, verify, and manage platform users</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-48 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(1)}
            placeholder="Search by name, email..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-44">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
        </Select>
        <Button onClick={() => load(1)}>Search</Button>
      </div>

      <Card padding={false}>
        {loading ? <PageSpinner /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['User', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.data.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-teal-700">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{u.email}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{u.phone || '—'}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-medium capitalize">{u.role?.replace('_', ' ')}</span>
                      </td>
                      <td className="px-5 py-3"><Badge label={u.status} variant={statusVariant(u.status)} /></td>
                      <td className="px-5 py-3 text-sm text-gray-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5">
                          {u.status === 'pending_verification' && (
                            <Button size="sm" variant="outline" onClick={() => openAction(u, 'verify')} className="text-green-600 border-green-300">
                              <ShieldCheck size={13} /> Verify
                            </Button>
                          )}
                          {u.status === 'active' && (
                            <Button size="sm" variant="outline" onClick={() => openAction(u, 'status')} className="text-amber-600 border-amber-300">
                              <Ban size={13} /> Suspend
                            </Button>
                          )}
                          {(u.status === 'suspended' || u.status === 'banned') && (
                            <Button size="sm" variant="outline" onClick={() => { setNewStatus('active'); openAction(u, 'status'); }} className="text-teal-600 border-teal-300">
                              <UserCheck size={13} /> Activate
                            </Button>
                          )}
                        </div>
                      </td>
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

      <Modal open={actionOpen} onClose={() => setActionOpen(false)} title={actionType === 'verify' ? 'Verify User' : 'Update User Status'} size="sm">
        {actionType === 'verify' ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to KYC-verify <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong>?
              This will activate their account.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setActionOpen(false)}>Cancel</Button>
              <Button onClick={handleAction} loading={acting}><ShieldCheck size={14} /> Verify User</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Select label="New Status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </Select>
            <Textarea label="Reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="Why is this status change happening?" />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setActionOpen(false)}>Cancel</Button>
              <Button onClick={handleAction} loading={acting}>Update Status</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
