'use client';

import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';
import type { FeeConfig } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { Settings, Edit2 } from 'lucide-react';

export default function AdminFeesPage() {
  const [fees, setFees] = useState<FeeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editFee, setEditFee] = useState<FeeConfig | null>(null);
  const [newValue, setNewValue] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    admin.fees.list().then(r => setFees(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openEdit = (fee: FeeConfig) => {
    setEditFee(fee);
    setNewValue(String(fee.value));
    setIsActive(fee.isActive);
  };

  const handleSave = async () => {
    if (!editFee) return;
    setSaving(true);
    try {
      await admin.fees.update(editFee.id, Number(newValue), isActive);
      setEditFee(null);
      load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Fee Configuration</h1>
        <p className="text-gray-500 mt-1">Manage platform fee structures</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fees.length === 0 && (
          <div className="col-span-3 text-center py-16">
            <Settings size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No fee configurations found</p>
          </div>
        )}
        {fees.map(fee => (
          <Card key={fee.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="p-2.5 bg-amber-100 rounded-lg">
                <Settings size={18} className="text-amber-600" />
              </div>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${fee.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {fee.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">{fee.name}</h3>
            {fee.description && <p className="text-sm text-gray-500 mt-1">{fee.description}</p>}
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-400 uppercase">{fee.type}</p>
                <p className="text-2xl font-bold text-gray-900">{fee.value}%</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => openEdit(fee)}>
                <Edit2 size={13} /> Edit
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!editFee} onClose={() => setEditFee(null)} title={`Edit Fee: ${editFee?.name}`} size="sm">
        <div className="space-y-4">
          <Input label="Fee Value (%)" type="number" step="0.01" min="0" value={newValue} onChange={e => setNewValue(e.target.value)} />
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isActive" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-teal-600" />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditFee(null)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
