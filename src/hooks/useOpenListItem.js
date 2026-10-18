import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listLocationState, resolveListBackTo } from '../utils/listNavigation';

export function useOpenListItem() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = useMemo(
        () => listLocationState(location),
        [location.pathname, location.search]
    );

    return useCallback((to) => navigate(to, { state }), [navigate, state]);
}

export function useListBackTo(fallback) {
    const location = useLocation();
    return resolveListBackTo(location.state?.fromList, fallback);
}

export function useListLinkState() {
    const location = useLocation();
    return useMemo(
        () => listLocationState(location),
        [location.pathname, location.search]
    );
}
