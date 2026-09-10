import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'indigo' | 'purple';
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendUp,
  color = 'blue',
  onClick,
}: StatCardProps) {
  const iconColors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    indigo: 'bg-primary-50 text-primary-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div 
      className={`bg-white rounded-xl border border-navy-100 p-5 hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-primary-200' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-navy-500">{title}</p>
          <p className="text-2xl font-bold text-navy-900 mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p
              className={`text-xs font-medium mt-2 ${
                trendUp ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${iconColors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
