'use client';

import { useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.forgotPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Forgot your password?</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Enter your email and we&apos;ll send you a reset link.</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
          {submitted ? (
            <div className="text-center py-4">
              <CheckCircle className="mx-auto mb-4 text-teal-600" size={48} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">Check your inbox</h2>
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">
                If <span className="font-medium">{email}</span>{' '}is registered, you&apos;ll receive a
                password reset link shortly. Check your spam folder if it doesn&apos;t arrive within
                a few minutes.
              </p>
              <Link
                href="/auth/login"
                className="text-sm text-teal-600 dark:text-teal-400 font-medium hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoFocus
                  autoComplete="email"
                />
                <Button type="submit" className="w-full" size="lg" loading={loading}>
                  Send reset link
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-gray-600 dark:text-slate-400">
                Remember your password?{' '}
                <Link href="/auth/login" className="text-teal-600 dark:text-teal-400 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
