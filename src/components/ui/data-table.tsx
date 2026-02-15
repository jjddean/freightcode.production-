import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  mono?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  toolbarActions?: React.ReactNode;
  filterPanel?: React.ReactNode;
  className?: string;
  rowsPerPage?: number;
  onRowClick?: (row: T) => void;
}

function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = "Search...",
  onSearchChange,
  searchValue,
  toolbarActions,
  filterPanel,
  className,
  rowsPerPage = 10,
  onRowClick
}: DataTableProps<T>) {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Use controlled or uncontrolled search term
  const activeSearchTerm = searchValue !== undefined ? searchValue : internalSearchTerm;

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchTerm(value);
    }
  };

  // Filter data based on search term (only if internal search is active)
  // If controlled (onSearchChange provided), assume parent handles filtering OR we still filter?
  // Usually if controlled, parent handles it.
  // BUT, to keep backward compat and flexibility:
  // If `searchValue` is provided, we use it for input.
  // We ONLY filter internally if `onSearchChange` is NOT provided (fully internal mode)
  // OR if the user expects us to filter controlled data?
  // Let's assume: if onSearchChange is present, PARENT filters.
  const filteredData = onSearchChange
    ? data
    : data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(activeSearchTerm.toLowerCase())
      )
    );

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;

    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + rowsPerPage);

  const handleSort = (column: keyof T) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 shadow-sm w-full min-w-0 overflow-hidden", className)}>
      {/* Search Bar & Toolbar */}
      {(searchable || toolbarActions) && (
        <div className="p-4 border-b border-gray-200 space-y-4">
          <div className="flex items-center justify-between gap-4">
            {searchable && (
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={activeSearchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            )}
            {toolbarActions}
          </div>
          {filterPanel}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    "px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider",
                    column.sortable && "cursor-pointer hover:bg-gray-100",
                    column.align === 'right' && "text-right",
                    column.align === 'center' && "text-center",
                    column.className
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className={cn(
                    "flex items-center space-x-1",
                    column.align === 'right' && "justify-end",
                    column.align === 'center' && "justify-center"
                  )}>
                    <span>{column.header}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <svg
                          className={cn(
                            "w-3 h-3",
                            sortColumn === column.key && sortDirection === 'asc'
                              ? "text-primary"
                              : "text-gray-300"
                          )}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        <svg
                          className={cn(
                            "w-3 h-3 -mt-1",
                            sortColumn === column.key && sortDirection === 'desc'
                              ? "text-primary"
                              : "text-gray-300"
                          )}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => (
              <tr
                key={index}
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={cn(
                      "px-4 py-3 text-sm text-slate-700",
                      column.mono && "font-mono text-[13px] font-semibold tracking-tight text-slate-500",
                      column.align === 'right' && "text-right",
                      column.align === 'center' && "text-center",
                      column.className
                    )}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : String(row[column.key] || '-')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(startIndex + rowsPerPage, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
