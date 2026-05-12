'use client';

import { useEffect, useState } from 'react';
import { superAdmin } from '@/lib/api';
import type { PlatformSetting } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { Settings, Save } from 'lucide-react';

const SETTING_LABELS: Record<string, string> = {
  min_contribution_amount: 'Min Contribution Amount (ZMW)',
  max_members_per_group: 'Max Members Per Group',
  withdrawal_expiry_hours: 'Withdrawal Expiry (hours)',
  maintenance_mode: 'Maintenance Mode',
  max_groups_per_user: 'Max Groups Per User',
  kyc_required: 'KYC Required',
};

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, string>>({});

  const load = () => {
    setLoading(true);
    superAdmin.settings.list().then(r => {
      setSettings(r.data);
      const initial: Record<string, string> = {};
      r.data.forEach(s => { initial[s.key] = s.value; });
      setEdits(initial);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async (key: string) => {
    setSaving(key);
    setMessages(m => ({ ...m, [key]: '' }));
    try {
      await superAdmin.settings.update(key, edits[key]);
      setMessages(m => ({ ...m, [key]: 'Saved!' }));
      setTimeout(() => setMessages(m => ({ ...m, [key]: '' })), 2000);
      load();
    } catch (err: unknown) {
      setMessages(m => ({ ...m, [key]: err instanceof Error ? err.message : 'Failed' }));
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-500 mt-1">Configure global platform behavior</p>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-6">
          <Settings size={20} className="text-teal-600" />
          <h2 className="font-semibold text-gray-900">Configuration</h2>
        </div>
        <div className="space-y-5">
          {settings.map(s => (
            <div key={s.key} className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  label={SETTING_LABELS[s.key] || s.key}
                  value={edits[s.key] || ''}
                  onChange={e => setEdits(prev => ({ ...prev, [s.key]: e.target.value }))}
                />
                {s.description && <p className="text-xs text-gray-400 mt-1">{s.description}</p>}
                {messages[s.key] && (
                  <p className={`text-xs mt-1 ${messages[s.key] === 'Saved!' ? 'text-green-600' : 'text-red-500'}`}>
                    {messages[s.key]}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                loading={saving === s.key}
                onClick={() => save(s.key)}
                disabled={edits[s.key] === s.value}
              >
                <Save size={14} />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
