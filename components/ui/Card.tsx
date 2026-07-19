import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = '', padding = true }: CardProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 ${padding ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  iconBg?: string;
}

export function StatCard({ icon, label, value, iconBg = 'bg-teal-100' }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 flex items-center gap-4">
      <div className={`${iconBg} p-3 rounded-lg flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
