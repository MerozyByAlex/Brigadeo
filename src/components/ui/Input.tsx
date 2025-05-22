import { ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

type InputProps = {
  label?: string;
  type: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'danger';
  error?: string;
  icon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>;

const sizeClasses = {
  sm: 'h-8 text-sm',
  md: 'h-10 text-base',
  lg: 'h-12 text-lg'
} as const satisfies Record<string, string>;

const variantClasses = {
  default: 'border-gray-300 focus:border-gray-500',
  primary: 'border-blue-300 focus:border-blue-500',
  danger: 'border-red-300 focus:border-red-500'
} as const;

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    type,
    size = 'md',
    variant = 'default',
    error,
    icon,
    rightIcon,
    loading,
    className,
    ...props
  }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500">{icon}</span>
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={clsx(
            'w-full rounded-md border bg-white px-3 shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            sizeClasses[size],
            variantClasses[variant],
            icon && 'pl-10',
            (loading || rightIcon) && 'pr-10',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          disabled={loading}
          {...props}
        />
        {rightIcon && !loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightIcon}
          </div>
        )}
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input