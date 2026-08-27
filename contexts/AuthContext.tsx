'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, User } from '@/lib/api';

function normalizeUser(u: Record<string, unknown>): User {
  return {
    id: (u.id as string),
    firstName: (u.firstName || u.first_name) as string,
    lastName: (u.lastName || u.last_name) as string,
    email: u.email as string,
    phone: (u.phone) as string | undefined,
    role: (u.role as User['role']),
    status: (u.status as string),
    dateOfBirth: (u.dateOfBirth || u.date_of_birth) as string | undefined,
    photoUrl: (u.photoUrl || u.profile_photo_url) as string | undefined,
    createdAt: (u.createdAt || u.created_at) as string | undefined,
    idType: (u.idType || u.id_type) as User['idType'],
    idNumber: (u.idNumber || u.id_number) as string | undefined,
    idVerified: (u.idVerified ?? u.id_verified) as boolean | undefined,
    idFrontUrl: (u.idFrontUrl || u.id_front_url) as string | undefined,
    idBackUrl: (u.idBackUrl || u.id_back_url) as string | undefined,
    kycSubmittedAt: (u.kycSubmittedAt || u.kyc_submitted_at) as string | undefined,
    kycRejectionReason: (u.kycRejectionReason || u.kyc_rejection_reason) as string | undefined,
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    try {
      const res = await auth.me();
      setUser(normalizeUser(res.data as unknown as Record<string, unknown>));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await auth.login(email, password);
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(normalizeUser(res.data.user as unknown as Record<string, unknown>));
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken') || '';
    try { await auth.logout(refreshToken); } catch {}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
