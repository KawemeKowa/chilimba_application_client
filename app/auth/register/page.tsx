'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/api';
import { Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  const lockedEmail = searchParams.get('email') || '';
  const locked = searchParams.get('locked') === '1';
  const { user, loading: authLoading, refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: lockedEmail, phone: '',
    password: '', dateOfBirth: '',
  });
  // Latest allowed DOB = 16 years ago (computed client-side to avoid hydration mismatch)
  const [maxDob, setMaxDob] = useState<string | undefined>(undefined);
  useEffect(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 16);
    setMaxDob(d.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(returnUrl);
    }
  }, [authLoading, user, router, returnUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      const res = await auth.register(fd) as { data: { accessToken: string; refreshToken: string } };
      if (res.data?.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
        localStorage.setItem('refreshToken', res.data.refreshToken);
        await refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4 relative">
      <Link
        href="/about"
        className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-white dark:hover:bg-slate-800 transition-colors"
        title="About Chilimba"
      >
        <Info size={20} />
      </Link>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-600 rounded-2xl mb-4">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Create your account</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Join Chilimba – digital village banking</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First name" name="firstName" value={form.firstName} onChange={handleChange} placeholder="Bwalya" required />
              <Input label="Last name" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Mwale" required />
            </div>
            <Input
              label="Email address"
              type="email"
              name="email"
              value={form.email}
              onChange={locked ? undefined : handleChange}
              readOnly={locked}
              placeholder="you@example.com"
              required
              className={locked ? 'bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-slate-400 cursor-not-allowed' : ''}
            />
            <Input label="Phone number" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+260976543210" required />
            <DatePicker
              label="Date of birth"
              value={form.dateOfBirth}
              onChange={iso => setForm(f => ({ ...f, dateOfBirth: iso }))}
              max={maxDob}
              required
            />
            <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Minimum 8 characters" required />
            <p className="text-xs text-gray-500 dark:text-slate-400">You must be 16 years or older to register.</p>
            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-teal-600 dark:text-teal-400 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
