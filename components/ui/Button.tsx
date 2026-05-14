import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'subtle' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'icon';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_16px_30px_-18px_rgba(99,102,241,0.9)] hover:from-indigo-500 hover:to-violet-500',
  secondary:
    'border border-slate-200 bg-white/90 text-slate-700 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.32)] hover:border-slate-300 hover:bg-white',
  subtle: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  danger: 'bg-red-600 text-white shadow-[0_16px_30px_-18px_rgba(220,38,38,0.8)] hover:bg-red-700',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-2 text-sm',
  md: 'px-4.5 py-2.5 text-sm',
  icon: 'h-10 w-10 p-0',
};

export const getButtonClasses = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}) =>
  [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth = false, className = '', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={getButtonClasses({ variant, size, fullWidth, className })}
      {...props}
    />
  )
);

Button.displayName = 'Button';
