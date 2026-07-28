import { lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import PrivateRoute from '../utils/PrivateRoute';
import { DashboardSkeleton } from '../components/Skeleton';
import { PublicPageSpinner } from '../components/Spinner';
import { hasLikelyAuthSession } from '../utils/authHint';

const Landing = lazy(() => import('./Landing'));
const Dashboard = lazy(() => import('./Dashboard'));

function DashboardHome({ gated = true }) {
    const content = (
        <Layout>
            <Suspense fallback={<DashboardSkeleton />}>
                <Dashboard />
            </Suspense>
        </Layout>
    );

    return gated ? <PrivateRoute>{content}</PrivateRoute> : content;
}

/** Guests see marketing landing; signed-in users go straight to the dashboard. */
export default function Home() {
    const { isAuthenticated, loading, resolving } = useAuth();
    const authPending = loading || resolving;

    if (isAuthenticated) {
        return <DashboardHome />;
    }

    if (authPending && hasLikelyAuthSession()) {
        return <DashboardHome gated={false} />;
    }

    if (authPending) {
        return <PublicPageSpinner />;
    }

    return (
        <Suspense fallback={null}>
            <Landing />
        </Suspense>
    );
}
