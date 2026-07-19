'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth, payments, wallet } from '@/lib/api';
import type { PaymentMethod, Wallet } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { User, Lock, CheckCircle, Smartphone, Building2, Wallet as WalletIcon, Users } from 'lucide-react';

const PROVIDERS = [
  { value: 'mtn',    label: 'MTN Mobile Money' },
  { value: 'airtel', label: 'Airtel Money' },
  { value: 'zamtel', label: 'Zamtel Kwacha' },
] as const;

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

  // Wallet balances
  const [wallets, setWallets] = useState<Wallet[]>([]);
  useEffect(() => {
    wallet.list().then(r => setWallets(r.data)).catch(() => {});
  }, []);

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [momoForm, setMomoForm] = useState({ mobileNumber: '', provider: 'mtn' as 'mtn' | 'airtel' | 'zamtel' });
  const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountName: '', branch: '' });
  const [savingMomo, setSavingMomo] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [momoMsg, setMomoMsg] = useState('');
  const [bankMsg, setBankMsg] = useState('');

  useEffect(() => {
    payments.methods().then(r => {
      setPaymentMethods(r.data);
      const momo = r.data.find(m => m.type === 'mobile_money');
      const bank = r.data.find(m => m.type === 'bank');
      if (momo) setMomoForm({ mobileNumber: momo.mobileNumber || '', provider: (momo.mobileProvider as 'mtn' | 'airtel' | 'zamtel') || 'mtn' });
      if (bank) setBankForm({ bankName: bank.bankName || '', accountNumber: bank.accountNumber || '', accountName: bank.accountName || '', branch: bank.branch || '' });
    }).catch(() => {});
  }, []);

  const handleSaveMomo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMomo(true);
    setMomoMsg('');
    try {
      await payments.saveMobileMoney(momoForm.mobileNumber, momoForm.provider);
      setMomoMsg('Mobile money details saved.');
    } catch (err: unknown) {
      setMomoMsg(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSavingMomo(false); }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    setBankMsg('');
    try {
      await payments.saveBankDetails(bankForm.bankName, bankForm.accountNumber, bankForm.accountName, bankForm.branch);
      setBankMsg('Bank details saved.');
    } catch (err: unknown) {
      setBankMsg(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSavingBank(false); }
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

      {/* Balances — total + breakdown per group */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <WalletIcon size={18} /> My Balances
        </h2>
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-4 text-white mb-4">
          <p className="text-teal-100 text-xs font-medium">Total Balance</p>
          <p className="text-2xl font-bold mt-0.5">
            ZMW {wallets.reduce((s, w) => s + w.balance, 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
          </p>
        </div>
        {wallets.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">No wallets yet</p>
        ) : (
          <div className="space-y-2">
            {wallets.map(w => (
              <div key={w.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${w.type === 'personal' ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-purple-100 dark:bg-purple-900/40'}`}>
                    {w.type === 'personal'
                      ? <WalletIcon size={15} className="text-teal-600 dark:text-teal-400" />
                      : <Users      size={15} className="text-purple-600 dark:text-purple-400" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100">
                      {w.type === 'personal' ? 'Personal Wallet' : (w.groupName ?? 'Group Wallet')}
                    </p>
                    {w.monthlyAmount && (
                      <p className="text-xs text-gray-500 dark:text-slate-400">
                        Monthly due: {w.currency} {w.monthlyAmount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-semibold text-gray-900 dark:text-slate-100">
                  {w.currency} {w.balance.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}
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

      {/* Mobile money */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2"><Smartphone size={18} /> Mobile Money</h2>
        <p className="text-sm text-gray-500 mb-4">Used to receive payouts and top up your wallet.</p>
        {momoMsg && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${momoMsg.includes('saved') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {momoMsg.includes('saved') && <CheckCircle size={16} />}
            {momoMsg}
          </div>
        )}
        <form onSubmit={handleSaveMomo} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Provider</label>
            <select
              value={momoForm.provider}
              onChange={e => setMomoForm(f => ({ ...f, provider: e.target.value as 'mtn' | 'airtel' | 'zamtel' }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <Input
            label="Mobile number"
            type="tel"
            value={momoForm.mobileNumber}
            onChange={e => setMomoForm(f => ({ ...f, mobileNumber: e.target.value }))}
            placeholder="260971234567"
            required
          />
          <Button type="submit" loading={savingMomo}>Save Mobile Money</Button>
        </form>
      </Card>

      {/* Bank details */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2"><Building2 size={18} /> Bank Account</h2>
        <p className="text-sm text-gray-500 mb-4">For direct bank transfer payouts.</p>
        {bankMsg && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${bankMsg.includes('saved') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {bankMsg.includes('saved') && <CheckCircle size={16} />}
            {bankMsg}
          </div>
        )}
        <form onSubmit={handleSaveBank} className="space-y-4">
          <Input label="Bank name" value={bankForm.bankName} onChange={e => setBankForm(f => ({ ...f, bankName: e.target.value }))} placeholder="e.g. Zanaco, Stanbic, FNB" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Account number" value={bankForm.accountNumber} onChange={e => setBankForm(f => ({ ...f, accountNumber: e.target.value }))} required />
            <Input label="Account name" value={bankForm.accountName} onChange={e => setBankForm(f => ({ ...f, accountName: e.target.value }))} required />
          </div>
          <Input label="Branch (optional)" value={bankForm.branch} onChange={e => setBankForm(f => ({ ...f, branch: e.target.value }))} />
          <Button type="submit" loading={savingBank}>Save Bank Details</Button>
        </form>
      </Card>
    </div>
  );
}
