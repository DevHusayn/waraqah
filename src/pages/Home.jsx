import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Dashboard from './Dashboard';
import PrivateRoute from '../utils/PrivateRoute';
import { AppShellSkeleton } from '../components/Skeleton';
import { hasLikelyAuthSession } from '../utils/authHint';
import { lazy, Suspense } from 'react';

const Landing = lazy(() => import('./Landing'));

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

    return (
        <Suspense fallback={<AppShellSkeleton />}>
            <Landing />
        </Suspense>
    );
}
