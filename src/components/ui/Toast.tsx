import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

export type ToastProps = {
  text: string;
  onClose?: () => void;
  color?: 'success' | 'error' | 'info' | 'warning';
  icon?: ReactNode;
};

const colorClasses = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
  warning: 'bg-yellow-500 text-white'
};

export default function Toast({ text, color = 'info', icon, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg',
        'animate-[slideIn_200ms_ease-out]',
        'min-w-[300px] max-w-md',
        colorClasses[color]
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <p className="flex-1 text-sm">{text}</p>
      <button
        onClick={() => onClose?.()}
        className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}