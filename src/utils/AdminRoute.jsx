import { Navigate } from 'react-router-dom';
import { getToken, apiFetch } from '../utils/api';
import { useEffect, useState } from 'react';
import { PageLoader } from '../components/Spinner';

export default function AdminRoute({ children }) {
    const [isAdmin, setIsAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAdmin() {
            if (!getToken()) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            try {
                await apiFetch('/auth/admin/users');
                setIsAdmin(true);
                localStorage.setItem('isAdmin', 'true');
            } catch {
                setIsAdmin(false);
                localStorage.removeItem('isAdmin');
            } finally {
                setLoading(false);
            }
        }

        checkAdmin();
    }, []);

    if (loading) {
        return <PageLoader />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}
