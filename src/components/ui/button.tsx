import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'purple' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-2xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none';

    const variants = {
      default: 'bg-[#27D07F] text-neutral-950 hover:bg-[#22BD73] shadow-md shadow-[#27D07F]/10',
      purple: 'bg-[#B69EFF] text-neutral-950 hover:bg-[#A489F5] shadow-md shadow-[#B69EFF]/15',
      secondary: 'bg-[#181824] text-white hover:bg-[#222234] border border-white/5',
      outline: 'border border-white/15 bg-transparent hover:bg-white/5 text-white',
      ghost: 'bg-transparent text-[#8E8CA3] hover:text-white hover:bg-white/5',
    };

    const sizes = {
      default: 'h-13 px-6 text-base',
      sm: 'h-9 px-3.5 text-xs rounded-xl',
      lg: 'h-14 px-8 text-lg rounded-2xl',
      icon: 'h-10 w-10 p-0 rounded-full',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
