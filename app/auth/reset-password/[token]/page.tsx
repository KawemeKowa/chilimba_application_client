'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match. Please try again.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await auth.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.replace('/dashboard'), 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set a new password</h1>
          <p className="text-gray-500 mt-1">Choose a strong password for your account.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle className="mx-auto mb-4 text-teal-600" size={48} />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Password reset!</h2>
              <p className="text-sm text-gray-600">Redirecting you to your dashboard…</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">New password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat your new password"
                      required
                      autoComplete="new-password"
                      className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 pr-10 ${
                        mismatch ? 'border-red-400' : 'border-gray-300'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {mismatch && (
                    <p className="text-xs text-red-500">Passwords do not match.</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={loading}
                  disabled={mismatch}
                >
                  Reset password
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600">
                <Link href="/auth/login" className="text-teal-600 font-medium hover:underline">
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
