import { Navigate } from 'react-router-dom';
import { getToken } from './api';

export default function AdminRoute({ children }) {
    const token = getToken();
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    if (!token) {
        return <Navigate to="/auth" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}
