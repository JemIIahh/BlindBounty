/**
 * Button Component
 *
 * A flexible button component with multiple variants, sizes, and states.
 * Supports icons, loading states, and full-width options.
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'link';
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Icon to display before children */
  leftIcon?: ReactNode;
  /** Icon to display after children */
  rightIcon?: ReactNode;
  /** Icon-only button (square with equal padding) */
  iconOnly?: boolean;
}

const variantClasses = {
  primary: [
    'bg-neutral-950 text-white',
    'hover:bg-neutral-800',
    'focus:ring-neutral-950',
    'shadow-sm hover:shadow-md',
    'active:bg-neutral-700',
  ].join(' '),
  secondary: [
    'bg-neutral-100 text-neutral-900 dark:bg-neutral-700 dark:text-neutral-100',
    'hover:bg-neutral-200 dark:hover:bg-neutral-600',
    'focus:ring-neutral-500',
    'active:bg-neutral-300 dark:active:bg-neutral-500',
  ].join(' '),
  outline: [
    'border-2 border-neutral-300 dark:border-neutral-600',
    'text-neutral-700 dark:text-neutral-300',
    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
    'hover:border-neutral-400 dark:hover:border-neutral-500',
    'focus:ring-neutral-500',
  ].join(' '),
  ghost: [
    'bg-transparent',
    'text-neutral-600 dark:text-neutral-400',
    'hover:bg-neutral-100 dark:hover:bg-neutral-800',
    'hover:text-neutral-900 dark:hover:text-neutral-100',
  ].join(' '),
  danger: [
    'bg-red-500 text-white',
    'hover:bg-red-600',
    'focus:ring-red-500',
    'shadow-sm hover:shadow-md',
    'active:bg-red-700',
  ].join(' '),
  success: [
    'bg-emerald-500 text-white',
    'hover:bg-emerald-600',
    'focus:ring-emerald-500',
    'shadow-sm hover:shadow-md',
    'active:bg-emerald-700',
  ].join(' '),
  warning: [
    'bg-amber-500 text-white',
    'hover:bg-amber-600',
    'focus:ring-amber-500',
    'shadow-sm hover:shadow-md',
    'active:bg-amber-700',
  ].join(' '),
  link: [
    'bg-transparent',
    'text-em-600 dark:text-em-400',
    'hover:text-em-700 dark:hover:text-em-300',
    'hover:underline',
    'p-0',
  ].join(' '),
};

const sizeClasses = {
  xs: 'px-2.5 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
  xl: 'px-8 py-4 text-lg gap-2.5',
};

const iconOnlySizeClasses = {
  xs: 'p-1',
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-3',
  xl: 'p-4',
};

const iconSizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

/**
 * Spinner component for loading state
 */
function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      iconOnly = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          'rounded-lg font-medium',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'focus:ring-offset-white dark:focus:ring-offset-neutral-900',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'active:scale-[0.98]',
          // Variant styles
          variantClasses[variant],
          // Size styles
          iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size],
          // Full width
          fullWidth && 'w-full',
          // Custom classes
          className
        )}
        {...props}
      >
        {loading && (
          <Spinner className={cn(iconSizeClasses[size], children ? 'mr-2' : '')} />
        )}
        {!loading && leftIcon && (
          <span className={cn('flex-shrink-0', iconSizeClasses[size])}>{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className={cn('flex-shrink-0', iconSizeClasses[size])}>{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * IconButton - A square button optimized for icons
 */
export interface IconButtonProps extends Omit<ButtonProps, 'iconOnly' | 'leftIcon' | 'rightIcon'> {
  /** Accessible label for the button */
  'aria-label': string;
  /** The icon to display */
  icon: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = 'md', className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        iconOnly
        size={size}
        className={cn('aspect-square', className)}
        {...props}
      >
        <span className={iconSizeClasses[size]}>{icon}</span>
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

/**
 * ButtonGroup - Group buttons together
 */
export interface ButtonGroupProps {
  /** Child buttons */
  children: ReactNode;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Size for all buttons in the group */
  size?: ButtonProps['size'];
  /** Additional CSS classes */
  className?: string;
}

export function ButtonGroup({
  children,
  orientation = 'horizontal',
  className,
}: ButtonGroupProps) {
  return (
    <div
      role="group"
      className={cn(
        'inline-flex',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        // Remove border radius from middle children
        '[&>*:not(:first-child):not(:last-child)]:rounded-none',
        orientation === 'horizontal' && [
          '[&>*:first-child]:rounded-r-none',
          '[&>*:last-child]:rounded-l-none',
          '[&>*:not(:first-child)]:-ml-px',
        ],
        orientation === 'vertical' && [
          '[&>*:first-child]:rounded-b-none',
          '[&>*:last-child]:rounded-t-none',
          '[&>*:not(:first-child)]:-mt-px',
        ],
        className
      )}
    >
      {children}
    </div>
  );
}

export default Button;
