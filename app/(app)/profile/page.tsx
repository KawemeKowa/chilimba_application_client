'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { User, Lock, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [form, setForm] = useState({ firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const handleProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg('');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    try {
      await auth.updateMe(fd);
      await refresh();
      setProfileMsg('Profile updated successfully!');
    } catch (err: unknown) {
      setProfileMsg(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { setPwMsg('Passwords do not match'); return; }
    setChangingPw(true);
    setPwMsg('');
    try {
      await auth.changePassword(pwForm.currentPassword, pwForm.newPassword);
      setPwMsg('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err: unknown) {
      setPwMsg(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  const roleColors: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    member: 'bg-teal-100 text-teal-700',
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account information</p>
      </div>

      {/* Profile header */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <span className="text-teal-700 text-2xl font-bold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{user?.firstName} {user?.lastName}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${roleColors[user?.role || 'member']}`}>
                {user?.role?.replace('_', ' ').toUpperCase()}
              </span>
              <Badge label={user?.status || 'unknown'} variant={user?.status === 'active' ? 'success' : 'warning'} />
            </div>
          </div>
        </div>
      </Card>

      {/* Edit profile */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><User size={18} /> Personal Information</h2>
        {profileMsg && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${profileMsg.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {profileMsg.includes('successfully') && <CheckCircle size={16} />}
            {profileMsg}
          </div>
        )}
        <form onSubmit={handleProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First name" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
            <Input label="Last name" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
          </div>
          <Input label="Phone number" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          <Input label="Email address" type="email" value={user?.email || ''} disabled className="bg-gray-50 text-gray-500" />
          <Button type="submit" loading={saving}>Save Changes</Button>
        </form>
      </Card>

      {/* Change password */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Lock size={18} /> Change Password</h2>
        {pwMsg && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${pwMsg.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {pwMsg.includes('successfully') && <CheckCircle size={16} />}
            {pwMsg}
          </div>
        )}
        <form onSubmit={handlePassword} className="space-y-4">
          <Input label="Current password" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required />
          <Input label="New password" type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required />
          <Input label="Confirm new password" type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
          <Button type="submit" loading={changingPw}>Change Password</Button>
        </form>
      </Card>
    </div>
  );
}
