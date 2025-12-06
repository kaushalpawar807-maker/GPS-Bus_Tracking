import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter, Download, Map as MapIcon, Edit, Trash, FileText } from 'lucide-react';
import { cn } from '../lib/utils';
import * as ContextMenu from '@radix-ui/react-context-menu';

export interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T) => ReactNode;
    width?: string;
    align?: 'left' | 'center' | 'right';
}

interface DataGridProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    onSearch?: (term: string) => void;
    title?: string;
    description?: string;
    actions?: ReactNode;
    onRowClick?: (item: T) => void;
    onRowAction?: (action: string, item: T) => void;
}

export default function DataGrid<T extends { id: string | number }>({
    columns,
    data,
    loading,
    onSearch,
    title,
    description,
    actions,
    onRowClick,
    onRowAction
}: DataGridProps<T>) {
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                <div>
                    {title && <h3 className="text-lg font-semibold text-slate-800">{title}</h3>}
                    {description && <p className="text-sm text-slate-500">{description}</p>}
                </div>

                <div className="flex items-center gap-3">
                    {onSearch && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-48 md:w-64 bg-white"
                                onChange={(e) => onSearch(e.target.value)}
                            />
                        </div>
                    )}
                    <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                        <Filter className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
                        <Download className="w-4 h-4" />
                    </button>
                    {actions}
                </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-left w-12">
                                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            </th>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={cn(
                                        "px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider",
                                        col.align === 'center' && "text-center",
                                        col.align === 'right' && "text-right"
                                    )}
                                    style={{ width: col.width }}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {loading ? (
                            // Loading Skeletons
                            [...Array(5)].map((_, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-4"><div className="w-4 h-4 bg-slate-100 rounded animate-pulse" /></td>
                                    {columns.map((_, j) => (
                                        <td key={j} className="px-6 py-4">
                                            <div className="h-4 bg-slate-100 rounded w-24 animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-500">
                                    No results found
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <ContextMenu.Root key={item.id}>
                                    <ContextMenu.Trigger asChild>
                                        <tr
                                            className={cn(
                                                "hover:bg-slate-50/80 transition-colors group relative",
                                                onRowClick && "cursor-pointer"
                                            )}
                                            onClick={() => onRowClick && onRowClick(item)}
                                        >
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 group-hover:border-indigo-300 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </td>
                                            {columns.map((col, idx) => (
                                                <td
                                                    key={idx}
                                                    className={cn(
                                                        "px-6 py-4 text-sm text-slate-600 whitespace-nowrap",
                                                        col.align === 'center' && "text-center",
                                                        col.align === 'right' && "text-right"
                                                    )}
                                                >
                                                    {col.render ? col.render(item) : (item[col.key as keyof T] as ReactNode)}
                                                </td>
                                            ))}
                                        </tr>
                                    </ContextMenu.Trigger>

                                    {/* Context Menu Content */}
                                    <ContextMenu.Portal>
                                        <ContextMenu.Content
                                            className="min-w-[180px] bg-white rounded-lg shadow-xl border border-slate-200 p-1 z-[100] animate-in fade-in zoom-in-95 duration-200"
                                        >
                                            <ContextMenu.Label className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                Quick Actions
                                            </ContextMenu.Label>

                                            <ContextMenu.Item
                                                className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 hover:text-indigo-600 rounded cursor-pointer outline-none"
                                                onClick={() => onRowAction && onRowAction('view_map', item)}
                                            >
                                                <MapIcon className="w-4 h-4" /> View on Map
                                            </ContextMenu.Item>

                                            <ContextMenu.Item
                                                className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 hover:text-indigo-600 rounded cursor-pointer outline-none"
                                                onClick={() => onRowAction && onRowAction('edit', item)}
                                            >
                                                <Edit className="w-4 h-4" /> Edit Details
                                            </ContextMenu.Item>

                                            <ContextMenu.Item
                                                className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 hover:text-indigo-600 rounded cursor-pointer outline-none"
                                                onClick={() => onRowAction && onRowAction('report', item)}
                                            >
                                                <FileText className="w-4 h-4" /> View Report
                                            </ContextMenu.Item>

                                            <ContextMenu.Separator className="h-px bg-slate-200 my-1" />

                                            <ContextMenu.Item
                                                className="flex items-center gap-2 px-2 py-1.5 text-sm text-rose-600 hover:bg-rose-50 rounded cursor-pointer outline-none"
                                                onClick={() => onRowAction && onRowAction('delete', item)}
                                            >
                                                <Trash className="w-4 h-4" /> Delete
                                            </ContextMenu.Item>
                                        </ContextMenu.Content>
                                    </ContextMenu.Portal>
                                </ContextMenu.Root>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="text-sm text-slate-500">
                    Showing <span className="font-medium text-slate-700">1</span> to <span className="font-medium text-slate-700">{Math.min(10, data.length)}</span> of <span className="font-medium text-slate-700">{data.length}</span> results
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 border border-slate-200 rounded-lg bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-50" disabled>
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button className="p-2 border border-slate-200 rounded-lg bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 disabled:opacity-50">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
