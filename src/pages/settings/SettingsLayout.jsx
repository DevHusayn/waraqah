import { Edit } from 'lucide-react';
import { Outlet } from 'react-router-dom';

export default function SettingsLayout() {
    return (
        <div className="max-w-3xl mx-auto pb-8 min-w-0">
            <Outlet />
        </div>
    );
}

export function SettingsEditButton({ onClick }) {
    return (
        <button type="button" onClick={onClick} className="btn-primary text-sm py-2">
            <Edit size={16} aria-hidden />
            Edit
        </button>
    );
}

export function SettingsEditingStatus() {
    return (
        <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" aria-hidden />
            Editing
        </span>
    );
}
