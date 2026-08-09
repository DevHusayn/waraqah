import { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadExport } from '../utils/api';
import { buildListExportQuery, buildListExportFilename } from '../utils/pagination';
import Spinner from './Spinner';

export default function ListExportButton({
    path,
    resource,
    companyName,
    filters,
    disabled = false,
    onExported,
    onError,
    className = '',
}) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const query = buildListExportQuery(filters);
            const filename = buildListExportFilename(companyName, resource, filters);
            await downloadExport(`${path}?${query}`, { filename });
            onExported?.();
        } catch (err) {
            onError?.(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleExport}
            disabled={disabled || loading}
            title="Export all rows matching your current filters"
            aria-label="Export filtered list as CSV"
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-50 min-w-[108px] ${className}`.trim()}
        >
            {loading ? <Spinner size="sm" inline /> : <Download size={16} aria-hidden />}
            Export
        </button>
    );
}
