import React from 'react';
import { cn } from '../../lib/utils';

export interface PillSpinnerProps {
  className?: string;
  size?: 'xs' | 'sm' | 'default' | 'lg';
}

export const PillSpinner: React.FC<PillSpinnerProps> = ({
  className,
  size = 'default',
}) => {
  const sizeClasses = {
    xs: 'w-3.5 h-3.5 border-2',
    sm: 'w-4 h-4 border-2',
    default: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-[2.5px]',
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'rounded-full border-primary border-t-transparent animate-spin shrink-0',
        sizeClasses[size],
        className
      )}
    />
  );
};

export interface PillLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'default' | 'lg';
  fullWidth?: boolean;
  spinnerClassName?: string;
  label?: string;
}

export const PillLoader: React.FC<PillLoaderProps> = ({
  size = 'default',
  fullWidth = false,
  className,
  spinnerClassName,
  label,
  ...props
}) => {
  const containerSizes = {
    xs: 'px-4 py-1.5 min-h-8',
    sm: 'px-5 py-2.5 min-h-10',
    default: 'px-6 py-3 min-h-12',
    lg: 'px-8 py-3.5 min-h-14',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-secondary shadow-sm transition-all',
        containerSizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      <PillSpinner size={size} className={spinnerClassName} />
      {label && (
        <span className="ml-2.5 text-xs font-semibold text-secondary-foreground tracking-tight">
          {label}
        </span>
      )}
    </div>
  );
};

export default PillLoader;
