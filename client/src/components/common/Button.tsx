import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils.js';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'critical' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex flex-row items-center justify-center font-semibold rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer active:scale-[0.98] whitespace-nowrap min-h-[38px] sm:min-h-[auto]';

    const variants = {
      primary:
        'bg-[#D92D45] hover:bg-[#B42318] active:bg-[#8F1D35] text-white focus-visible:ring-[#D92D45] shadow-xs hover:shadow-sm',
      secondary:
        'bg-[#FAF9F7] hover:bg-white active:bg-[#F5F5F4] text-[#1F2937] border border-[#E7E5E4] focus-visible:ring-[#D92D45] shadow-xs',
      danger:
        'bg-[#B42318] hover:bg-[#991B1B] active:bg-[#7F1D1D] text-white focus-visible:ring-[#B42318] shadow-xs',
      critical:
        'bg-[#D92D45] hover:bg-[#B42318] active:bg-[#8F1D35] text-white font-bold shadow-xs focus-visible:ring-[#D92D45]',
      success:
        'bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] text-white focus-visible:ring-[#15803D] shadow-xs',
      outline:
        'border border-[#E7E5E4] bg-white text-[#1F2937] hover:bg-[#FAF9F7] hover:border-[#D6D3D1] active:bg-[#F5F5F4] focus-visible:ring-[#D92D45] shadow-xs',
      ghost:
        'bg-transparent text-[#1F2937] hover:bg-[#FFF0F2] hover:text-[#D92D45] active:bg-[#FFE4E8] focus-visible:ring-[#D92D45]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
      md: 'text-xs sm:text-sm px-4 py-2 gap-2 h-10',
      lg: 'text-sm sm:text-base px-6 py-2.5 gap-2.5 h-12',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
        ) : (
          leftIcon && <span className="inline-flex items-center shrink-0">{leftIcon}</span>
        )}
        <span className="inline-flex items-center">{children}</span>
        {!isLoading && rightIcon && <span className="inline-flex items-center shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
