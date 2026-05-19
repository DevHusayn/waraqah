// import { Navigate } from 'react-router-dom';

/** Auth bypass — renders children without login. Restore redirect when re-enabling auth. */
export default function PrivateRoute({ children }) {
    // const isLoggedIn = Boolean(localStorage.getItem('token'));
    // return isLoggedIn ? children : <Navigate to="/auth" replace />;
    return children;
}
