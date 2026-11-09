import React from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, rightElement, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 text-zinc-400 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-lg border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
              error
                ? 'border-red-400 dark:border-red-500'
                : 'border-zinc-300 dark:border-zinc-600',
              icon ? 'pl-10' : 'pl-3',
              rightElement ? 'pr-24' : 'pr-3',
              'h-9 text-sm',
              className
            )}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-2 flex items-center gap-1">
              {rightElement}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full rounded-lg border bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent px-3 py-2 text-sm resize-none',
            error ? 'border-red-400' : 'border-zinc-300 dark:border-zinc-600',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
