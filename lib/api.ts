const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://chilimba-application-api.vercel.app/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return data.data.accessToken;
    }
  } catch {}
  return null;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) return request<T>(path, options, false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/auth/login';
    }
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

// Auth
export const auth = {
  register: (body: FormData) =>
    request('/auth/register', { method: 'POST', body }),
  login: (email: string, password: string) =>
    request<{ success: boolean; data: { user: User; accessToken: string; refreshToken: string } }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    ),
  logout: (refreshToken: string) =>
    request('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
  me: () => request<{ success: boolean; data: User }>('/auth/me'),
  updateMe: (body: FormData) =>
    request('/auth/me', { method: 'PATCH', body }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// Groups
export const groups = {
  create: (body: FormData) =>
    request<{ success: boolean; data: Group }>('/groups', { method: 'POST', body }),
  join: (inviteCode: string) =>
    request('/groups/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
  list: () =>
    request<{ success: boolean; data: Group[] }>('/groups'),
  get: (groupId: string) =>
    request<{ success: boolean; data: GroupDetail }>(`/groups/${groupId}`),
  update: (groupId: string, body: FormData) =>
    request(`/groups/${groupId}`, { method: 'PATCH', body }),
  rotateInvite: (groupId: string) =>
    request(`/groups/${groupId}/rotate-invite`, { method: 'POST' }),
  payoutSchedule: (groupId: string) =>
    request<{ success: boolean; data: PayoutSchedule[] }>(`/groups/${groupId}/payout-schedule`),
  removeMember: (groupId: string, userId: string) =>
    request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),
  invite: (groupId: string, email: string) =>
    request(`/groups/${groupId}/invite`, { method: 'POST', body: JSON.stringify({ email }) }),
};

// Invitations
export const invitations = {
  get: (token: string) =>
    request<{ success: boolean; data: GroupInvitation }>(`/groups/invitations/${token}`),
  accept: (token: string) =>
    request<{ success: boolean; message: string; groupId: string }>(`/groups/invitations/${token}/accept`, { method: 'POST' }),
  decline: (token: string) =>
    request<{ success: boolean; message: string }>(`/groups/invitations/${token}/decline`, { method: 'POST' }),
};

// Contributions
export const contributions = {
  my: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<Contribution>>(`/contributions/my${q}`);
  },
  upcoming: () =>
    request<{ success: boolean; data: Contribution[] }>('/contributions/upcoming'),
  pay: (id: string) =>
    request(`/contributions/${id}/pay`, { method: 'POST' }),
  group: (groupId: string, params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<Contribution>>(`/contributions/group/${groupId}${q}`);
  },
};

// Withdrawals
export const withdrawals = {
  request: (groupId: string, amount: number, reason: string) =>
    request<{ success: boolean; data: Withdrawal }>(`/withdrawals/groups/${groupId}`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    }),
  list: (groupId: string, params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<Withdrawal>>(`/withdrawals/groups/${groupId}${q}`);
  },
  vote: (withdrawalId: string, action: 'approved' | 'rejected', comment?: string) =>
    request(`/withdrawals/${withdrawalId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ action, comment }),
    }),
};

// Committees
export const committees = {
  create: (groupId: string, body: object) =>
    request<{ success: boolean; data: CommitteePool }>(`/committees/groups/${groupId}`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  list: (groupId: string, params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<CommitteePool>>(`/committees/groups/${groupId}${q}`);
  },
  contribute: (poolId: string, body: object) =>
    request(`/committees/${poolId}/contribute`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  contributors: (poolId: string) =>
    request<{ success: boolean; data: Contributor[] }>(`/committees/${poolId}/contributors`),
  close: (poolId: string) =>
    request(`/committees/${poolId}/close`, { method: 'PATCH' }),
};

// Messages
export const messages = {
  post: (groupId: string, content: string, parentId?: string) =>
    request<{ success: boolean; data: Message }>(`/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, parentId: parentId || null }),
    }),
  list: (groupId: string, params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<Message>>(`/groups/${groupId}/messages${q}`);
  },
  delete: (messageId: string) =>
    request(`/messages/${messageId}`, { method: 'DELETE' }),
};

// Wallet
export const wallet = {
  list: () =>
    request<{ success: boolean; data: Wallet[] }>('/wallet'),
  transactions: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<Transaction>>(`/wallet/transactions${q}`);
  },
};

// Notifications
export const notifications = {
  list: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<Notification>>(`/notifications${q}`);
  },
  markAllRead: () =>
    request('/notifications/read-all', { method: 'PATCH' }),
  markRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'PATCH' }),
};

// Admin
export const admin = {
  users: {
    list: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<PaginatedResponse<User>>(`/admin/users${q}`);
    },
    get: (userId: string) =>
      request<{ success: boolean; data: User }>(`/admin/users/${userId}`),
    updateStatus: (userId: string, status: string, reason?: string) =>
      request(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      }),
    verify: (userId: string) =>
      request(`/admin/users/${userId}/verify`, { method: 'POST' }),
  },
  groups: {
    list: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<PaginatedResponse<Group>>(`/admin/groups${q}`);
    },
    updateStatus: (groupId: string, status: string) =>
      request(`/admin/groups/${groupId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },
  payouts: {
    pending: () =>
      request<{ success: boolean; data: PayoutSchedule[] }>('/admin/payouts/pending'),
    disburse: (id: string) =>
      request(`/admin/payouts/${id}/disburse`, { method: 'POST' }),
  },
  withdrawals: {
    list: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<PaginatedResponse<Withdrawal>>(`/admin/withdrawals${q}`);
    },
  },
  fees: {
    list: () =>
      request<{ success: boolean; data: FeeConfig[] }>('/admin/fees'),
    update: (feeId: string, value: number, isActive: boolean) =>
      request(`/admin/fees/${feeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ value, isActive }),
      }),
  },
  notifications: {
    broadcast: (title: string, body: string, targetRole: string) =>
      request('/admin/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title, body, targetRole }),
      }),
  },
};

