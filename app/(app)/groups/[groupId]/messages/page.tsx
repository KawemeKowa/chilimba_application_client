'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { messages as messagesApi } from '@/lib/api';
import type { Message, PaginatedResponse } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { Send, Reply, Trash2, MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<PaginatedResponse<Message> | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = () =>
    messagesApi.list(groupId, { page: '1', limit: '50' })
      .then(r => setData(r))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [groupId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    try {
      await messagesApi.post(groupId, content.trim(), replyTo?.id);
      setContent('');
      setReplyTo(null);
      load();
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    await messagesApi.delete(id);
    load();
  };

  if (loading) return <PageSpinner />;

  const topLevel = data?.data.filter(m => !m.parentId) ?? [];

  return (
    <div className="space-y-4 flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Group Messages</h1>
        <p className="text-gray-500 mt-1">Discuss and coordinate with your group</p>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {topLevel.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-16">
              <MessageSquare size={40} className="mb-3" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          )}
          {topLevel.map(msg => {
            const replies = data?.data.filter(m => m.parentId === msg.id) ?? [];
            return (
              <div key={msg.id} className="space-y-2">
                <div className={`flex gap-3 group ${msg.userId === user?.id ? 'flex-row-reverse' : ''}`}>
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-teal-700">
                    {(msg.authorName || 'U')[0].toUpperCase()}
                  </div>
                  <div className={`max-w-xs lg:max-w-md ${msg.userId === user?.id ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`rounded-2xl px-4 py-2.5 ${msg.userId === user?.id ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'}`}>
                      {msg.userId !== user?.id && (
                        <p className="text-xs font-semibold mb-1 opacity-75">{msg.authorName || 'Member'}</p>
                      )}
                      <p className="text-sm">{msg.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button onClick={() => { setReplyTo(msg); textareaRef.current?.focus(); }} className="text-xs text-gray-400 hover:text-teal-600 flex items-center gap-0.5 cursor-pointer">
                        <Reply size={12} /> Reply
                      </button>
                      {msg.userId === user?.id && (
                        <button onClick={() => handleDelete(msg.id)} className="text-xs text-gray-400 hover:text-red-500 cursor-pointer">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {replies.map(r => (
                  <div key={r.id} className={`flex gap-3 ml-11 group ${r.userId === user?.id ? 'flex-row-reverse' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-600">
                      {(r.authorName || 'U')[0].toUpperCase()}
                    </div>
                    <div className={`max-w-xs rounded-xl px-3 py-2 text-sm ${r.userId === user?.id ? 'bg-teal-100 text-teal-900' : 'bg-gray-50 text-gray-800'}`}>
                      {r.content}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-4">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between bg-teal-50 border border-teal-200 rounded-lg px-3 py-1.5 text-xs text-teal-700">
              <span>Replying to: {replyTo.content.slice(0, 50)}...</span>
              <button onClick={() => setReplyTo(null)} className="ml-2 text-teal-500 hover:text-teal-700 cursor-pointer">✕</button>
            </div>
          )}
          <form onSubmit={handleSend} className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
            />
            <Button type="submit" loading={sending} disabled={!content.trim()}>
              <Send size={16} />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
