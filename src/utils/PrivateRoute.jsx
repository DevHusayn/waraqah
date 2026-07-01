import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { AppContentSkeleton } from '../components/Skeleton';

export default function PrivateRoute({ children }) {
    const location = useLocation();
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return (
            <Layout>
                <AppContentSkeleton />
            </Layout>
        );
    }

    if (!isAuthenticated) {
        const returnTo = `${location.pathname}${location.search}`;
        return <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />;
    }

    if (user?.emailVerified === false) {
        const email = encodeURIComponent(user.email || '');
        return <Navigate to={`/auth/check-email?email=${email}`} replace />;
    }

    return children;
}
