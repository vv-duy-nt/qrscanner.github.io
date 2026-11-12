import React from 'react';
import { cn } from '../../lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium',
        {
          'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300': variant === 'default',
          'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400': variant === 'success',
          'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400': variant === 'warning',
          'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400': variant === 'danger',
          'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400': variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  );
}

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100" />
      </div>
    </div>
  );
}

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ children, className, onClick, hover }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900',
        hover && 'cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors duration-150',
        className
      )}
    >
      {children}
    </div>
  );
}

interface DividerProps { label?: string }
export function Divider({ label }: DividerProps) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
      {label && <span className="text-xs text-zinc-400">{label}</span>}
      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
    </div>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  return (
    <label className={cn('flex items-center gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500',
          checked ? 'bg-indigo-600' : 'bg-zinc-300 dark:bg-zinc-600'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </button>
      {label && (
        <div>
          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{label}</div>
          {description && <div className="text-xs text-zinc-500">{description}</div>}
        </div>
      )}
    </label>
  );
}
