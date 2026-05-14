import React from 'react';
import { LucideIcon } from 'lucide-react';
import { DashboardMetricCard } from './ui/DashboardPrimitives';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  colorClass: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, trend, trendUp, colorClass }) => {
  const accent =
    colorClass.includes('green')
      ? 'emerald'
      : colorClass.includes('blue')
        ? 'sky'
        : colorClass.includes('amber')
          ? 'amber'
          : colorClass.includes('purple') || colorClass.includes('violet')
            ? 'violet'
            : colorClass.includes('red')
              ? 'rose'
              : 'indigo';

  return (
    <DashboardMetricCard
      title={title}
      value={value}
      icon={Icon}
      accent={accent}
      trend={trend}
      trendUp={trendUp}
    />
  );
};