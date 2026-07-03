import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import Dashboard from './Dashboard';
import PrivateRoute from '../utils/PrivateRoute';
import { lazy, Suspense } from 'react';

const Landing = lazy(() => import('./Landing'));

/** Guests see marketing landing; signed-in users go straight to the dashboard. */
export default function Home() {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return (
            <PrivateRoute>
                <Layout>
                    <Dashboard />
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
