'use client';

import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';
import type { Group, PaginatedResponse } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { Users } from 'lucide-react';

export default function AdminGroupsPage() {
  const [data, setData] = useState<PaginatedResponse<Group> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Group | null>(null);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('active');
  const [updating, setUpdating] = useState(false);

  const load = (p = 1) => {
    setLoading(true);
    admin.groups.list({ page: String(p), limit: '20' })
      .then(r => { setData(r); setPage(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatus = async () => {
    if (!selected) return;
    setUpdating(true);
    try { await admin.groups.updateStatus(selected.id, newStatus); setStatusModal(false); load(page); }
    finally { setUpdating(false); }
  };

  if (loading && !data) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Group Management</h1>
        <p className="text-gray-500 mt-1">View and manage all platform groups</p>
      </div>

      <Card padding={false}>
        {loading ? <PageSpinner /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Group', 'Monthly Amount', 'Members', 'Currency', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.data.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                      <Users size={32} className="mx-auto mb-2 text-gray-300" />
                      No groups found
                    </td></tr>
                  )}
                  {data?.data.map(g => (
                    <tr key={g.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">{g.name}</p>
                        {g.description && <p className="text-xs text-gray-500 truncate max-w-48">{g.description}</p>}
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">ZMW {(g.monthlyAmount ?? 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{g.memberCount || 0}/{g.maxMembers}</td>
                      <td className="px-5 py-3 text-sm text-gray-600">{g.currency}</td>
                      <td className="px-5 py-3"><Badge label={g.status} variant={statusVariant(g.status)} /></td>
                      <td className="px-5 py-3">
                        <Button size="sm" variant="outline" onClick={() => { setSelected(g); setNewStatus(g.status); setStatusModal(true); }}>
                          Change Status
                        </Button>
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

      <Modal open={statusModal} onClose={() => setStatusModal(false)} title={`Update Group: ${selected?.name}`} size="sm">
        <div className="space-y-4">
          <Select label="New Status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </Select>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setStatusModal(false)}>Cancel</Button>
            <Button onClick={handleStatus} loading={updating}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
