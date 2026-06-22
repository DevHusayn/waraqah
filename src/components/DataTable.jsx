export default function DataTable({ columns, children, className = '' }) {
    return (
        <div className={`data-table-wrap ${className}`.trim()}>
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} className={col.className || ''}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    );
}

export function DataTableRow({ onClick, children, className = '' }) {
    const clickable = Boolean(onClick);
    return (
        <tr
            onClick={onClick}
            className={`${clickable ? 'data-table-row-clickable' : ''} ${className}`.trim()}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={
                clickable
                    ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onClick(e);
                          }
                      }
                    : undefined
            }
        >
            {children}
        </tr>
    );
}

export function DataTableCell({ children, className = '' }) {
    return <td className={className}>{children}</td>;
}
