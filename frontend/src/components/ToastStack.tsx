import React from 'react';
import type { ToastItem } from '../hooks/useToastQueue';

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

export const ToastStack: React.FC<ToastStackProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-[min(320px,calc(100vw-2.5rem))]">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`relative overflow-hidden bg-paper border border-line rounded-xl shadow-lg px-4 py-3 text-sm text-ink flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'danger' ? 'border-l-4 border-l-danger' : 'border-l-4 border-l-success'
          }`}
        >
          <span className="flex-1 leading-snug">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-ink-soft hover:text-ink font-bold text-xs shrink-0 cursor-pointer"
          >
            ✕
          </button>
          <div
            className={`absolute left-0 bottom-0 h-0.5 ${toast.type === 'danger' ? 'bg-danger' : 'bg-success'}`}
            style={{ animation: 'toast-shrink 4.2s linear forwards' }}
          />
        </div>
      ))}
      <style>{`@keyframes toast-shrink { from { width: 100%; } to { width: 0%; } }`}</style>
    </div>
  );
};
