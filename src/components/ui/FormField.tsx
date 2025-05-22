import { ReactNode } from 'react';
import clsx from 'clsx';

type FormFieldProps = {
  label?: string;
  error?: string;
  children: ReactNode;
  required?: boolean;
  className?: string;
};

export default function FormField({
  label,
  error,
  children,
  required,
  className
}: FormFieldProps) {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}