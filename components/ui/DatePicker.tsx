'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  label?: string;
  value?: string;                 // ISO 'YYYY-MM-DD'
  onChange: (iso: string) => void;
  min?: string;                   // ISO
  max?: string;                   // ISO
  required?: boolean;
  placeholder?: string;
  error?: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const toISO = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/** Modern calendar-popover date picker with month + year navigation. */
export function DatePicker({ label, value, onChange, min, max, required, placeholder = 'Select a date', error }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = value ? new Date(value + 'T00:00:00') : null;
  const today = new Date();
  const [view, setView] = useState(() => selected ?? today);

  useEffect(() => {
    if (value) setView(new Date(value + 'T00:00:00'));
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const minDate = min ? new Date(min + 'T00:00:00') : null;
  const maxDate = max ? new Date(max + 'T00:00:00') : null;
  const isDisabled = (d: number) => {
    const date = new Date(year, month, d);
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isSameDay = (d: number) =>
    selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === d;

  // Year range for the dropdown (120 years back to today, useful for DOB)
  const maxYear = maxDate ? maxDate.getFullYear() : today.getFullYear() + 10;
  const minYear = minDate ? minDate.getFullYear() : today.getFullYear() - 120;
  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  const display = selected
    ? selected.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="flex flex-col gap-1" ref={wrapRef}>
      {label && <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}{required && ' *'}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between border rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-teal-500 transition bg-white dark:bg-slate-700 ${error ? 'border-red-400' : 'border-gray-300 dark:border-slate-600'}`}
        >
          <span className={display ? 'text-gray-900 dark:text-slate-100' : 'text-gray-400 dark:text-slate-500'}>
            {display || placeholder}
          </span>
          <Calendar size={16} className="text-gray-400 dark:text-slate-500 flex-shrink-0" />
        </button>

        {open && (
          <div className="absolute z-50 mt-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-3">
            {/* Header: month nav + month/year selectors */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <button type="button" onClick={() => setView(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300">
                <ChevronLeft size={16} />
              </button>
              <div className="flex items-center gap-1.5">
                <select
                  value={month}
                  onChange={e => setView(new Date(year, Number(e.target.value), 1))}
                  className="text-sm font-medium bg-transparent text-gray-900 dark:text-slate-100 focus:outline-none cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  {MONTHS.map((m, i) => <option key={m} value={i} className="dark:bg-slate-800">{m}</option>)}
                </select>
                <select
                  value={year}
                  onChange={e => setView(new Date(Number(e.target.value), month, 1))}
                  className="text-sm font-medium bg-transparent text-gray-900 dark:text-slate-100 focus:outline-none cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  {years.map(y => <option key={y} value={y} className="dark:bg-slate-800">{y}</option>)}
                </select>
              </div>
              <button type="button" onClick={() => setView(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekday labels */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAYS.map(w => (
                <div key={w} className="text-center text-xs font-medium text-gray-400 dark:text-slate-500 py-1">{w}</div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstWeekday }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const d = i + 1;
                const disabled = isDisabled(d);
                const active = isSameDay(d);
                const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={disabled}
                    onClick={() => { onChange(toISO(year, month, d)); setOpen(false); }}
                    className={`h-8 rounded-lg text-sm transition ${
                      active
                        ? 'bg-teal-600 text-white font-semibold'
                        : disabled
                        ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                        : `text-gray-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-teal-900/30 ${isToday ? 'ring-1 ring-teal-400' : ''}`
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
