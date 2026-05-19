import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from './api';

export default function PrivateRoute({ children }) {
    const location = useLocation();
    const isLoggedIn = Boolean(getToken());

    if (!isLoggedIn) {
        const returnTo = `${location.pathname}${location.search}`;
        return <Navigate to={`/auth?returnTo=${encodeURIComponent(returnTo)}`} replace />;
    }

    return children;
}
