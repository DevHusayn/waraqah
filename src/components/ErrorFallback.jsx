import { useCallback, useEffect, useState } from 'react';
import AppErrorScreen from './AppErrorScreen';
import { classifyError, isChunkLoadError } from '../errors/classifyError';
import { ERROR_TYPES } from '../errors/errorStates';
import { queryClient } from '../lib/queryClient';

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

    const handleTryAgain = useCallback(() => {
        if (isChunkLoadError(error)) {
            window.location.reload();
            return;
        }
        queryClient.resetQueries();
        onReset?.();
    }, [error, onReset]);

    // Leave the offline screen automatically when connectivity returns.
    useEffect(() => {
        if (type !== ERROR_TYPES.OFFLINE || !onReset) return undefined;

        const handleOnline = () => {
            handleTryAgain();
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [type, onReset, handleTryAgain]);

    return (
        <AppErrorScreen
            type={type}
            onReset={handleTryAgain}
            debugDetail={import.meta.env.DEV && error?.message ? error.message : null}
        />
    );
}
