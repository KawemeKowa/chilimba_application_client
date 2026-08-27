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
  subtitle?: string;
  onClick?: () => void;
}

export function StatCard({ icon, label, value, iconBg = 'bg-teal-100', subtitle, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 flex items-center gap-4 transition-all ${onClick ? 'cursor-pointer hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md' : ''}`}
    >
      <div className={`${iconBg} p-3 rounded-lg flex-shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 leading-tight">{subtitle}</p>}
      </div>
      {onClick && <div className="ml-auto text-gray-300 dark:text-slate-600 flex-shrink-0">›</div>}
    </div>
  );
}
