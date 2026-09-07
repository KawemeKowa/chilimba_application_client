'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { wallet, payments } from '@/lib/api';
import { normalizeZmPhone, formatZmPhone } from '@/lib/phone';
import type { Wallet, LipilaTransaction } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageSpinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Wallet as WalletIcon, Users, TrendingUp, Plus, CheckCircle, Clock, XCircle, Smartphone, CreditCard, RefreshCw, Send, ArrowDownToLine, Building2 } from 'lucide-react';
import Link from 'next/link';

function statusIcon(status: string) {
  if (status === 'successful') return <CheckCircle size={14} className="text-green-500" />;
  if (status === 'failed')     return <XCircle     size={14} className="text-red-500"   />;
  return                              <Clock       size={14} className="text-amber-500" />;
}

// Opening window.open with explicit width/height (rather than just '_blank')
// makes browsers render it as a separate popup window instead of a new tab.
function openCheckoutPopup(url: string) {
  const width = 480;
  const height = 720;
  const left = window.screenX + Math.max(0, (window.outerWidth - width) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - height) / 2);
  window.open(
    url,
    'lipila-card-checkout',
    `width=${width},height=${height},left=${left},top=${top},noopener,noreferrer,popup=yes`
  );
}

export default function WalletPage() {
  const searchParams = useSearchParams();
  const [wallets, setWallets]       = useState<Wallet[]>([]);
  const [history, setHistory]       = useState<LipilaTransaction[]>([]);
  const [loading, setLoading]       = useState(true);
  const [depositOpen, setDepositOpen] = useState(false);
  const [targetWallet, setTargetWallet] = useState<Wallet | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const [amount, setAmount]           = useState('');
  const [phone, setPhone]             = useState('');
  const [method, setMethod]           = useState<'mobile_money' | 'card'>('mobile_money');

  // Personal wallet → group transfer
  const [transferOpen, setTransferOpen]   = useState(false);
  const [transferGroup, setTransferGroup] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferring, setTransferring]   = useState(false);

  // Personal wallet → mobile money / bank
  const [withdrawOpen, setWithdrawOpen]   = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawTo, setWithdrawTo]       = useState<'mobile_money' | 'bank'>('mobile_money');
  const [withdrawing, setWithdrawing]     = useState(false);

  const [actionMsg, setActionMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [depositing, setDepositing]   = useState(false);
  const [depositResult, setDepositResult] = useState<
    { success: boolean; message: string; paymentUrl?: string | null; resolvedStatus?: 'successful' | 'failed' } | null
  >(null);
  // Reference of an in-flight card payment we're polling for a final outcome.
  const [pendingRef, setPendingRef] = useState<string | null>(null);

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

  // While a card payment is in flight, poll our own transaction history for
  // the final outcome (the webhook resolves it server-side). When it lands,
  // update the modal to a success/failed state so the user doesn't have to
  // guess or click around. The popup's return message triggers an early check.
  useEffect(() => {
    if (!pendingRef) return;
    let active = true;

    const check = async () => {
      try {
        const r = await payments.history();
        if (!active) return;
        setHistory(r.data);
        const txn = r.data.find(t => t.referenceId === pendingRef);
        if (txn && txn.status !== 'pending') {
          setDepositResult({
            success: txn.status === 'successful',
            message: txn.status === 'successful'
              ? 'Your wallet has been topped up.'
              : 'The card payment did not go through.',
            resolvedStatus: txn.status === 'successful' ? 'successful' : 'failed',
          });
          setPendingRef(null);
          wallet.list().then(res => { if (active) setWallets(res.data); }).catch(() => {});
        }
      } catch { /* keep polling */ }
    };

    const interval = setInterval(check, 3000);
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'chilimba:payment-return') check();
    };
    window.addEventListener('message', onMessage);
    // Stop polling after 5 minutes regardless, to avoid an endless loop.
    const stopAt = setTimeout(() => setPendingRef(null), 5 * 60 * 1000);

    return () => {
      active = false;
      clearInterval(interval);
      clearTimeout(stopAt);
      window.removeEventListener('message', onMessage);
    };
  }, [pendingRef]);

  const openDeposit = (w: Wallet) => {
    setTargetWallet(w);
    setAmount('');
    setPhone('');
    setMethod('mobile_money');
    setDepositResult(null);
    setPendingRef(null);
    setDepositOpen(true);
  };

  const closeDeposit = () => {
    setDepositOpen(false);
    setPendingRef(null);
    load();
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetWallet) return;

    // Lipila only accepts 260XXXXXXXXX — convert whatever shape was typed.
    let normalizedPhone: string | null = null;
    if (method === 'mobile_money') {
      normalizedPhone = normalizeZmPhone(phone);
      if (!normalizedPhone) {
        setDepositResult({
          success: false,
          message: 'Enter a valid Zambian mobile number, e.g. 0977123456 or 260977123456.',
        });
        return;
      }
      setPhone(normalizedPhone);
    }

    setDepositing(true);
    setDepositResult(null);
    try {
      const res = await payments.deposit(
        targetWallet.type === 'group' && targetWallet.groupId
          ? { groupId: targetWallet.groupId }
          : { walletId: targetWallet.id },
        parseFloat(amount),
        method === 'card' ? { method: 'card' } : { method: 'mobile_money', mobileNumber: normalizedPhone! }
      );
      setDepositResult({ success: true, message: res.message, paymentUrl: res.data.paymentUrl });
      // Card payments complete on Lipila's secure hosted checkout page — open
      // the popup and start polling for the final outcome so the modal can
      // update itself to success/failed without the user doing anything.
      if (res.data.paymentUrl) {
        openCheckoutPopup(res.data.paymentUrl);
        setPendingRef(res.data.referenceId);
      }
    } catch (err: unknown) {
      setDepositResult({ success: false, message: err instanceof Error ? err.message : 'Deposit failed' });
    } finally {
      setDepositing(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferring(true);
    setActionMsg(null);
    try {
      const res = await wallet.transfer(transferGroup, parseFloat(transferAmount));
      setActionMsg({ ok: true, text: res.message });
      setTransferOpen(false);
      setTransferAmount('');
      load();
    } catch (err: unknown) {
      setActionMsg({ ok: false, text: err instanceof Error ? err.message : 'Transfer failed' });
    } finally {
      setTransferring(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawing(true);
    setActionMsg(null);
    try {
      const res = await wallet.withdraw(parseFloat(withdrawAmount), withdrawTo);
      setActionMsg({ ok: true, text: res.message });
      setWithdrawOpen(false);
      setWithdrawAmount('');
      load();
    } catch (err: unknown) {
      setActionMsg({ ok: false, text: err instanceof Error ? err.message : 'Withdrawal failed' });
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) return <PageSpinner />;

  const total = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
  const personalWallet = wallets.find(w => w.type === 'personal');
  const groupWallets = wallets.filter(w => w.type === 'group');

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

      {actionMsg && (
        <div className={`p-3 rounded-lg text-sm border ${actionMsg.ok
          ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'}`}>
          {actionMsg.text}
        </div>
      )}

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
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <Link href={`/transactions?walletId=${w.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <TrendingUp size={14} /> Transactions
                  </Button>
                </Link>
                <Button size="sm" onClick={() => openDeposit(w)} className="flex-1">
                  <Plus size={14} /> Top Up
                </Button>
              </div>
              {/* Personal wallet is the hub: money moves out of it to groups or back to you */}
              {w.type === 'personal' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline" size="sm" className="flex-1"
                    disabled={groupWallets.length === 0 || w.balance <= 0}
                    title={groupWallets.length === 0 ? 'Join a group first' : undefined}
                    onClick={() => {
                      setActionMsg(null);
                      setTransferGroup(groupWallets[0]?.groupId ?? '');
                      setTransferAmount('');
                      setTransferOpen(true);
                    }}
                  >
                    <Send size={14} /> Send to Group
                  </Button>
                  <Button
                    variant="outline" size="sm" className="flex-1"
                    disabled={w.balance <= 0}
                    onClick={() => { setActionMsg(null); setWithdrawAmount(''); setWithdrawOpen(true); }}
                  >
                    <ArrowDownToLine size={14} /> Withdraw
                  </Button>
                </div>
              )}
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
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-slate-100">ZMW {Number(t.amount).toLocaleString()}</p>
                    <Badge
                      label={t.status}
                      variant={t.status === 'successful' ? 'success' : t.status === 'failed' ? 'danger' : 'warning'}
                    />
                  </div>
                  {t.status === 'pending' && (
                    <button
                      title="Check latest status"
                      disabled={syncingId === t.referenceId}
                      onClick={async () => {
                        setSyncingId(t.referenceId);
                        try { await payments.syncStatus(t.referenceId); await load(); }
                        finally { setSyncingId(null); }
                      }}
                      className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-gray-100 dark:hover:bg-slate-600 rounded cursor-pointer disabled:opacity-40"
                    >
                      <RefreshCw size={14} className={syncingId === t.referenceId ? 'animate-spin' : ''} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Deposit modal */}
      <Modal
        open={depositOpen}
        onClose={closeDeposit}
        title={`Top Up — ${targetWallet?.type === 'personal' ? 'Personal Wallet' : (targetWallet?.groupName ?? 'Group Wallet')}`}
      >
        {depositResult?.resolvedStatus === 'successful' ? (
          /* Card payment confirmed successful */
          <div className="text-center py-4">
            <CheckCircle className="mx-auto mb-4 text-teal-600" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Payment successful!</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">{depositResult.message}</p>
            <Button className="w-full" onClick={closeDeposit}>Done</Button>
          </div>
        ) : depositResult?.resolvedStatus === 'failed' ? (
          /* Card payment came back failed */
          <div className="text-center py-4">
            <XCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Payment failed</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
              {depositResult.message} No money has been taken — you can try again.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={closeDeposit}>Close</Button>
              <Button className="flex-1" onClick={() => setDepositResult(null)}>Try Again</Button>
            </div>
          </div>
        ) : depositResult?.success && depositResult.paymentUrl ? (
          /* Card checkout opened — waiting for the outcome (polling) */
          <div className="text-center py-4">
            <Clock className="mx-auto mb-4 text-amber-500" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Complete your card payment</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
              A secure checkout window has opened — enter your card details there to finish paying.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-amber-600 dark:text-amber-400 mb-4">
              <RefreshCw size={13} className="animate-spin" /> Waiting for confirmation…
            </div>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-3">
              This will update automatically once the payment completes. If the window didn&apos;t open (or your browser blocked the popup), use the button below.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => depositResult.paymentUrl && openCheckoutPopup(depositResult.paymentUrl)}
            >
              <CreditCard size={14} /> Open Card Checkout
            </Button>
            <Button variant="secondary" className="mt-3 w-full" onClick={closeDeposit}>Close</Button>
          </div>
        ) : depositResult?.success ? (
          /* Mobile money request sent — resolves via webhook */
          <div className="text-center py-4">
            <CheckCircle className="mx-auto mb-4 text-teal-600" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Payment request sent!</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">{depositResult.message}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">Your balance will update automatically once you confirm the payment on your phone.</p>
            <Button className="mt-6 w-full" onClick={closeDeposit}>Done</Button>
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

            {/* Payment method toggle */}
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Pay with</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('mobile_money')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                    method === 'mobile_money'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                      : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-teal-300'
                  }`}
                >
                  <Smartphone size={16} /> Mobile Money
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('card')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                    method === 'card'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                      : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-teal-300'
                  }`}
                >
                  <CreditCard size={16} /> Card
                </button>
              </div>
            </div>

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
            {method === 'mobile_money' && (
              <div>
                <Input
                  label="Mobile Money Number"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onBlur={() => { const n = normalizeZmPhone(phone); if (n) setPhone(n); }}
                  placeholder="0977123456"
                  required
                />
                {phone.trim() !== '' && (
                  normalizeZmPhone(phone)
                    ? <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        Sending to <span className="font-medium text-gray-700 dark:text-slate-300">{formatZmPhone(phone)}</span>
                      </p>
                    : <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        That doesn&apos;t look like a Zambian mobile number — try 0977123456.
                      </p>
                )}
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3">
              {method === 'mobile_money'
                ? 'You will receive a prompt on your phone to confirm the payment with your PIN. Supports MTN, Airtel, and Zamtel. You can deposit in advance to cover multiple months at once.'
                : 'You will be redirected to a secure checkout page to enter your card details. Visa and Mastercard are supported. Your card details never touch Chilimba servers.'}
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="secondary" className="flex-1" onClick={closeDeposit}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" loading={depositing}>
                <Plus size={14} /> {method === 'card' ? 'Pay by Card' : 'Top Up'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Send from personal wallet to a group */}
      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="Send to a Group" size="sm">
        <form onSubmit={handleTransfer} className="space-y-4">
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-sm flex justify-between">
            <span className="text-gray-500 dark:text-slate-400">Personal wallet</span>
            <span className="font-semibold text-gray-900 dark:text-slate-100">
              {personalWallet?.currency ?? 'ZMW'} {(personalWallet?.balance ?? 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Send to</label>
            <select
              value={transferGroup}
              onChange={e => setTransferGroup(e.target.value)}
              required
              className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {groupWallets.map(g => (
                <option key={g.id} value={g.groupId}>
                  {g.groupName} — {g.currency} {g.balance.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Amount"
            type="number" min="0.01" step="0.01"
            max={personalWallet?.balance ?? undefined}
            value={transferAmount}
            onChange={e => setTransferAmount(e.target.value)}
            placeholder="e.g. 500"
            required
          />

          <p className="text-xs text-gray-500 dark:text-slate-400">
            This moves money between your own wallets instantly — it does not pay a contribution.
            Pay from the group&apos;s Contributions page once the funds are there.
          </p>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit" className="flex-1" loading={transferring}
              disabled={!transferGroup || !transferAmount || Number(transferAmount) <= 0
                || Number(transferAmount) > (personalWallet?.balance ?? 0)}
            >
              <Send size={14} /> Send
            </Button>
          </div>
        </form>
      </Modal>

      {/* Withdraw from personal wallet to mobile money / bank */}
      <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw Money" size="sm">
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-sm flex justify-between">
            <span className="text-gray-500 dark:text-slate-400">Available</span>
            <span className="font-semibold text-gray-900 dark:text-slate-100">
              {personalWallet?.currency ?? 'ZMW'} {(personalWallet?.balance ?? 0).toLocaleString('en-ZM', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Withdraw to</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWithdrawTo('mobile_money')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  withdrawTo === 'mobile_money'
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                    : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-teal-300'
                }`}
              >
                <Smartphone size={16} /> Mobile Money
              </button>
              <button
                type="button"
                onClick={() => setWithdrawTo('bank')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                  withdrawTo === 'bank'
                    ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300'
                    : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-teal-300'
                }`}
              >
                <Building2 size={16} /> Bank
              </button>
            </div>
          </div>

          <Input
            label="Amount"
            type="number" min="0.01" step="0.01"
            max={personalWallet?.balance ?? undefined}
            value={withdrawAmount}
            onChange={e => setWithdrawAmount(e.target.value)}
            placeholder="e.g. 500"
            required
          />

          <div className="text-xs text-gray-500 dark:text-slate-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3">
            Money is sent to the {withdrawTo === 'bank' ? 'bank account' : 'mobile money number'} saved on your{' '}
            <Link href="/profile" className="underline font-medium">profile</Link>.
            {withdrawTo === 'bank' && ' Bank transfers can take 1–3 business days.'}
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setWithdrawOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit" className="flex-1" loading={withdrawing}
              disabled={!withdrawAmount || Number(withdrawAmount) <= 0
                || Number(withdrawAmount) > (personalWallet?.balance ?? 0)}
            >
              <ArrowDownToLine size={14} /> Withdraw
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
