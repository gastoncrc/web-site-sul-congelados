import { useCallback, useRef, useState } from 'react';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'danger';
}

const AUTO_DISMISS_MS = 4200;

// Misma firma que el viejo setSystemMessage (string) => void, para no tener que tocar
// ningún call site existente: todo el código admin ya llama setSystemMessage('✅ ...')
// o setSystemMessage('🚨 ...') — el emoji inicial decide el color del toast.
export const useToastQueue = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const pushToast = useCallback((message: string) => {
    if (!message) return;
    const id = nextId.current++;
    const type: ToastItem['type'] = message.trimStart().startsWith('🚨') ? 'danger' : 'success';
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismissToast(id), AUTO_DISMISS_MS);
  }, [dismissToast]);

  return { toasts, pushToast, dismissToast };
};
