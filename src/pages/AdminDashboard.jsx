import { useEffect, useState } from 'react';
import { apiFetch, getToken } from '../utils/api';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [actionLoading, setActionLoading] = useState('');
    const [alert, setAlert] = useState({ open: false, message: '' });
    // Confirm modal state
    const [confirm, setConfirm] = useState({ open: false, userId: null });
    // Get current user id from token (JWT payload)
    let currentUserId = '';
    try {
        const token = getToken();
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserId = payload.userId;
        }
    } catch { }

    useEffect(() => {
        async function fetchUsers() {
            try {
                const data = await apiFetch('/auth/admin/users');
                setUsers(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, []);

    if (loading) return <div className="text-center mt-10">Loading users...</div>;
    if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;

    // Filter users by name, email, or business name
    const filteredUsers = users.filter(user => {
        const q = search.toLowerCase();
        return (
            (user.name && user.name.toLowerCase().includes(q)) ||
            (user.email && user.email.toLowerCase().includes(q)) ||
            (user.businessInfo?.name && user.businessInfo.name.toLowerCase().includes(q))
        );
    });

    // Action handlers
    const handleStatus = async (userId) => {
        setActionLoading(userId + '-status');
        try {
            await apiFetch(`/auth/admin/users/${userId}/status`, { method: 'PATCH' });
            setUsers(users => users.map(u => u._id === userId ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u));
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
    };
    const handleDelete = (userId) => {
        setConfirm({ open: true, userId });
    };

    const confirmDelete = async () => {
        const userId = confirm.userId;
        setActionLoading(userId + '-delete');
        try {
            await apiFetch(`/auth/admin/users/${userId}`, { method: 'DELETE' });
            setUsers(users => users.filter(u => u._id !== userId));
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
        setConfirm({ open: false, userId: null });
    };
    const handleAdmin = async (userId) => {
        setActionLoading(userId + '-admin');
        try {
            await apiFetch(`/auth/admin/users/${userId}/admin`, { method: 'PATCH' });
            setUsers(users => users.map(u => u._id === userId ? { ...u, isAdmin: !u.isAdmin } : u));
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
    };

    // Admin unlock handler
    const handlePlan = async (userId, currentPlan) => {
        setActionLoading(userId + '-plan');
        const nextPlan = currentPlan === 'premium' ? 'free' : 'premium';
        try {
            const data = await apiFetch(`/auth/admin/users/${userId}/plan`, {
                method: 'PATCH',
                body: JSON.stringify({ plan: nextPlan }),
            });
            setUsers((users) =>
                users.map((u) =>
                    u._id === userId
                        ? {
                            ...u,
                            businessInfo: data.businessInfo || {
                                ...(u.businessInfo || {}),
                                plan: nextPlan,
                                businessLogo: nextPlan === 'premium' ? (u.businessInfo?.businessLogo || '') : '',
                            },
                        }
                        : u
                )
            );
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
    };

    const handleUnlock = async (userId) => {
        setActionLoading(userId + '-unlock');
        try {
            await apiFetch(`/auth/admin/users/${userId}/unlock`, { method: 'PATCH' });
            setUsers(users => users.map(u => u._id === userId ? { ...u, failedLoginAttempts: 0, lockUntil: undefined } : u));
            setAlert({ open: true, message: 'User account unlocked.' });
        } catch (e) {
            setAlert({ open: true, message: e.message });
        }
        setActionLoading('');
    };

    return (
        <>
            <AlertModal open={alert.open} message={alert.message} onClose={() => setAlert({ open: false, message: '' })} />
            <ConfirmModal
                open={confirm.open}
                message={"Are you sure you want to delete this user?"}
                onConfirm={confirmDelete}
                onCancel={() => setConfirm({ open: false, userId: null })}
            />
            <div className="max-w-7xl mx-auto mt-10">
                <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
                <div className="mb-4 flex justify-end">
                    <input
                        type="text"
                        className="input-field w-full max-w-xs"
                        placeholder="Search users..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="px-4 py-2 border-b">Name</th>
                                <th className="px-4 py-2 border-b">Email</th>
                                <th className="px-4 py-2 border-b">Admin?</th>
                                <th className="px-4 py-2 border-b">Status</th>
                                <th className="px-4 py-2 border-b">Registered</th>
                                <th className="px-4 py-2 border-b">Last Login</th>
                                <th className="px-4 py-2 border-b"># Invoices</th>
                                <th className="px-4 py-2 border-b"># Clients</th>
                                <th className="px-4 py-2 border-b">Business Name</th>
                                <th className="px-4 py-2 border-b">Address</th>
                                <th className="px-4 py-2 border-b">Phone</th>
                                <th className="px-4 py-2 border-b">Website</th>
                                <th className="px-4 py-2 border-b">Currency</th>
                                <th className="px-4 py-2 border-b">Plan</th>
                                <th className="px-4 py-2 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user._id} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-2">{user.name || '-'}</td>
                                    <td className="px-4 py-2">{user.email}</td>
                                    <td className="px-4 py-2 text-center">{user.isAdmin ? '✔️' : ''}</td>
                                    <td className="px-4 py-2 text-center">{user.status || '-'}</td>
                                    <td className="px-4 py-2">{user.createdAt ? new Date(user.createdAt).toLocaleString() : '-'}</td>
                                    <td className="px-4 py-2">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '-'}</td>
                                    <td className="px-4 py-2 text-center">{user.invoiceCount}</td>
                                    <td className="px-4 py-2 text-center">{user.clientCount}</td>
                                    <td className="px-4 py-2">
                                        {user.businessInfo?.name || <span className="text-red-600 font-semibold">Missing</span>}
                                    </td>
                                    <td className="px-4 py-2">{user.businessInfo?.address || (user.businessInfo ? '-' : <span className="text-red-600 font-semibold">Missing</span>)}</td>
                                    <td className="px-4 py-2">{user.businessInfo?.phone || (user.businessInfo ? '-' : <span className="text-red-600 font-semibold">Missing</span>)}</td>
                                    <td className="px-4 py-2">{user.businessInfo?.website || (user.businessInfo ? '-' : <span className="text-red-600 font-semibold">Missing</span>)}</td>
                                    <td className="px-4 py-2">{user.businessInfo?.defaultCurrency || (user.businessInfo ? '-' : <span className="text-red-600 font-semibold">Missing</span>)}</td>
                                    <td className="px-4 py-2 text-center capitalize">{user.businessInfo?.plan || 'free'}</td>
                                    <td className="px-4 py-2 text-center">
                                        <button
                                            className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-1 rounded mr-1 disabled:opacity-50"
                                            disabled={actionLoading === user._id + '-plan'}
                                            onClick={() => handlePlan(user._id, user.businessInfo?.plan || 'free')}
                                        >
                                            {user.businessInfo?.plan === 'premium' ? 'Revoke Premium' : 'Grant Premium'}
                                        </button>
                                        <button
                                            className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded mr-1 disabled:opacity-50"
                                            disabled={actionLoading === user._id + '-status' || user._id === currentUserId}
                                            onClick={() => handleStatus(user._id)}
                                        >
                                            {user.status === 'active' ? 'Suspend' : 'Activate'}
                                        </button>
                                        <button
                                            className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded mr-1 disabled:opacity-50"
                                            disabled={actionLoading === user._id + '-delete' || user._id === currentUserId}
                                            onClick={() => handleDelete(user._id)}
                                        >
                                            Delete
                                        </button>
                                        <button
                                            className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded disabled:opacity-50"
                                            disabled={actionLoading === user._id + '-admin' || user._id === currentUserId}
                                            onClick={() => handleAdmin(user._id)}
                                        >
                                            {user.isAdmin ? 'Demote' : 'Promote'}
                                        </button>
                                        <button
                                            className="text-xs bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded disabled:opacity-50 ml-1"
                                            disabled={actionLoading === user._id + '-unlock' || user._id === currentUserId || (!user.lockUntil && (!user.failedLoginAttempts || user.failedLoginAttempts < 5))}
                                            onClick={() => handleUnlock(user._id)}
                                        >
                                            Unlock
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}
