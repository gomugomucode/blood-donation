import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog with Viewport Bound & Internal Scroll */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative w-full rounded-2xl bg-white p-4 sm:p-6 shadow-2xl transition-all z-10 text-left',
          'border border-slate-200/80 max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] flex flex-col my-auto',
          maxWidths[maxWidth]
        )}
      >
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-slate-100 shrink-0">
          <div className="pr-2">
            <h2 id="modal-title" className="text-base sm:text-lg font-bold text-slate-900">
              {title}
            </h2>
            {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-3 sm:mt-4 overflow-y-auto pr-1 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
