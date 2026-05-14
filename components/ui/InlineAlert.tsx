import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type InlineAlertVariant = 'error' | 'success' | 'info';

interface InlineAlertProps {
  message: string;
  variant?: InlineAlertVariant;
  className?: string;
}

const variantMap: Record<
  InlineAlertVariant,
  { wrapper: string; icon: React.ComponentType<{ className?: string }> }
> = {
  error: {
    wrapper: 'border-red-200 bg-red-50 text-red-700',
    icon: AlertCircle,
  },
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: CheckCircle2,
  },
  info: {
    wrapper: 'border-sky-200 bg-sky-50 text-sky-700',
    icon: Info,
  },
};

export const InlineAlert: React.FC<InlineAlertProps> = ({ message, variant = 'error', className = '' }) => {
  const { wrapper, icon: Icon } = variantMap[variant];

  return (
    <div className={['rounded-lg border px-3 py-2 text-sm', wrapper, className].filter(Boolean).join(' ')}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
};
