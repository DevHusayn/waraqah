import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import ListSummaryStats from '../components/ListSummaryStats';
import AlertModal from '../components/AlertModal';
import ClientFormModal, { EMPTY_CLIENT } from '../components/ClientFormModal';
import PageHeader from '../components/PageHeader';
import { useInvoice } from '../context/InvoiceContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import DataTable, { DataTableRow, DataTableCell } from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import Toolbar, { ToolbarSearch, ToolbarActions } from '../components/Toolbar';
import PaginationBar from '../components/PaginationBar';
import { usePagedQuery } from '../hooks/usePagedQuery';
import { useListSummaryQuery } from '../hooks/useListSummaryQuery';
import { useListMonthFilter } from '../hooks/useListMonthFilter';
import ListMonthToolbarFilter from '../components/ListMonthToolbarFilter';
import ListExportButton from '../components/ListExportButton';
import { ListPageSkeleton, ListSummaryStatsSkeleton } from '../components/Skeleton';
import { apiFetch } from '../utils/api';
import { buildListQuery } from '../utils/pagination';
import { getClientBusiness } from '../utils/clientHelpers';
import { REPLAY_MASK } from '@waraqah/shared';

function safeReturnPath(path) {
    if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
    return path;
}

const COLUMNS = [
    { key: 'name', label: 'Name' },
    { key: 'business', label: 'Business' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
];

const mapClient = (c) => ({ ...c, id: c._id || c.id });

const Clients = () => {
    const { addClient, updateClient } = useInvoice();
    const { businessInfo } = useSettings();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = safeReturnPath(searchParams.get('returnTo'));
    const shouldOpenAdd = searchParams.get('add') === '1';
    const openedAddModal = useRef(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [modalInitialData, setModalInitialData] = useState(EMPTY_CLIENT);
    const [alert, setAlert] = useState({ open: false, message: '', type: 'error' });
    const {
        summaryYear,
        summaryMonth,
        monthInputValue,
        setMonthInputValue,
        periodLabel,
        isCurrentPeriod,
        listYear,
        listMonth,
        allTime,
        setAllTime,
        listMonthInputValue,
        setListMonthInputValue,
    } = useListMonthFilter();

    const fetcher = useCallback(
        ({ page, limit, search, year, month }) =>
            apiFetch(
                `/clients?${buildListQuery({
                    page,
                    limit,
                    search,
                    year,
                    month,
                })}`
            ),
        []
    );

    const { summary, summaryLoading, refreshSummary } = useListSummaryQuery('clients', summaryYear, summaryMonth);

    const {
        setPage,
        search,
        setSearch,
        debouncedSearch,
        data,
        pagination,
        loading,
        refresh,
    } = usePagedQuery({
        queryKeyBase: 'clients',
        fetcher,
        extraParams: { year: listYear, month: listMonth },
    });

    const clients = data.map(mapClient);

    useEffect(() => {
        setPage(1);
    }, [listYear, listMonth, setPage]);

    useEffect(() => {
        if (shouldOpenAdd && !openedAddModal.current) {
            openedAddModal.current = true;
            setEditingClient(null);
            setModalInitialData(EMPTY_CLIENT);
            setIsModalOpen(true);
        }
    }, [shouldOpenAdd]);

    const openModal = (client = null) => {
        if (client) {
            setEditingClient(client);
            setModalInitialData({
                name: client.name || '',
                business: getClientBusiness(client) || '',
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
            });
        } else {
            setEditingClient(null);
            setModalInitialData(EMPTY_CLIENT);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
        setModalInitialData(EMPTY_CLIENT);
    };

    const handleSubmit = async (formData, editing) => {
        try {
            if (editing) {
                await updateClient(editing.id, formData);
                showToast('Client updated successfully', 'success');
                closeModal();
                await refresh();
                await refreshSummary();
            } else {
                const newClient = await addClient(formData);
                showToast('Client added successfully', 'success');
                closeModal();
                if (returnTo) {
                    const join = returnTo.includes('?') ? '&' : '?';
                    navigate(`${returnTo}${join}clientId=${encodeURIComponent(newClient.id)}`);
                } else {
                    await refresh();
                    await refreshSummary();
                }
            }
        } catch (err) {
            setAlert({
                open: true,
                message: err.message || 'Failed to save client.',
                type: 'error',
            });
            throw err;
        }
    };

    const hasNoClientsAtAll =
        !loading && !search && (summary ? summary.totalClients === 0 : pagination.total === 0);
    const showClientStats = !(loading && clients.length === 0 && !search && !summary);
    const totalClients = summary?.totalClients;
    const newInPeriod = summary?.newInPeriod ?? summary?.newThisMonth;

    return (
        <>
            <AlertModal
                open={alert.open}
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ open: false, message: '', type: 'error' })}
            />
            <ClientFormModal
                open={isModalOpen}
                onClose={closeModal}
                onSubmit={handleSubmit}
                editingClient={editingClient}
                initialData={modalInitialData}
            />

            <PageHeader title="Clients" subtitle="Manage contacts for your invoices">
                <button type="button" onClick={() => openModal()} className="btn-primary">
                    <Plus size={16} aria-hidden />
                    Add client
                </button>
            </PageHeader>

            {showClientStats ? (
                <ListSummaryStats
                    visible
                    totalLabel="Total clients"
                    total={totalClients}
                    newInPeriod={newInPeriod}
                    newComparison={summary?.comparison?.newInPeriod}
                    comparisonLabel={isCurrentPeriod ? 'vs last month' : 'vs previous month'}
                    periodLabel={periodLabel}
                    monthInputValue={monthInputValue}
                    onPeriodChange={setMonthInputValue}
                    summaryLoading={summaryLoading}
                />
            ) : loading && clients.length === 0 && !search ? (
                <ListSummaryStatsSkeleton />
            ) : null}

            {loading && clients.length === 0 && !search ? (
                <ListPageSkeleton rows={8} columns={4} withHeader={false} />
            ) : hasNoClientsAtAll ? (
                <div className="data-table-wrap">
                    <EmptyState
                        icon={Users}
                        title="No clients yet"
                        description="Add your first client to start creating invoices with their contact details pre-filled."
                        action={
                            <button type="button" onClick={() => openModal()} className="btn-primary">
                                <Plus size={16} aria-hidden />
                                Add client
                            </button>
                        }
                    />
                </div>
            ) : (
                <>
                    <Toolbar className="mb-4">
                        <ToolbarSearch
                            icon={Search}
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search clients..."
                            aria-label="Search clients"
                        />
                        <ToolbarActions>
                        <ListMonthToolbarFilter
                            monthInputValue={listMonthInputValue}
                            onMonthChange={setListMonthInputValue}
                            allTime={allTime}
                            onShowAllTime={setAllTime}
                        />
                        <ListExportButton
                            path="/clients/export"
                            resource="clients"
                            companyName={businessInfo?.name}
                            filters={{
                                search: debouncedSearch,
                                year: listYear,
                                month: listMonth,
                            }}
                            disabled={pagination.total === 0}
                            onExported={() => showToast('Clients exported successfully.', 'success')}
                            onError={(err) => showToast(err.message || 'Export failed.', 'error')}
                        />
                    </ToolbarActions>
                </Toolbar>

                    {clients.length === 0 ? (
                        <div className="data-table-wrap">
                            <EmptyState
                                title="No clients match your search"
                                action={
                                    <button
                                        type="button"
                                        onClick={() => setSearch('')}
                                        className="btn-secondary"
                                    >
                                        Clear search
                                    </button>
                                }
                            />
                        </div>
                    ) : (
                        <>
                            <DataTable columns={COLUMNS}>
                                {clients.map((client) => (
                                    <DataTableRow
                                        key={client.id}
                                        onClick={() => navigate(`/clients/${client.id}`)}
                                        className="cursor-pointer"
                                    >
                                        <DataTableCell>
                                            <span className={`font-medium text-zinc-950 ${REPLAY_MASK.SENSITIVE}`}>
                                                {client.name}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell>
                                            <span className={`text-zinc-600 truncate max-w-[160px] block ${REPLAY_MASK.SENSITIVE}`}>
                                                {getClientBusiness(client) || '—'}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell>
                                            <span className={`text-zinc-600 truncate max-w-[180px] block ${REPLAY_MASK.SENSITIVE}`}>
                                                {client.email || '—'}
                                            </span>
                                        </DataTableCell>
                                        <DataTableCell>
                                            <span className={REPLAY_MASK.SENSITIVE}>{client.phone || '—'}</span>
                                        </DataTableCell>
                                    </DataTableRow>
                                ))}
                            </DataTable>
                            <PaginationBar
                                page={pagination.page}
                                totalPages={pagination.totalPages}
                                total={pagination.total}
                                onPageChange={setPage}
                                disabled={loading}
                            />
                        </>
                    )}
                </>
            )}
        </>
    );
};

export default Clients;
