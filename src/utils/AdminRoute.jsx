import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { AppContentSkeleton } from '../components/Skeleton';

export default function AdminRoute({ children }) {
    const { isAuthenticated, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <Layout>
                <AppContentSkeleton />
            </Layout>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}
