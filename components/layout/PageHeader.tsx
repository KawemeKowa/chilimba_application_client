'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  /**
   * Where the back arrow goes. An explicit destination is preferred over
   * router.back(), which depends on history — arriving from a notification or
   * a pasted link would otherwise send people out of the app.
   */
  backHref?: string;
  backLabel?: string;
  /** Actions rendered at the right of the header row. */
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, backHref, backLabel, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-start gap-3 min-w-0">
        {backHref && (
          <Link
            href={backHref}
            aria-label={backLabel ? `Back to ${backLabel}` : 'Go back'}
            title={backLabel ? `Back to ${backLabel}` : 'Go back'}
            className="mt-1 p-2 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 flex-shrink-0"
          >
            <ArrowLeft size={20} />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{title}</h1>
          {subtitle && (
            <p className="text-gray-500 dark:text-slate-400 mt-1">{subtitle}</p>
          )}
          {backHref && backLabel && (
            <Link
              href={backHref}
              className="inline-block mt-1 text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
            >
              ← Back to {backLabel}
            </Link>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}
