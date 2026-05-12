'use client';

import { useEffect, useState } from 'react';
import { superAdmin } from '@/lib/api';
import type { User } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { Shield, UserCheck } from 'lucide-react';

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<User | null>(null);
  const [roleModal, setRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('admin');
  const [updating, setUpdating] = useState(false);

  const load = () => {
    setLoading(true);
    superAdmin.admins.list().then(r => setAdmins(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRoleUpdate = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      await superAdmin.admins.updateRole(selected.id, newRole);
      setRoleModal(false);
      load();
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <PageSpinner />;

  const roleColors: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
    admin: 'bg-blue-100 text-blue-700 border-blue-200',
    member: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
        <p className="text-gray-500 mt-1">View and manage platform administrators</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {admins.length === 0 && (
          <div className="col-span-3 text-center py-16">
            <Shield size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No administrators found</p>
          </div>
        )}
        {admins.map(a => (
          <Card key={a.id}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-700 text-lg font-bold">{a.firstName?.[0]}{a.lastName?.[0]}</span>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${roleColors[a.role] || roleColors.member}`}>
                {a.role?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <h3 className="font-semibold text-gray-900">{a.firstName} {a.lastName}</h3>
            <p className="text-sm text-gray-500">{a.email}</p>
            {a.phone && <p className="text-sm text-gray-400">{a.phone}</p>}
            <div className="mt-4">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => { setSelected(a); setNewRole(a.role); setRoleModal(true); }}
              >
                <UserCheck size={13} /> Change Role
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={roleModal} onClose={() => setRoleModal(false)} title={`Update Role: ${selected?.firstName} ${selected?.lastName}`} size="sm">
        <div className="space-y-4">
          <Select label="New Role" value={newRole} onChange={e => setNewRole(e.target.value)}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </Select>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRoleModal(false)}>Cancel</Button>
            <Button onClick={handleRoleUpdate} loading={updating}>Update Role</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
