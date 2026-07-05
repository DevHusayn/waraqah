import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppContentSkeleton } from '../components/Skeleton';

export default function AdminRoute({ children }) {
    const { isAuthenticated, isAdmin, loading, resolving } = useAuth();

    if (!isAuthenticated) {
        if (loading || resolving) {
            return <AppContentSkeleton />;
        }
        return <Navigate to="/auth" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}
