'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auth, payments, wallet } from '@/lib/api';
import type { PaymentMethod, Wallet } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { User, Lock, CheckCircle, Smartphone, Building2, Wallet as WalletIcon, Users, ShieldCheck, Clock, AlertTriangle, Upload, IdCard } from 'lucide-react';

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
  const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountName: '', branch: '', swiftCode: '' });
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
      if (bank) setBankForm({ bankName: bank.bankName || '', accountNumber: bank.accountNumber || '', accountName: bank.accountName || '', branch: bank.branch || '', swiftCode: bank.swiftCode || '' });
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
      await payments.saveBankDetails(bankForm.bankName, bankForm.accountNumber, bankForm.accountName, bankForm.branch, bankForm.swiftCode);
      setBankMsg('Bank details saved.');
    } catch (err: unknown) {
      setBankMsg(err instanceof Error ? err.message : 'Failed to save');
    } finally { setSavingBank(false); }
  };

  // ── KYC / identity verification ──
  const [kyc, setKyc] = useState({ idType: 'national_id' as 'national_id' | 'passport' | 'drivers_license', idNumber: '' });
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycMsg, setKycMsg] = useState('');

  useEffect(() => {
    if (user) setKyc({ idType: user.idType || 'national_id', idNumber: user.idNumber || '' });
  }, [user]);

  const kycState: 'verified' | 'pending' | 'rejected' | 'unsubmitted' =
    user?.idVerified ? 'verified'
    : user?.kycRejectionReason ? 'rejected'
    : user?.kycSubmittedAt ? 'pending'
    : 'unsubmitted';

  const handleKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setKycSubmitting(true);
    setKycMsg('');
    try {
      const fd = new FormData();
      fd.append('idType', kyc.idType);
      fd.append('idNumber', kyc.idNumber);
      if (idFront) fd.append('idFront', idFront);
      if (idBack) fd.append('idBack', idBack);
      await auth.submitKyc(fd);
      setKycMsg('Your ID has been submitted for review.');
      setIdFront(null); setIdBack(null);
      await refresh();
    } catch (err: unknown) {
      setKycMsg(err instanceof Error ? err.message : 'Submission failed');
    } finally { setKycSubmitting(false); }
  };

  const roleColors: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    member: 'bg-teal-100 text-teal-700',
  };

  const ID_TYPES = [
    { value: 'national_id', label: 'National ID (NRC)' },
    { value: 'drivers_license', label: "Driver's Licence" },
    { value: 'passport', label: 'Passport' },
  ] as const;

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

      {/* Identity verification (KYC) */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <IdCard size={18} /> Identity Verification
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
          Verify your identity to activate your account. An admin reviews your documents before approval.
        </p>

        {kycState === 'verified' && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <ShieldCheck size={22} className="text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">Your identity is verified</p>
              <p className="text-xs text-green-700 dark:text-green-400">{ID_TYPES.find(t => t.value === user?.idType)?.label} · {user?.idNumber}</p>
            </div>
          </div>
        )}

        {kycState === 'pending' && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <Clock size={22} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Under review</p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Your documents were submitted and are awaiting admin approval. We&apos;ll notify you once reviewed.
              </p>
            </div>
          </div>
        )}

        {(kycState === 'unsubmitted' || kycState === 'rejected') && (
          <form onSubmit={handleKyc} className="space-y-4">
            {kycState === 'rejected' && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertTriangle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Your previous submission was rejected</p>
                  <p className="text-xs text-red-600 dark:text-red-400">{user?.kycRejectionReason} Please correct and resubmit.</p>
                </div>
              </div>
            )}
            {kycMsg && (
              <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${kycMsg.includes('submitted') ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                {kycMsg.includes('submitted') && <CheckCircle size={16} />}{kycMsg}
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">ID type</label>
              <select
                value={kyc.idType}
                onChange={e => setKyc(k => ({ ...k, idType: e.target.value as typeof k.idType }))}
                className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-slate-700 dark:text-slate-100"
              >
                {ID_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <Input label="ID number" value={kyc.idNumber}
              onChange={e => setKyc(k => ({ ...k, idNumber: e.target.value }))}
              placeholder="e.g. 123456/78/9" required />
            <div className="grid grid-cols-2 gap-4">
              <FileField label="ID front image" file={idFront} existing={user?.idFrontUrl} onPick={setIdFront} />
              <FileField label="ID back image" file={idBack} existing={user?.idBackUrl} onPick={setIdBack} />
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500">Upload clear photos of both sides. JPEG/PNG, max 5 MB each.</p>
            <Button type="submit" loading={kycSubmitting}>
              <Upload size={14} /> {kycState === 'rejected' ? 'Resubmit for review' : 'Submit for review'}
            </Button>
          </form>
        )}
      </Card>

      {/* Balances — total + breakdown per group */}
      <Card>
        <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <WalletIcon size={18} /> My Balances
        </h2>
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-4 text-white mb-4">
          <p className="text-teal-100 text-xs font-medium">Total Balance</p>
          <p className="text-2xl font-bold mt-0.5">
            ZMW {wallets.reduce((s, w) => s + Number(w.balance), 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
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
          <div className="grid grid-cols-2 gap-4">
            <Input label="Branch (optional)" value={bankForm.branch} onChange={e => setBankForm(f => ({ ...f, branch: e.target.value }))} />
            <Input label="SWIFT/BIC code" value={bankForm.swiftCode} onChange={e => setBankForm(f => ({ ...f, swiftCode: e.target.value }))} placeholder="e.g. ZNCOZMLU" required />
          </div>
          <p className="text-xs text-gray-500">Required to receive payouts by bank transfer. Ask your bank if you don&apos;t know your SWIFT code.</p>
          <Button type="submit" loading={savingBank}>Save Bank Details</Button>
        </form>
      </Card>
    </div>
  );
}

// Image picker with preview for KYC uploads
function FileField({ label, file, existing, onPick }: {
  label: string; file: File | null; existing?: string; onPick: (f: File | null) => void;
}) {
  const preview = file ? URL.createObjectURL(file) : existing;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
      <label className="relative flex flex-col items-center justify-center h-28 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-teal-400 dark:hover:border-teal-500 overflow-hidden bg-gray-50 dark:bg-slate-700/40">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            <Upload size={20} className="text-gray-400 dark:text-slate-500" />
            <span className="text-xs text-gray-400 dark:text-slate-500 mt-1">Tap to upload</span>
          </>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={e => onPick(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  );
}