// Super Admin
export const superAdmin = {
  analytics: {
    overview: () =>
      request<{ success: boolean; data: AnalyticsOverview }>('/superadmin/analytics/overview'),
    daily: (days = 30) =>
      request(`/superadmin/analytics/daily?days=${days}`),
    groups: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return request(`/superadmin/analytics/groups${q}`);
    },
    compliance: () =>
      request('/superadmin/analytics/compliance'),
    revenue: (groupBy = 'month', months = 12) =>
      request(`/superadmin/analytics/revenue?groupBy=${groupBy}&months=${months}`),
    topGroups: () =>
      request('/superadmin/analytics/top-groups'),
    userGrowth: () =>
      request('/superadmin/analytics/user-growth'),
  },
  settings: {
    list: () =>
      request<{ success: boolean; data: PlatformSetting[] }>('/superadmin/settings'),
    update: (key: string, value: string) =>
      request(`/superadmin/settings/${key}`, {
        method: 'PATCH',
        body: JSON.stringify({ value }),
      }),
  },
  admins: {
    list: () =>
      request<{ success: boolean; data: User[] }>('/superadmin/admins'),
    updateRole: (userId: string, role: string) =>
      request(`/superadmin/admins/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),
  },
  auditLogs: (params?: Record<string, string>) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<PaginatedResponse<AuditLog>>(`/superadmin/audit-logs${q}`);
  },
  health: () =>
    request<{ success: boolean; data: HealthStatus }>('/superadmin/health'),
};

// Types
export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'member' | 'admin' | 'super_admin';
  status: string;
  dateOfBirth?: string;
  photoUrl?: string;
  createdAt?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  monthlyAmount: number;
  maxMembers: number;
  contributionDay: number;
  payoutDay: number;
  minApprovalsWithdrawal: number;
  currency: string;
  status: string;
  inviteCode?: string;
  memberCount?: number;
  photoUrl?: string;
  createdAt?: string;
  role?: string;
}

export interface GroupDetail extends Group {
  members: GroupMember[];
}

export interface GroupMember {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  role: string;
  joinedAt: string;
  payoutOrder?: number;
}

export interface PayoutSchedule {
  cycleNumber: number;
  payoutOrder: number;
  scheduledDate: string;
  expectedAmount: number;
  status: string;
  firstName: string;
  lastName: string;
  userId?: string;
}

export interface Contribution {
  id: string;
  groupId: string;
  groupName?: string;
  userId: string;
  amount: number;
  status: 'pending' | 'paid' | 'late' | 'waived';
  dueDate: string;
  paidAt?: string;
  cycleNumber?: number;
  roundNumber?: number;
  reference?: string;
}

export interface Withdrawal {
  id: string;
  groupId: string;
  groupName?: string;
  requestedBy: string;
  requesterName?: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
  votes?: WithdrawalVote[];
  approvalsNeeded?: number;
  approvalsCount?: number;
}

export interface WithdrawalVote {
  userId: string;
  userName?: string;
  action: 'approved' | 'rejected';
  comment?: string;
  createdAt: string;
}

export interface CommitteePool {
  id: string;
  groupId: string;
  title: string;
  description?: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  beneficiary?: string;
  status: string;
  closesAt: string;
  createdAt: string;
  contributorCount?: number;
}

export interface Contributor {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  amount: number;
  message?: string;
  isAnonymous: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  groupId: string;
  userId: string;
  authorName?: string;
  content: string;
  parentId?: string;
  replies?: Message[];
  createdAt: string;
}

export interface Wallet {
  id: string;
  type: 'personal' | 'group';
  balance: number;
  currency: string;
  groupId?: string;
  groupName?: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: string;
  amount: number;
  status: string;
  from?: string;
  to?: string;
  initiator?: string;
  reference?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface FeeConfig {
  id: string;
  name: string;
  type: string;
  value: number;
  isActive: boolean;
  description?: string;
}

export interface PlatformSetting {
  key: string;
  value: string;
  description?: string;
}

export interface AnalyticsOverview {
  users: {
    total: number;
    active: number;
    pending_verification: number;
    registered_today: number;
    registered_last_7d: number;
  };
  groups: {
    total: number;
    active: number;
    avg_monthly_amount: number;
  };
  transactions: {
    total_volume: string;
    fee_revenue: string;
    txns_today: number;
  };
  wallets: {
    total_balance_on_platform: string;
  };
}

export interface HealthStatus {
  status: string;
  database: { connected: boolean };
  alerts: {
    pendingPayouts: number;
    failedTransactions24h: number;
    pendingKycVerifications: number;
    expiredWithdrawals: number;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  actorId: string;
  actorName?: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  createdAt: string;
}

export interface GroupInvitation {
  token: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  group: {
    id: string;
    name: string;
    description?: string;
    monthlyAmount: number;
    maxMembers: number;
    payoutDay: number;
    currency: string;
  };
  invitedBy: { firstName: string; lastName: string };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
