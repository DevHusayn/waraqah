import { useEffect, useState } from 'react';
import AppErrorScreen from './AppErrorScreen';
import { classifyError } from '../errors/classifyError';
import { ERROR_TYPES } from '../errors/errorStates';

export default function ErrorFallback({ error, onReset, errorType }) {
    const [isOnline, setIsOnline] = useState(
        typeof navigator === 'undefined' ? true : navigator.onLine
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const type = errorType || classifyError(error, { isOnline });

    // Leave the offline screen automatically when connectivity returns.
    useEffect(() => {
        if (type !== ERROR_TYPES.OFFLINE || !onReset) return undefined;

        const handleOnline = () => {
            onReset();
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [type, onReset]);

    return (
        <AppErrorScreen
            type={type}
            onReset={onReset}
            debugDetail={import.meta.env.DEV && error?.message ? error.message : null}
        />
    );
}
