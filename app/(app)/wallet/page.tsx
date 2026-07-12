'use client';

import { useEffect, useState } from 'react';
import { wallet, payments } from '@/lib/api';
import type { Wallet, LipilaTransaction } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Wallet as WalletIcon, Users, TrendingUp, Plus, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

const PROVIDERS = [
  { value: 'mtn',    label: 'MTN Mobile Money' },
  { value: 'airtel', label: 'Airtel Money' },
  { value: 'zamtel', label: 'Zamtel Kwacha' },
];

function statusIcon(status: string) {
  if (status === 'successful') return <CheckCircle size={14} className="text-green-500" />;
  if (status === 'failed')     return <XCircle     size={14} className="text-red-500"   />;
  return                              <Clock       size={14} className="text-amber-500" />;
}

export default function WalletPage() {
  const [wallets, setWallets]       = useState<Wallet[]>([]);
  const [history, setHistory]       = useState<LipilaTransaction[]>([]);
  const [loading, setLoading]       = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [targetWallet, setTargetWallet] = useState<Wallet | null>(null);

  // Deposit form state
  const [amount, setAmount]           = useState('');
  const [phone, setPhone]             = useState('');
  const [depositing, setDepositing]   = useState(false);
  const [depositResult, setDepositResult] = useState<{ success: boolean; message: string } | null>(null);

  const load = () =>
    Promise.all([
      wallet.list().then(r => setWallets(r.data)),
      payments.history().then(r => setHistory(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openDeposit = (w: Wallet) => {
    setTargetWallet(w);
    setAmount('');
    setPhone('');
    setDepositResult(null);
    setDepositOpen(true);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWallet) return;
    setDepositing(true);
    setDepositResult(null);
    try {
      const res = await payments.deposit(targetWallet.id, parseFloat(amount), phone);
      setDepositResult({ success: true, message: res.message });
    } catch (err: unknown) {
      setDepositResult({ success: false, message: err instanceof Error ? err.message : 'Deposit failed' });
    } finally {
      setDepositing(false);
    }
  };

  if (loading) return <PageSpinner />;

  const total = wallets.reduce((sum, w) => sum + w.balance, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Wallets</h1>
        <p className="text-gray-500 mt-1">Manage balances and top up via mobile money</p>
      </div>

      {/* Total balance */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white">
        <p className="text-teal-100 text-sm font-medium">Total Balance</p>
        <p className="text-4xl font-bold mt-1">ZMW {total.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}</p>
        <p className="text-teal-200 text-sm mt-2">{wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Wallet cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {wallets.map(w => (
          <Card key={w.id} className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${w.type === 'personal' ? 'bg-teal-100' : 'bg-purple-100'}`}>
                {w.type === 'personal'
                  ? <WalletIcon size={22} className="text-teal-600" />
                  : <Users      size={22} className="text-purple-600" />}
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${w.type === 'personal' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>
                {w.type === 'personal' ? 'Personal' : 'Group'}
              </span>
            </div>
            {w.groupName && <p className="text-sm font-medium text-gray-900 mb-1">{w.groupName}</p>}
            <p className="text-2xl font-bold text-gray-900">
              {w.currency} {w.balance.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
            </p>
            <div className="mt-4 flex gap-2">
              <Link href={`/transactions?walletId=${w.id}`} className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  <TrendingUp size={14} /> Transactions
                </Button>
              </Link>
              <Button size="sm" onClick={() => openDeposit(w)} className="flex-1">
                <Plus size={14} /> Top Up
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent payment history */}
      {history.length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Payment History</h2>
          <div className="space-y-2">
            {history.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  {statusIcon(t.status)}
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{t.type}</p>
                    <p className="text-xs text-gray-500">
                      {t.narration} · {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">ZMW {Number(t.amount).toLocaleString()}</p>
                  <Badge
                    label={t.status}
                    variant={t.status === 'successful' ? 'success' : t.status === 'failed' ? 'danger' : 'warning'}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Deposit modal */}
      <Modal
        open={depositOpen}
        onClose={() => { setDepositOpen(false); if (depositResult?.success) load(); }}
        title={`Top Up — ${targetWallet?.type === 'personal' ? 'Personal Wallet' : (targetWallet?.groupName ?? 'Group Wallet')}`}
      >
        {depositResult?.success ? (
          <div className="text-center py-4">
            <CheckCircle className="mx-auto mb-4 text-teal-600" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment request sent!</h3>
            <p className="text-sm text-gray-600 mb-6">{depositResult.message}</p>
            <p className="text-xs text-gray-400">Your balance will update automatically once you confirm the payment on your phone.</p>
            <Button className="mt-6 w-full" onClick={() => { setDepositOpen(false); load(); }}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleDeposit} className="space-y-4">
            {depositResult && !depositResult.success && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {depositResult.message}
              </div>
            )}
            <Input
              label="Amount (ZMW)"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 500"
              required
            />
            <Input
              label="Mobile Money Number"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="260971234567"
              required
            />
            <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
              You will receive a prompt on your phone to confirm the payment with your PIN.
              Supports MTN, Airtel, and Zamtel.
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setDepositOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" loading={depositing}>
                <Plus size={14} /> Top Up
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
