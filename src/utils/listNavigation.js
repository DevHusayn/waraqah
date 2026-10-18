export function listLocationState(location) {
    const pathname = location?.pathname || '';
    const search = location?.search || '';
    return { fromList: `${pathname}${search}` };
}

export function resolveListBackTo(fromList, fallback) {
    if (typeof fromList !== 'string' || !fromList.startsWith('/') || fromList.startsWith('//')) {
        return fallback;
    }
    return fromList;
}
