import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface Toast {
  id: string;
  type: 'emergency' | 'urgent' | 'routine' | 'success' | 'info';
  title: string;
  message: string;
  duration?: number; // ms, default 5000
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration ?? 5000;
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300); // Start exit animation 300ms before removal

    const removeTimer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast.id, toast.duration, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  };

  const bgColor = {
    emergency: 'bg-red-50 border-red-500',
    urgent: 'bg-amber-50 border-amber-500',
    routine: 'bg-teal-50 border-teal-500',
    success: 'bg-green-50 border-green-500',
    info: 'bg-blue-50 border-blue-500',
  }[toast.type];

  const iconBg = {
    emergency: 'bg-red-500',
    urgent: 'bg-amber-500',
    routine: 'bg-teal-500',
    success: 'bg-green-500',
    info: 'bg-blue-500',
  }[toast.type];

  const textColor = {
    emergency: 'text-red-800',
    urgent: 'text-amber-800',
    routine: 'text-teal-800',
    success: 'text-green-800',
    info: 'text-blue-800',
  }[toast.type];

  const icon = {
    emergency: '!',
    urgent: '!',
    routine: 'i',
    success: '✓',
    info: 'i',
  }[toast.type];

  return (
    <div
      className={`
        transform transition-all duration-300 ease-out
        ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
    >
      <div className={`rounded-2xl shadow-2xl p-4 w-80 border-l-4 ${bgColor}`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>
            <span className="text-white text-lg font-bold">{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold ${textColor}`}>{toast.title}</p>
            <p className={`text-sm mt-1 ${textColor} opacity-80`}>{toast.message}</p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${iconBg} rounded-full`}
            style={{
              animation: `shrink ${toast.duration ?? 5000}ms linear forwards`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  // Create portal container if it doesn't exist
  let portalRoot = document.getElementById('toast-portal');
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.id = 'toast-portal';
    document.body.appendChild(portalRoot);
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    portalRoot
  );
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}
