import { Navigate } from 'react-router-dom';
import { getToken } from '../utils/api';
import Landing from './Landing';
import Layout from '../components/Layout';
import Dashboard from './Dashboard';
import PrivateRoute from '../utils/PrivateRoute';

/** Guests see marketing landing; signed-in users go straight to the dashboard. */
export default function Home() {
    if (getToken()) {
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
