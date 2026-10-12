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
    default: 'bg-primary/15 text-primary border-primary/25',
    purple: 'bg-accent/15 text-accent border-accent/25',
    secondary: 'bg-secondary text-secondary-foreground border-border',
    outline: 'border-border text-foreground',
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
