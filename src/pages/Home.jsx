import { lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import PrivateRoute from '../utils/PrivateRoute';
import { DashboardSkeleton } from '../components/Skeleton';
import { PublicPageSpinner } from '../components/Spinner';
import { hasLikelyAuthSession } from '../utils/authHint';

const Landing = lazy(() => import('./Landing'));
const Dashboard = lazy(() => import('./Dashboard'));

/** Guests see marketing landing; signed-in users go straight to the dashboard. */
export default function Home() {
    const { isAuthenticated, loading, resolving } = useAuth();
    const authPending = loading || resolving;
    const likelySession = isAuthenticated || hasLikelyAuthSession();

    if (authPending) {
        if (likelySession) {
            return (
                <Layout>
                    <DashboardSkeleton />
                </Layout>
            );
        }
        return <PublicPageSpinner />;
    }

    if (isAuthenticated) {
        return (
            <PrivateRoute>
                <Layout>
                    <Suspense fallback={<DashboardSkeleton />}>
                        <Dashboard />
                    </Suspense>
                </Layout>
            </PrivateRoute>
        );
    }

    return (
        <Suspense fallback={null}>
            <Landing />
        </Suspense>
    );
}
