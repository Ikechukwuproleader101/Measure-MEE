import * as React from 'react';
import { cn } from '../../lib/utils';
import { PillSpinner } from '../common/PillLoader';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'purple' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full transition-all active:scale-[0.98] cursor-pointer disabled:pointer-events-none select-none';

    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md',
      purple: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border',
      outline: 'border border-border bg-transparent hover:bg-muted text-foreground',
      ghost: 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted',
    };

    const sizes = {
      default: 'h-13 px-6 text-base rounded-full',
      sm: 'h-9 px-4 text-xs rounded-full',
      lg: 'h-14 px-8 text-lg rounded-full',
      icon: 'h-10 w-10 p-0 rounded-full',
    };

    if (isLoading) {
      return (
        <button
          ref={ref}
          disabled
          aria-busy="true"
          className={cn(
            baseStyles,
            sizes[size],
            'bg-gray-200 text-gray-800 shadow-sm cursor-not-allowed hover:bg-gray-200 active:scale-100 opacity-100',
            className
          )}
          {...props}
        >
          <PillSpinner size={size === 'sm' || size === 'icon' ? 'sm' : 'default'} />
        </button>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], disabled && 'opacity-50', className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
