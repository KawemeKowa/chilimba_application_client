'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

function statusIcon(status: string) {
  if (status === 'successful') return <CheckCircle size={14} className="text-green-500" />;
  if (status === 'failed')     return <XCircle     size={14} className="text-red-500"   />;
  return                              <Clock       size={14} className="text-amber-500" />;
}

export default function WalletPage() {
  const searchParams = useSearchParams();
  const [wallets, setWallets]       = useState<Wallet[]>([]);
  const [history, setHistory]       = useState<LipilaTransaction[]>([]);
  const [loading, setLoading]       = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [targetWallet, setTargetWallet] = useState<Wallet | null>(null);

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

  // Auto-open deposit for a group wallet when arriving from ?deposit=groupId.
  // If the member has no wallet row for that group yet, the API creates it on deposit.
  useEffect(() => {
    const depositGroupId = searchParams.get('deposit');
    if (depositGroupId && !loading) {
      const target = wallets.find(w => w.groupId === depositGroupId)
        ?? { id: '', type: 'group' as const, groupId: depositGroupId, balance: 0, currency: 'ZMW' };
      openDeposit(target);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

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
      const res = await payments.deposit(
        targetWallet.type === 'group' && targetWallet.groupId
          ? { groupId: targetWallet.groupId }
          : { walletId: targetWallet.id },
        parseFloat(amount), phone
      );
      setDepositResult({ success: true, message: res.message });
    } catch (err: unknown) {
      setDepositResult({ success: false, message: err instanceof Error ? err.message : 'Deposit failed' });
    } finally {
      setDepositing(false);
    }
  };

  if (loading) return <PageSpinner />;

  const total = wallets.reduce((sum, w) => sum + w.balance, 0);

  const monthly = targetWallet?.monthlyAmount ?? 0;
  const preloadOptions = monthly > 0
    ? [
        { label: '1 month',  amount: monthly },
        { label: '3 months', amount: monthly * 3 },
        { label: '6 months', amount: monthly * 6 },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">My Wallets</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1">Manage balances and top up via mobile money</p>
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
              <div className={`p-3 rounded-xl ${w.type === 'personal' ? 'bg-teal-100 dark:bg-teal-900/40' : 'bg-purple-100 dark:bg-purple-900/40'}`}>
                {w.type === 'personal'
                  ? <WalletIcon size={22} className="text-teal-600 dark:text-teal-400" />
                  : <Users      size={22} className="text-purple-600 dark:text-purple-400" />}
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${w.type === 'personal' ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300' : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'}`}>
                {w.type === 'personal' ? 'Personal' : 'Group'}
              </span>
            </div>
            {w.groupName && <p className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-1">{w.groupName}</p>}
            <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
              {w.currency} {w.balance.toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
            </p>
            {w.monthlyAmount && (
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                Monthly due: {w.currency} {w.monthlyAmount.toLocaleString()} ·{' '}
                {w.balance >= w.monthlyAmount
                  ? <span className="text-green-600 dark:text-green-400 font-medium">{Math.floor(w.balance / w.monthlyAmount)} month{Math.floor(w.balance / w.monthlyAmount) !== 1 ? 's' : ''} covered</span>
                  : <span className="text-amber-600 dark:text-amber-400 font-medium">top up needed</span>}
              </p>
            )}
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
          <h2 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Payment History</h2>
          <div className="space-y-2">
            {history.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  {statusIcon(t.status)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-slate-100 capitalize">{t.type}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {t.narration} · {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-slate-100">ZMW {Number(t.amount).toLocaleString()}</p>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Payment request sent!</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">{depositResult.message}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">Your balance will update automatically once you confirm the payment on your phone.</p>
            <Button className="mt-6 w-full" onClick={() => { setDepositOpen(false); load(); }}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleDeposit} className="space-y-4">
            {depositResult && !depositResult.success && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {depositResult.message}
              </div>
            )}

            {/* Pre-load quick-fill for group wallets */}
            {preloadOptions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">
                  Quick fill — monthly due: {targetWallet?.currency} {monthly.toLocaleString()}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {preloadOptions.map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setAmount(String(opt.amount))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        amount === String(opt.amount)
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400'
                      }`}
                    >
                      {opt.label} — {targetWallet?.currency} {opt.amount.toLocaleString()}
                    </button>
                  ))}
                </div>
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
            <div className="text-xs text-gray-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3">
              You will receive a prompt on your phone to confirm the payment with your PIN.
              Supports MTN, Airtel, and Zamtel. You can deposit in advance to cover multiple months at once.
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
