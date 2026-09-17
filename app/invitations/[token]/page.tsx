'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { invitations } from '@/lib/api';
import { ordinal } from '@/lib/format';
import type { GroupInvitation } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { Users, Coins, Calendar, CheckCircle, XCircle } from 'lucide-react';

type PageState = 'loading' | 'ready' | 'expired' | 'not_found' | 'accepted' | 'declined' | 'error';

export default function InvitationPage() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [invite, setInvite] = useState<GroupInvitation | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [actionLoading, setActionLoading] = useState(false);
  const [autoAccepting, setAutoAccepting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    invitations.get(token)
      .then(res => { setInvite(res.data); setPageState('ready'); })
      .catch(err => {
        const msg = err instanceof Error ? err.message : '';
        // The API now says *why* (accepted / declined / cancelled-or-replaced /
        // past its date); keep that text so the screen can show it instead of
        // guessing "expired" for all of them.
        setMessage(msg);
        if (/expired|accepted|declined|cancelled|replaced|already|used/i.test(msg)) setPageState('expired');
        else if (msg.includes('not found')) setPageState('not_found');
        else setPageState('error');
      });
  }, [token]);

  // Auto-accept when user is logged in with the correct email
  useEffect(() => {
    if (pageState !== 'ready' || authLoading || !user || !invite || autoAccepting) return;
    if (user.email !== invite.email) return;
    setAutoAccepting(true);
    invitations.accept(token)
      .then(res => router.replace(`/groups/${res.groupId}`))
      .catch(err => {
        const msg = err instanceof Error ? err.message : '';
        setAutoAccepting(false);
        if (msg.toLowerCase().includes('already')) {
          router.replace(`/groups/${invite.group.id}`);
        } else {
          setMessage(msg || 'Failed to join group');
          setPageState('error');
        }
      });
  }, [pageState, authLoading, user, invite, autoAccepting, token, router]);

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      const res = await invitations.accept(token);
      setMessage(res.message);
      setPageState('accepted');
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Failed to accept invitation');
      setPageState('error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    setActionLoading(true);
    try {
      await invitations.decline(token);
      setPageState('declined');
    } catch {
      setPageState('declined');
    } finally {
      setActionLoading(false);
    }
  };

  const willAutoAccept = pageState === 'ready' && !authLoading && !!user && !!invite && user.email === invite.email;
  if (pageState === 'loading' || authLoading || autoAccepting || willAutoAccept) return <PageSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <p className="text-gray-500 dark:text-slate-400 text-sm">Chilimba – Digital Village Banking</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">

          {/* Expired / not found */}
          {(pageState === 'expired' || pageState === 'not_found') && (
            <div className="text-center py-4">
              <XCircle size={48} className="text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">
                {pageState === 'expired' ? 'Invitation Unavailable' : 'Invitation Not Found'}
              </h2>
              <p className="text-gray-600 dark:text-slate-300 text-sm mb-6">
                {pageState === 'expired'
                  ? (message || 'This invitation has already been used or has expired. Ask the group admin to send a new one.')
                  : 'This invitation link is invalid.'}
              </p>
              <Link href="/auth/login"><Button className="w-full">Go to Login</Button></Link>
            </div>
          )}

          {/* Accepted */}
          {pageState === 'accepted' && (
            <div className="text-center py-4">
              <CheckCircle size={48} className="text-teal-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Welcome to the group!</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">{message}</p>
              <Button className="w-full" onClick={() => router.push(`/groups/${invite?.group.id}`)}>
                View Group
              </Button>
            </div>
          )}

          {/* Declined */}
          {pageState === 'declined' && (
            <div className="text-center py-4">
              <XCircle size={48} className="text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Invitation Declined</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">You have declined this group invitation.</p>
              <Link href="/dashboard"><Button variant="outline" className="w-full">Go to Dashboard</Button></Link>
            </div>
          )}

          {/* Error */}
          {pageState === 'error' && (
            <div className="text-center py-4">
              <XCircle size={48} className="text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Something went wrong</h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">{message || 'Please try again or contact support.'}</p>
              <Link href="/dashboard"><Button variant="outline" className="w-full">Go to Dashboard</Button></Link>
            </div>
          )}

          {/* Ready — show invite details */}
          {pageState === 'ready' && invite && (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 text-center mb-1">
                You&apos;ve been invited!
              </h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm text-center mb-6">
                <strong>{invite.invitedBy.firstName} {invite.invitedBy.lastName}</strong> invited you to join a savings group.
              </p>

              <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900 rounded-xl p-5 mb-6">
                <h3 className="font-semibold text-teal-900 dark:text-teal-100 text-lg mb-3">{invite.group.name}</h3>
                {invite.group.description && (
                  <p className="text-sm text-teal-700 dark:text-teal-300 mb-3">{invite.group.description}</p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-teal-800 dark:text-teal-200">
                    <Coins size={15} className="text-teal-600" />
                    <span>ZMW {(invite.group.monthlyAmount ?? 0).toLocaleString()} / month</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-teal-800 dark:text-teal-200">
                    <Users size={15} className="text-teal-600" />
                    <span>Up to {invite.group.maxMembers} members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-teal-800 dark:text-teal-200">
                    <Calendar size={15} className="text-teal-600" />
                    <span>Payout on the {ordinal(invite.group.payoutDay ?? 1)} of each month</span>
                  </div>
                </div>
              </div>

              {/* Email mismatch warning */}
              {user && user.email !== invite.email && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-700 dark:text-amber-300">
                  This invitation was sent to <strong>{invite.email}</strong>, but you are signed in as <strong>{user.email}</strong>. Please sign in with the correct account.
                </div>
              )}

              {!user ? (
                <div className="space-y-3">
                  {invite.userExists ? (
                    <>
                      <p className="text-sm text-gray-500 dark:text-slate-400 text-center">Sign in to accept this invitation.</p>
                      <Link href={`/auth/login?email=${encodeURIComponent(invite.email)}&locked=1&returnUrl=/invitations/${token}`}>
                        <Button className="w-full">Sign In to Accept</Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500 dark:text-slate-400 text-center">Create a free account to accept this invitation.</p>
                      <Link href={`/auth/register?email=${encodeURIComponent(invite.email)}&locked=1&returnUrl=/invitations/${token}`}>
                        <Button className="w-full">Create Account to Accept</Button>
                      </Link>
                    </>
                  )}
                  <button
                    onClick={handleDecline}
                    disabled={actionLoading}
                    className="w-full text-sm text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 cursor-pointer mt-1"
                  >
                    Decline invitation
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    loading={actionLoading}
                    onClick={handleAccept}
                    disabled={user.email !== invite.email}
                  >
                    <CheckCircle size={16} /> Accept Invitation
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full"
                    loading={actionLoading}
                    onClick={handleDecline}
                  >
                    Decline
                  </Button>
                </div>
              )}

              <p className="text-xs text-gray-400 dark:text-slate-500 text-center mt-4">
                Invitation expires {new Date(invite.expiresAt).toLocaleDateString()}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
