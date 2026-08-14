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
            className={`inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-md border border-zinc-200/80 bg-white text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 sm:h-auto sm:w-auto sm:min-w-[108px] sm:gap-1.5 sm:rounded-xl sm:border-zinc-200 sm:px-3 sm:py-2 ${className}`.trim()}
        >
            {loading ? <Spinner size="sm" inline /> : <Download size={16} aria-hidden />}
            <span className="hidden sm:inline">Export</span>
        </button>
    );
}
