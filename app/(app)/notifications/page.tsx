'use client';

import { useEffect, useState } from 'react';
import { notifications as notifApi } from '@/lib/api';
import type { Notification, PaginatedResponse } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { PageSpinner } from '@/components/ui/Spinner';
import { Bell, CheckCheck, Circle } from 'lucide-react';

export default function NotificationsPage() {
  const [data, setData] = useState<PaginatedResponse<Notification> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = (p = 1) => {
    setLoading(true);
    notifApi.list({ page: String(p), limit: '20' })
      .then(r => { setData(r); setPage(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await notifApi.markRead(id);
    load(page);
  };

  const markAll = async () => {
    setMarkingAll(true);
    try { await notifApi.markAllRead(); load(page); }
    finally { setMarkingAll(false); }
  };

  const unreadCount = data?.data.filter(n => !n.isRead).length || 0;

  if (loading && !data) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAll} loading={markingAll}>
            <CheckCheck size={16} /> Mark all read
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {data?.data.length === 0 && (
          <Card className="text-center py-16">
            <Bell size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No notifications yet</p>
          </Card>
        )}
        {data?.data.map(n => (
          <div
            key={n.id}
            onClick={() => !n.isRead && markRead(n.id)}
            className={`bg-white border rounded-xl px-5 py-4 flex items-start gap-4 cursor-pointer hover:shadow-sm transition-shadow ${!n.isRead ? 'border-teal-200 bg-teal-50/30' : 'border-gray-100'}`}
          >
            <div className={`mt-1 flex-shrink-0 ${n.isRead ? 'text-gray-300' : 'text-teal-500'}`}>
              {n.isRead ? <Bell size={18} /> : <Circle size={10} className="fill-teal-500 mt-1" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-medium ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(n.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
            </div>
          </div>
        ))}
      </div>

      {data && (
        <Pagination page={page} totalPages={data.pagination.totalPages} total={data.pagination.total} onPage={load} />
      )}
    </div>
  );
}
