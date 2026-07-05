import { lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import PrivateRoute from '../utils/PrivateRoute';
import { DashboardSkeleton } from '../components/Skeleton';

const Landing = lazy(() => import('./Landing'));
const Dashboard = lazy(() => import('./Dashboard'));

/** Guests see marketing landing; signed-in users go straight to the dashboard. */
export default function Home() {
    const { isAuthenticated } = useAuth();

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
