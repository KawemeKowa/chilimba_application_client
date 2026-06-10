'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { withdrawals } from '@/lib/api';
import type { Withdrawal, PaginatedResponse } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftRight, Plus, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function WithdrawalsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<PaginatedResponse<Withdrawal> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [requestOpen, setRequestOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const load = (p = 1) => {
    setLoading(true);
    withdrawals.list(groupId, { page: String(p), limit: '20' })
      .then(r => { setData(r); setPage(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [groupId]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequesting(true);
    setError('');
    try {
      await withdrawals.request(groupId, Number(amount), reason);
      setRequestOpen(false);
      setAmount(''); setReason('');
      load(page);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setRequesting(false);
    }
  };

  const handleVote = async (id: string, action: 'approved' | 'rejected') => {
    setVoting(id);
    try { await withdrawals.vote(id, action); load(page); }
    finally { setVoting(null); }
  };

  if (loading && !data) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Withdrawals</h1>
          <p className="text-gray-500 mt-1">Request and vote on group withdrawals</p>
        </div>
        <Button onClick={() => { setError(''); setRequestOpen(true); }}>
          <Plus size={16} /> Request Withdrawal
        </Button>
      </div>

      <div className="space-y-4">
        {data?.data.length === 0 && (
          <Card className="text-center py-12">
            <ArrowLeftRight size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No withdrawal requests yet</p>
          </Card>
        )}
        {data?.data.map(w => (
          <Card key={w.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-gray-900">ZMW {(w.amount ?? 0).toLocaleString()}</span>
                  <Badge label={w.status} variant={statusVariant(w.status)} />
                </div>
                <p className="text-sm text-gray-600 mb-2">{w.reason}</p>
                <p className="text-xs text-gray-400">
                  Requested by {w.requesterName || w.requestedBy} · {new Date(w.createdAt).toLocaleDateString()}
                </p>
                {w.approvalsNeeded && (
                  <p className="text-xs text-gray-500 mt-1">
                    {w.approvalsCount || 0}/{w.approvalsNeeded} approvals needed
                  </p>
                )}
              </div>
              {w.status === 'pending_approval' && w.requestedBy !== user?.id && (
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => handleVote(w.id, 'approved')}
                    loading={voting === w.id}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    <ThumbsUp size={14} /> Approve
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => handleVote(w.id, 'rejected')}
                    loading={voting === w.id}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <ThumbsDown size={14} /> Reject
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {data && (
        <Pagination page={page} totalPages={data.pagination.totalPages} total={data.pagination.total} onPage={load} />
      )}

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Request Withdrawal" size="sm">
        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
        <form onSubmit={handleRequest} className="space-y-4">
          <Input label="Amount (ZMW)" type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="1500" required />
          <Textarea label="Reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe why this withdrawal is needed..." required />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setRequestOpen(false)}>Cancel</Button>
            <Button type="submit" loading={requesting}>Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
