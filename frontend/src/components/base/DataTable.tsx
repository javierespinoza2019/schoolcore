import { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export default function DataTable<T>({
  columns,
  data,
  rowKey,
  sortKey,
  sortDir,
  onSort,
  loading = false,
  emptyMessage = 'No se encontraron resultados',
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const alignClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  if (loading) {
    return (
      <div className={`bg-background-50 border border-secondary-200/70 rounded-lg overflow-hidden ${className}`}>
        <div className="animate-pulse">
          <div className="h-10 bg-secondary-100" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 border-t border-secondary-100 bg-secondary-50/50" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`bg-background-50 border border-secondary-200/70 rounded-lg ${className}`}>
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-secondary-100 mb-3">
            <i className="ri-inbox-line text-xl text-secondary-400" />
          </div>
          <p className="text-sm text-foreground-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-background-50 border border-secondary-200/70 rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full responsive-table">
          <thead>
            <tr className="border-b border-secondary-200/70">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold text-foreground-500 uppercase tracking-wider bg-secondary-50/70 ${alignClasses[col.align || 'left']} ${
                    col.sortable ? 'cursor-pointer select-none hover:text-foreground-700 transition-colors' : ''
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  scope="col"
                  aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      <i className={`text-xs ${sortDir === 'asc' ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`} aria-hidden="true" />
                    )}
                    {col.sortable && sortKey !== col.key && (
                      <i className="ri-expand-up-down-line text-xs text-foreground-300" aria-hidden="true" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-secondary-100/70 last:border-0 transition-colors duration-100 ${
                  onRowClick ? 'cursor-pointer hover:bg-secondary-50/70' : 'hover:bg-secondary-50/30'
                }`}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row); } } : undefined}
                role={onRowClick ? 'button' : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-sm text-foreground-800 ${alignClasses[col.align || 'left']}`}
                    data-label={col.header || undefined}
                  >
                    {col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}