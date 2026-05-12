'use client';

import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';
import type { PayoutSchedule } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, statusVariant } from '@/components/ui/Badge';
import { PageSpinner } from '@/components/ui/Spinner';
import { Wallet, CheckCircle } from 'lucide-react';

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [disbursing, setDisbursing] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    admin.payouts.pending().then(r => setPayouts(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const disburse = async (id: string) => {
    setDisbursing(id);
    try { await admin.payouts.disburse(id); load(); }
    finally { setDisbursing(null); }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pending Payouts</h1>
        <p className="text-gray-500 mt-1">Disburse scheduled payouts to group members</p>
      </div>

      <Card padding={false}>
        {payouts.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
            <p className="text-gray-500">No pending payouts at this time</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Member', 'Cycle', 'Payout Order', 'Scheduled Date', 'Expected Amount', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payouts.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-900">{p.firstName} {p.lastName}</p>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-600">{p.cycleNumber}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">#{p.payoutOrder}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{new Date(p.scheduledDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-gray-900">ZMW {p.expectedAmount.toLocaleString()}</td>
                    <td className="px-5 py-3"><Badge label={p.status} variant={statusVariant(p.status)} /></td>
                    <td className="px-5 py-3">
                      <Button size="sm" loading={disbursing === String(i)} onClick={() => disburse(p.userId || String(i))}>
                        <Wallet size={13} /> Disburse
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
