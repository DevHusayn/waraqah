import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/Skeleton';

export default function PrivateRoute({ children }) {
    const location = useLocation();
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <PageLoader />;
    }

    if (!isAuthenticated) {
        const returnTo = `${location.pathname}${location.search}`;
        return <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />;
    }

    return children;
}
