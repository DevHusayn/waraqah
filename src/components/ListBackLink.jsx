import { Link, useLocation } from 'react-router-dom';
import { resolveListBackTo } from '../utils/listNavigation';

export default function ListBackLink({ to, className, children }) {
    const location = useLocation();
    return (
        <Link to={resolveListBackTo(location.state?.fromList, to)} className={className}>
            {children}
        </Link>
    );
}
