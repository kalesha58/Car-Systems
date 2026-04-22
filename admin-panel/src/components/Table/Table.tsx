import { SkeletonTable } from '@components/Skeleton';
import { motion } from 'framer-motion';
import React, { ReactNode, useCallback,useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

interface IColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  width?: string;
  sortable?: boolean;
  sortValue?: (item: T) => string | number | Date;
}

interface ITableProps<T> {
  columns: IColumn<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  enableColumnReorder?: boolean;
  onColumnsChange?: (columns: IColumn<T>[]) => void;
}

export function Table<T extends { id: string }>({
  columns: initialColumns,
  data,
  onRowClick,
  loading = false,
  enableColumnReorder = true,
  onColumnsChange,
}: ITableProps<T>) {
  const [columns, setColumns] = useState<IColumn<T>[]>(initialColumns);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: SortDirection;
  } | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Update columns when initialColumns change
  React.useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Handle column reordering
  const handleDragStart = useCallback((columnKey: string) => {
    if (!enableColumnReorder) return;
    setDraggedColumn(columnKey);
  }, [enableColumnReorder]);

  const handleDragOver = useCallback((e: React.DragEvent, columnKey: string) => {
    if (!enableColumnReorder || !draggedColumn) return;
    e.preventDefault();
    setDragOverColumn(columnKey);
  }, [enableColumnReorder, draggedColumn]);

  const handleDrop = useCallback((e: React.DragEvent, targetColumnKey: string) => {
    if (!enableColumnReorder || !draggedColumn || draggedColumn === targetColumnKey) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    e.preventDefault();
    const newColumns = [...columns];
    const draggedIndex = newColumns.findIndex((col) => col.key === draggedColumn);
    const targetIndex = newColumns.findIndex((col) => col.key === targetColumnKey);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [removed] = newColumns.splice(draggedIndex, 1);
      newColumns.splice(targetIndex, 0, removed);
      setColumns(newColumns);
      onColumnsChange?.(newColumns);
    }

    setDraggedColumn(null);
    setDragOverColumn(null);
  }, [enableColumnReorder, draggedColumn, columns, onColumnsChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  }, []);

  // Handle sorting
  const handleSort = useCallback((columnKey: string, sortable?: boolean) => {
    if (!sortable) return;

    setSortConfig((current) => {
      if (current?.key === columnKey) {
        // Cycle through: asc -> desc -> null
        if (current.direction === 'asc') {
          return { key: columnKey, direction: 'desc' };
        } else if (current.direction === 'desc') {
          return null;
        }
      }
      return { key: columnKey, direction: 'asc' };
    });
  }, []);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    const column = columns.find((col) => col.key === sortConfig.key);
    if (!column || !column.sortable) return data;

    return [...data].sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      if (column.sortValue) {
        aValue = column.sortValue(a);
        bValue = column.sortValue(b);
      } else {
        aValue = a[sortConfig.key as keyof T] as string | number | Date;
        bValue = b[sortConfig.key as keyof T] as string | number | Date;
      }

      // Handle different types
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue ?? '').toLowerCase();
      const bStr = String(bValue ?? '').toLowerCase();

      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [data, sortConfig, columns]);

  if (loading) {
    return <SkeletonTable rows={5} columns={columns.length} />;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
  };

  const getSortIcon = (columnKey: string, sortable?: boolean) => {
    if (!sortable) return null;

    const isActive = sortConfig?.key === columnKey;
    const direction = isActive ? sortConfig.direction : null;

    return (
      <span className="ml-2 inline-flex items-center">
        {direction === 'asc' && (
          <motion.svg
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-600 dark:text-primary-400"
          >
            <path d="M18 15l-6-6-6 6" />
          </motion.svg>
        )}
        {direction === 'desc' && (
          <motion.svg
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary-600 dark:text-primary-400"
          >
            <path d="M6 9l6 6 6-6" />
          </motion.svg>
        )}
        {!direction && (
          <motion.svg
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <path d="M7 13l5 5 5-5M7 6l5-5 5 5" />
          </motion.svg>
        )}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl shadow-sm">
      <div className="overflow-y-auto max-h-[400px] sm:max-h-[500px] md:max-h-[600px] min-w-[640px] sm:min-w-0">
        <table className="w-full border-separate border-spacing-0 bg-transparent">
          <thead className="sticky top-0 z-10 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <tr className="border-b-2 border-slate-200/50 dark:border-slate-700/50">
              {columns.map((column) => {
                const isDragged = draggedColumn === column.key;
                const isDragOver = dragOverColumn === column.key;
                const isSortable = column.sortable !== false;
                const isActive = sortConfig?.key === column.key;

                return (
                  <th
                    key={column.key}
                    draggable={enableColumnReorder}
                    onDragStart={() => handleDragStart(column.key)}
                    onDragOver={(e) => handleDragOver(e, column.key)}
                    onDrop={(e) => handleDrop(e, column.key)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleSort(column.key, isSortable)}
                    className={`
                      px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider
                      text-slate-600 dark:text-slate-400
                      bg-slate-50/80 dark:bg-slate-900/80
                      transition-all duration-200
                      group
                      ${isSortable ? 'cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800/80' : ''}
                      ${isActive ? 'bg-primary-50/50 dark:bg-primary-900/20' : ''}
                      ${isDragged ? 'opacity-50' : ''}
                      ${isDragOver ? 'border-l-2 border-l-primary-500' : ''}
                    `}
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {enableColumnReorder && (
                          <span className="text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="3" y1="12" x2="21" y2="12"></line>
                              <line x1="3" y1="6" x2="21" y2="6"></line>
                              <line x1="3" y1="18" x2="21" y2="18"></line>
                            </svg>
                          </span>
                        )}
                        {column.header}
                      </span>
                      {getSortIcon(column.key, isSortable)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <motion.tbody
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-transparent"
          >
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  No data available
                </td>
              </tr>
            ) : (
              sortedData.map((item) => (
                <motion.tr
                  key={item.id}
                  variants={rowVariants}
                  onClick={() => onRowClick?.(item)}
                  className={`
                    border-b border-slate-200/50 dark:border-slate-700/50
                    ${onRowClick ? 'cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors' : ''}
                  `}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-4 py-3 text-slate-900 dark:text-slate-100 text-sm"
                    >
                      {column.render
                        ? column.render(item)
                        : (item[column.key as keyof T] as ReactNode)}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}
