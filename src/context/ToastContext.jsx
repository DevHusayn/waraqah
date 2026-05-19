import { createContext, useCallback, useContext, useState } from 'react';
import ToastContainer from '../components/Toast';

const ToastContext = createContext(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return ctx;
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message, type = 'success') => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => dismiss(id), 4000);
    }, [dismiss]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </ToastContext.Provider>
    );
}
