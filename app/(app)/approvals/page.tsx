'use client';

import { useEffect, useState } from 'react';
import { withdrawals } from '@/lib/api';
import type { Withdrawal } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { contributions } from '@/lib/api';
import type { Contribution } from '@/lib/api';
import { CheckSquare, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [pendingContributions, setPendingContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [contribRes] = await Promise.allSettled([
        contributions.upcoming(),
      ]);
      if (contribRes.status === 'fulfilled') setPendingContributions(contribRes.value.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleVote = async (id: string, action: 'approved' | 'rejected') => {
    setVoting(id);
    try { await withdrawals.vote(id, action); load(); }
    finally { setVoting(null); }
  };

  const handlePay = async (id: string) => {
    setPaying(id);
    try { await contributions.pay(id); load(); }
    finally { setPaying(null); }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="text-gray-500 mt-1">Review and act on pending items requiring your attention</p>
      </div>

      {/* Pending contributions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <CheckSquare size={20} className="text-teal-600" /> Pending Contributions
          <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
            {pendingContributions.length}
          </span>
        </h2>
        {pendingContributions.length === 0 ? (
          <Card className="text-center py-8">
            <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
            <p className="text-gray-500">No pending contributions</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingContributions.map(c => (
              <Card key={c.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{c.groupName || 'Group'}</p>
                    <p className="text-sm text-gray-500">Due: {new Date(c.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">ZMW {(c.amount ?? 0).toLocaleString()}</p>
                      <Badge label={c.status} variant={statusVariant(c.status)} />
                    </div>
                    <Button size="sm" loading={paying === c.id} onClick={() => handlePay(c.id)}>
                      <CheckCircle size={14} /> Pay Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Pending withdrawals from all groups would go here */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ThumbsUp size={20} className="text-teal-600" /> Withdrawal Approvals
        </h2>
        {pendingWithdrawals.length === 0 ? (
          <Card className="text-center py-8">
            <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
            <p className="text-gray-500">No pending withdrawal approvals across your groups</p>
            <p className="text-xs text-gray-400 mt-1">Visit individual group pages to approve withdrawals</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingWithdrawals.map(w => (
              <Card key={w.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">ZMW {(w.amount ?? 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-600 mt-1">{w.reason}</p>
                    <p className="text-xs text-gray-400 mt-1">By {w.requesterName || w.requestedBy}</p>
                  </div>
                  {w.requestedBy !== user?.id && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" loading={voting === w.id} onClick={() => handleVote(w.id, 'approved')} className="text-green-600 border-green-300">
                        <ThumbsUp size={14} /> Approve
                      </Button>
                      <Button variant="outline" size="sm" loading={voting === w.id} onClick={() => handleVote(w.id, 'rejected')} className="text-red-600 border-red-300">
                        <ThumbsDown size={14} /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
