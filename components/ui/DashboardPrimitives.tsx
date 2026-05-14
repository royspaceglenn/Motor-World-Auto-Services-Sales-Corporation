import React from 'react';
import { ChevronRight, LucideIcon } from 'lucide-react';

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

type DashboardSurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: 'default' | 'muted' | 'dark';
};

const surfaceToneClasses: Record<NonNullable<DashboardSurfaceProps['tone']>, string> = {
  default:
    'border border-white/70 bg-white/88 text-slate-900 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.38)] backdrop-blur-sm',
  muted:
    'border border-slate-200/80 bg-slate-50/92 text-slate-900 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.28)] backdrop-blur-sm',
  dark:
    'border border-slate-700 bg-slate-900 text-white shadow-[0_24px_60px_-36px_rgba(2,6,23,0.85)]',
};

export const DashboardSurface: React.FC<DashboardSurfaceProps> = ({
  tone = 'default',
  className,
  children,
  ...props
}) => (
  <div className={cx('rounded-[28px]', surfaceToneClasses[tone], className)} {...props}>
    {children}
  </div>
);

type DashboardSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export const DashboardSectionHeader: React.FC<DashboardSectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  action,
  className,
}) => (
  <div className={cx('flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between', className)}>
    <div>
      {eyebrow && (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-600">{eyebrow}</p>
      )}
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

type DashboardMetricCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate';
  trend?: string;
  trendUp?: boolean;
  className?: string;
};

const accentClasses: Record<
  NonNullable<DashboardMetricCardProps['accent']>,
  { gradient: string; iconText: string; iconBg: string }
> = {
  indigo: { gradient: 'from-indigo-500 to-violet-500', iconText: 'text-indigo-600', iconBg: 'bg-indigo-50' },
  emerald: { gradient: 'from-emerald-500 to-teal-500', iconText: 'text-emerald-600', iconBg: 'bg-emerald-50' },
  amber: { gradient: 'from-amber-400 to-orange-500', iconText: 'text-amber-600', iconBg: 'bg-amber-50' },
  rose: { gradient: 'from-rose-500 to-pink-500', iconText: 'text-rose-600', iconBg: 'bg-rose-50' },
  sky: { gradient: 'from-sky-500 to-cyan-500', iconText: 'text-sky-600', iconBg: 'bg-sky-50' },
  violet: { gradient: 'from-violet-500 to-fuchsia-500', iconText: 'text-violet-600', iconBg: 'bg-violet-50' },
  slate: { gradient: 'from-slate-700 to-slate-900', iconText: 'text-slate-700', iconBg: 'bg-slate-100' },
};

export const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  title,
  value,
  icon: Icon,
  accent = 'indigo',
  trend,
  trendUp,
  className,
}) => {
  const accentClass = accentClasses[accent];

  return (
    <DashboardSurface className={cx('p-5', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</h3>
          {trend && (
            <p className={cx('mt-3 text-xs font-medium', trendUp ? 'text-emerald-600' : 'text-rose-600')}>
              {trend}
            </p>
          )}
        </div>
        <div className={cx('rounded-2xl p-1.5 shadow-inner', accentClass.iconBg, accentClass.iconText)}>
          <div className={cx('flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br text-white', accentClass.gradient)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    </DashboardSurface>
  );
};

type DashboardNavButtonProps = {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  suffix?: React.ReactNode;
  compact?: boolean;
  className?: string;
};

export const DashboardNavButton: React.FC<DashboardNavButtonProps> = ({
  icon: Icon,
  label,
  active = false,
  onClick,
  suffix,
  compact = false,
  className,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cx(
      'group flex w-full items-center gap-3 rounded-2xl border px-4 text-left transition-all duration-200',
      compact ? 'py-3' : 'py-3.5',
      active
        ? 'border-indigo-400/40 bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-[0_20px_30px_-22px_rgba(99,102,241,0.85)]'
        : 'border-slate-600 bg-slate-800 text-slate-100 hover:border-slate-500 hover:bg-slate-700 hover:text-white',
      className
    )}
  >
    <div
      className={cx(
        'flex h-10 w-10 items-center justify-center rounded-2xl transition-colors',
        active ? 'bg-white/16 text-white' : 'bg-slate-700 text-slate-200 group-hover:bg-slate-600 group-hover:text-white'
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
    </div>
    <div className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium">{label}</span>
    </div>
    {suffix ?? <ChevronRight className={cx('h-4 w-4 shrink-0', active ? 'text-white/80' : 'text-slate-400')} />}
  </button>
);
