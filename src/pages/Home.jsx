import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from '../components/Skeleton';
import Landing from './Landing';
import Layout from '../components/Layout';
import Dashboard from './Dashboard';
import PrivateRoute from '../utils/PrivateRoute';

/** Guests see marketing landing; signed-in users go straight to the dashboard. */
export default function Home() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <PageLoader />;
    }

    if (isAuthenticated) {
        return (
            <PrivateRoute>
                <Layout>
                    <Dashboard />
                </Layout>
            </PrivateRoute>
        );
    }

    return <Landing />;
}
