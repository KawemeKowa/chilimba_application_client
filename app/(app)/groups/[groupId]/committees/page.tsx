'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { committees } from '@/lib/api';
import type { CommitteePool, Contributor, PaginatedResponse } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { Gift, Plus, Users, Target } from 'lucide-react';

const CATEGORIES = ['funeral', 'wedding', 'emergency', 'medical', 'education', 'other'];

export default function CommitteesPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [data, setData] = useState<PaginatedResponse<CommitteePool> | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [contributePool, setContributePool] = useState<CommitteePool | null>(null);
  const [viewContributors, setViewContributors] = useState<CommitteePool | null>(null);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [creating, setCreating] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [error, setError] = useState('');
  const [contribAmount, setContribAmount] = useState('');
  const [contribMessage, setContribMessage] = useState('');

  const load = () => {
    setLoading(true);
    committees.list(groupId, { page: '1', limit: '20' })
      .then(r => setData(r))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [groupId]);

  const loadContributors = async (pool: CommitteePool) => {
    setViewContributors(pool);
    const res = await committees.contributors(pool.id);
    setContributors(res.data);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    body.targetAmount = Number(body.targetAmount) as unknown as string;
    try {
      await committees.create(groupId, body);
      setCreateOpen(false);
      load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setCreating(false);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributePool) return;
    setContributing(true);
    try {
      await committees.contribute(contributePool.id, { amount: Number(contribAmount), message: contribMessage, isAnonymous: false });
      setContributePool(null);
      setContribAmount(''); setContribMessage('');
      load();
    } finally {
      setContributing(false);
    }
  };

  const handleClose = async (id: string) => {
    await committees.close(id);
    load();
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Committees</h1>
          <p className="text-gray-500 mt-1">Crowdfunding campaigns for group members</p>
        </div>
        <Button onClick={() => { setError(''); setCreateOpen(true); }}>
          <Plus size={16} /> Create Campaign
        </Button>
      </div>

      {data?.data.length === 0 ? (
        <Card className="text-center py-12">
          <Gift size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No campaigns yet. Start one for your group!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data?.data.map(pool => {
            const progress = (pool.currentAmount / pool.targetAmount) * 100;
            return (
              <Card key={pool.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{pool.title}</h3>
                    <p className="text-sm text-gray-500 capitalize">{pool.category}</p>
                  </div>
                  <Badge label={pool.status} variant={statusVariant(pool.status)} />
                </div>
                {pool.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{pool.description}</p>}
                {pool.beneficiary && (
                  <p className="text-sm text-gray-500 mb-3">Beneficiary: <span className="font-medium">{pool.beneficiary}</span></p>
                )}

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">ZMW {pool.currentAmount.toLocaleString()}</span>
                    <span className="font-medium text-gray-900">ZMW {pool.targetAmount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{Math.round(progress)}% funded · Closes {new Date(pool.closesAt).toLocaleDateString()}</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {pool.status === 'active' && (
                    <Button size="sm" onClick={() => setContributePool(pool)}>
                      <Gift size={14} /> Contribute
                    </Button>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => loadContributors(pool)}>
                    <Users size={14} /> {pool.contributorCount || 0} Contributors
                  </Button>
                  {pool.status === 'active' && (
                    <Button variant="ghost" size="sm" onClick={() => handleClose(pool.id)}>
                      Close
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Campaign" size="lg">
        {error && <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Title" name="title" placeholder="Funeral support for..." required />
          <Textarea label="Description" name="description" placeholder="Describe the campaign..." />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" name="category" required>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </Select>
            <Input label="Target Amount (ZMW)" name="targetAmount" type="number" min="1" placeholder="10000" required />
          </div>
          <Input label="Beneficiary" name="beneficiary" placeholder="Who benefits?" />
          <Input label="Closes At" name="closesAt" type="datetime-local" required />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" loading={creating}>Create Campaign</Button>
          </div>
        </form>
      </Modal>

      {/* Contribute modal */}
      <Modal open={!!contributePool} onClose={() => setContributePool(null)} title={`Contribute to: ${contributePool?.title}`} size="sm">
        <form onSubmit={handleContribute} className="space-y-4">
          <Input label="Amount (ZMW)" type="number" min="1" value={contribAmount} onChange={e => setContribAmount(e.target.value)} placeholder="200" required />
          <Input label="Message (optional)" value={contribMessage} onChange={e => setContribMessage(e.target.value)} placeholder="Sending love..." />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setContributePool(null)}>Cancel</Button>
            <Button type="submit" loading={contributing}>Contribute</Button>
          </div>
        </form>
      </Modal>

      {/* Contributors modal */}
      <Modal open={!!viewContributors} onClose={() => setViewContributors(null)} title="Contributors" size="sm">
        <div className="space-y-2">
          {contributors.length === 0 && <p className="text-center text-gray-500 py-4">No contributions yet</p>}
          {contributors.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
              <div>
                <p className="font-medium text-gray-900">{c.isAnonymous ? 'Anonymous' : `${c.firstName} ${c.lastName}`}</p>
                {c.message && <p className="text-gray-500 text-xs">{c.message}</p>}
              </div>
              <span className="font-semibold">ZMW {c.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
