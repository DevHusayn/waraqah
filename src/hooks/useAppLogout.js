import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clearGoogleAuthSession } from '../utils/googleAuth';

export default function useAppLogout() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    return useCallback(async () => {
        const googleEmail = user?.authProvider === 'google' ? user.email : null;
        // Await logout first so auth clears before settings/invoices reset via
        // the app-logout event — otherwise Layout briefly sees an authenticated
        // user with empty businessInfo and flashes the setup coachmark.
        await logout();
        clearGoogleAuthSession(googleEmail);
        navigate('/auth');
    }, [logout, navigate, user]);
}
