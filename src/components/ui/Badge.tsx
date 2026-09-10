import React from 'react';

interface BadgeProps {
  variant?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'indigo' | 'purple';
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ variant = 'gray', children, dot = false, className = '' }: BadgeProps) {
  const variants = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    gray: 'bg-navy-50 text-navy-600 border-navy-200',
    indigo: 'bg-primary-50 text-primary-700 border-primary-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const dotColors = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    gray: 'bg-navy-400',
    indigo: 'bg-primary-500',
    purple: 'bg-purple-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
