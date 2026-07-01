import { useAuth } from '../context/AuthContext';
import Landing from './Landing';
import Layout from '../components/Layout';
import Dashboard from './Dashboard';
import PrivateRoute from '../utils/PrivateRoute';
import { AppShellSkeleton } from '../components/Skeleton';
import { hasLikelyAuthSession } from '../utils/authHint';

/** Guests see marketing landing; signed-in users go straight to the dashboard. */
export default function Home() {
    const { isAuthenticated, loading } = useAuth();

    if (!loading && isAuthenticated) {
        return (
            <PrivateRoute>
                <Layout>
                    <Dashboard />
                </Layout>
            </PrivateRoute>
        );
    }

    if (loading && hasLikelyAuthSession()) {
        return <AppShellSkeleton />;
    }

    return <Landing />;
}
