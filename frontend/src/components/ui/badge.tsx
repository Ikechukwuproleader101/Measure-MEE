import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'purple' | 'outline' | 'secondary';
}

export function Badge({
  className,
  variant = 'default',
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-[#27D07F]/15 text-[#27D07F] border-[#27D07F]/20',
    purple: 'bg-[#B69EFF]/15 text-[#B69EFF] border-[#B69EFF]/20',
    secondary: 'bg-white/10 text-white/80 border-white/10',
    outline: 'border-white/20 text-white',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
