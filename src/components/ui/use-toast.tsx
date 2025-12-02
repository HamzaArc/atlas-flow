import { create } from 'zustand';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { cn } from "@/lib/utils";

// 1. The Store to manage notifications
// Added 'warning' to the allowed types
type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  toast: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  toast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// 2. The Component to display them
export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div 
          key={t.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all animate-in slide-in-from-right-full",
            // Added conditional styling for 'warning'
            t.type === 'success' ? "bg-white border-green-200 text-green-700" :
            t.type === 'error' ? "bg-white border-red-200 text-red-700" :
            t.type === 'warning' ? "bg-white border-amber-200 text-amber-700" :
            "bg-slate-900 text-white border-slate-800"
          )}
        >
          {t.type === 'success' && <CheckCircle className="h-4 w-4" />}
          {t.type === 'error' && <AlertCircle className="h-4 w-4" />}
          {t.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
          {t.type === 'info' && <Info className="h-4 w-4" />}
          
          <span>{t.message}</span>
          
          <button onClick={() => dismiss(t.id)} className="ml-4 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}