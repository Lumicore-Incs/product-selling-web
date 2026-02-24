import {
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  MapPinIcon,
  PackageIcon,
  PencilIcon,
  PhoneIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Sale, SaleItem } from '../models/sales';
import { ConfirmDialog } from './ConfirmDialog';
import { SalesViewModal } from './SalesViewModal';
import Spinner from './Spinner';

const DEFAULT_COLUMN_WIDTHS = {
  serial: 100,
  waybill: 140,
  customer: 200,
  orderDate: 150,
  address: 220,
  contact1: 160,
  contact2: 160,
  status: 150,
  qty: 90,
  products: 160,
  total: 160,
  actions: 140,
} as const;

type ColumnKey = keyof typeof DEFAULT_COLUMN_WIDTHS;

interface ServerSidePagination {
  page: number; // 0-based
  totalPages: number;
  totalElements: number;
  size: number;
  sizeOptions?: number[];
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

interface SalesTableProps {
  sales: Sale[];
  isLoading?: boolean;
  onEdit: (sale: Sale) => void;
  onDelete: (id: string) => void;
  userRole?: string;
  onRefresh?: () => void;
  onStatusChange?: (saleId: string, newStatus: string) => void;
  hideSearch?: boolean;
  serverSidePagination?: ServerSidePagination;
}

export const SalesTable: React.FC<SalesTableProps> = ({
  sales,
  isLoading,
  onEdit,
  onDelete,
  userRole,
  onRefresh,
  onStatusChange,
  hideSearch,
  serverSidePagination,
}) => {
  // Status options
  const statusOptions = ['TEMPORARY', 'PENDING'];
  const [columnWidths, setColumnWidths] = useState(DEFAULT_COLUMN_WIDTHS);
  const resizingRef = useRef<null | { key: ColumnKey; startX: number; startWidth: number }>(null);

  const handleColumnMouseMove = useCallback((event: MouseEvent) => {
    const resizing = resizingRef.current;
    if (!resizing) return;
    event.preventDefault();
    const delta = event.clientX - resizing.startX;
    const nextWidth = Math.max(70, resizing.startWidth + delta);
    setColumnWidths((prev) => ({
      ...prev,
      [resizing.key]: nextWidth,
    }));
  }, []);

  const handleColumnMouseUp = useCallback(() => {
    if (resizingRef.current) {
      resizingRef.current = null;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleColumnMouseMove);
    window.addEventListener('mouseup', handleColumnMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleColumnMouseMove);
      window.removeEventListener('mouseup', handleColumnMouseUp);
    };
  }, [handleColumnMouseMove, handleColumnMouseUp]);

  const startColumnResize = (key: ColumnKey, event: React.MouseEvent) => {
    event.preventDefault();
    resizingRef.current = {
      key,
      startX: event.clientX,
      startWidth: columnWidths[key] ?? DEFAULT_COLUMN_WIDTHS[key],
    };
  };

  const columnWidth = (key: ColumnKey) => columnWidths[key] ?? DEFAULT_COLUMN_WIDTHS[key];
  const widthStyle = (key: ColumnKey) => ({
    width: columnWidth(key),
    minWidth: columnWidth(key),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const rowsPerPage = 5;

  // Reset internal page when sales change (server-side mode page changes)
  useEffect(() => {
    if (!serverSidePagination) setCurrentPage(1);
  }, [sales, serverSidePagination]);

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TEMPORARY':
        return 'bg-red-600 text-white border-red-700';
      case 'Processing':
        return 'bg-blue-500 text-white border-blue-600';
      case 'Collected At Sorting Center':
        return 'bg-blue-500 text-white border-blue-600';
      case 'Collected from Warehouse':
        return 'bg-pink-500 text-white border-pink-600';
      case 'Dispatched To Destination':
        return 'bg-blue-800 text-white border-yellow-900';
      case 'Received At Destination':
        return 'bg-yellow-400 text-white border-yellow-500';
      case 'Out For Delivery':
        return 'bg-gray-300 text-white border-gray-400';
      case 'PENDING':
        return 'bg-orange-200 text-yellow-800 border-orange-300';
      case 'Failed To Deliver':
        return 'bg-red-500 text-white border-red-400';
      case 'Returned to Client':
        return 'bg-red-500 text-white border-red-400';
      case 'Delivered':
        return 'bg-green-600 text-white border-green-600';
      default:
        return 'bg-gray-100 text-white border-gray-200';
    }
  };

  const getTotalAmount = (items: SaleItem[]) => {
    return items.reduce((sum, item) => sum + item.qty * item.price, 0);
  };

  // Filter sales based on search term (skip when server-side mode)
  const filteredSales = serverSidePagination
    ? sales
    : sales.filter((sale) => {
        if (!searchTerm.trim()) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
          sale.serialNo?.toLowerCase().includes(searchLower) ||
          sale.customerName?.toLowerCase().includes(searchLower) ||
          sale.waybillId?.toLowerCase().includes(searchLower) ||
          sale.address?.toLowerCase().includes(searchLower) ||
          sale.contact01?.toLowerCase().includes(searchLower) ||
          sale.contact02?.toLowerCase().includes(searchLower)
        );
      });

  // Pagination logic (skip when server-side pagination provided)
  const sortedSales = serverSidePagination
    ? filteredSales
    : [...filteredSales].sort((a, b) => {
        const aId = isNaN(Number(a.id)) ? a.id : Number(a.id);
        const bId = isNaN(Number(b.id)) ? b.id : Number(b.id);
        if (aId < bId) return 1;
        if (aId > bId) return -1;
        return 0;
      });

  const totalPages = serverSidePagination
    ? serverSidePagination.totalPages
    : Math.ceil(sortedSales.length / rowsPerPage);
  const paginatedSales = serverSidePagination
    ? sortedSales
    : sortedSales.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const handlePrev = () => {
    if (serverSidePagination) {
      serverSidePagination.onPageChange(Math.max(0, serverSidePagination.page - 1));
    } else {
      setCurrentPage((p) => Math.max(1, p - 1));
    }
  };
  const handleNext = () => {
    if (serverSidePagination) {
      serverSidePagination.onPageChange(
        Math.min(serverSidePagination.totalPages - 1, serverSidePagination.page + 1),
      );
    } else {
      setCurrentPage((p) => Math.min(totalPages, p + 1));
    }
  };
  // Displayed page number (1-based)
  const displayPage = serverSidePagination ? serverSidePagination.page + 1 : currentPage;
  const isFirstPage = serverSidePagination ? serverSidePagination.page === 0 : currentPage === 1;
  const isLastPage = serverSidePagination
    ? serverSidePagination.page >= serverSidePagination.totalPages - 1
    : currentPage === totalPages;

  // Show skeleton loader when data is loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Sales Entries</h2>
            <p className="text-blue-100 text-sm mt-1">Loading...</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white bg-opacity-10 flex items-center justify-center">
              <Spinner size={20} colorClass="text-white" />
            </div>
          </div>
        </div>

        <div className="p-8 flex flex-col items-center justify-center">
          <Spinner size={48} colorClass="text-blue-600 mb-4" />
          <div className="text-gray-600 text-lg">Loading sales data...</div>
        </div>
      </div>
    );
  }

  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <PackageIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Sales Entries</h2>
        <p className="text-gray-500 text-base">
          No sales entries yet. Add a new sale to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Sales Entries</h2>
              <p className="text-blue-100 text-sm mt-1">
                {serverSidePagination
                  ? `${serverSidePagination.totalElements} total records`
                  : `${filteredSales.length} of ${sales.length} entries`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onRefresh && onRefresh()}
                title="Refresh"
                className="p-2 bg-white bg-opacity-10 hover:bg-opacity-20 rounded text-white"
              >
                <RefreshCwIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Search Input — hidden in server-side pagination mode */}
          {!hideSearch && !serverSidePagination && (
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-white text-opacity-70" />
              <input
                type="text"
                placeholder="Search by customer, serial, waybill, address, or contact..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-10 py-2 bg-white bg-opacity-10 text-white placeholder-gray-100 rounded-lg border border-white border-opacity-20 focus:outline-none focus:bg-opacity-20 focus:border-opacity-40"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-3 text-white text-opacity-70 hover:text-opacity-100"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* No Results Message */}
      {filteredSales.length === 0 ? (
        <div className="p-8 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <PackageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'No results found for your search' : 'No sales entries found'}
          </p>
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
              }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="inline-block min-w-full">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th
                      className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
                      style={widthStyle('serial')}
                    >
                      Serial
                      <div
                        className="absolute top-0 right-0 h-full w-1 -mr-0.5 cursor-col-resize"
                        onMouseDown={(event) => startColumnResize('serial', event)}
                        role="presentation"
                      />
                    </th>
                    <th
                      className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
                      style={widthStyle('customer')}
                    >
                      Customer
                      <div
                        className="absolute top-0 right-0 h-full w-1 -mr-0.5 cursor-col-resize"
                        onMouseDown={(event) => startColumnResize('customer', event)}
                        role="presentation"
                      />
                    </th>
                    <th
                      className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
                      style={widthStyle('waybill')}
                    >
                      Waybill Id
                      <div
                        className="absolute top-0 right-0 h-full w-1 -mr-0.5 cursor-col-resize"
                        onMouseDown={(event) => startColumnResize('waybill', event)}
                        role="presentation"
                      />
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
                      style={widthStyle('orderDate')}
                    >
                      Order Date
                      <div
                        className="absolute top-0 right-0 h-full w-1 -mr-0.5 cursor-col-resize"
                        onMouseDown={(event) => startColumnResize('orderDate', event)}
                        role="presentation"
                      />
                    </th>
                    <th
                      className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
                      style={widthStyle('address')}
                    >
                      Address
                      <div
                        className="absolute top-0 right-0 h-full w-1 -mr-0.5 cursor-col-resize"
                        onMouseDown={(event) => startColumnResize('address', event)}
                        role="presentation"
                      />
                    </th>
                    <th
                      className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
                      style={widthStyle('contact1')}
                    >
                      Contact 1
                      <div
                        className="absolute top-0 right-0 h-full w-1 -mr-0.5 cursor-col-resize"
                        onMouseDown={(event) => startColumnResize('contact1', event)}
                        role="presentation"
                      />
                    </th>
                    <th
                      className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
                      style={widthStyle('contact2')}
                    >
                      Contact 2
                      <div
                        className="absolute top-0 right-0 h-full w-1 -mr-0.5 cursor-col-resize"
                        onMouseDown={(event) => startColumnResize('contact2', event)}
                        role="presentation"
                      />
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
                      style={widthStyle('status')}
                    >
                      Status
                      <div
                        className="absolute top-0 right-0 h-full w-1 -mr-0.5 cursor-col-resize"
                        onMouseDown={(event) => startColumnResize('status', event)}
                        role="presentation"
                      />
                    </th>
                    <th
                      className="pl-12 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
                      style={widthStyle('qty')}
                    >
                      Qty
                      <div
                        className="absolute top-0 right-0 h-full w-1 -mr-0.5 cursor-col-resize"
                        onMouseDown={(event) => startColumnResize('qty', event)}
                        role="presentation"
                      />
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
                      style={widthStyle('products')}
                    >
                      Products
                      <div
                        className="absolute top-0 right-0 h-full w-1 -mr-0.5 cursor-col-resize"
                        onMouseDown={(event) => startColumnResize('products', event)}
                        role="presentation"
                      />
                    </th>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
                      style={widthStyle('total')}
                    >
                      Total Amount
                      <div
                        className="absolute top-0 right-0 h-full w-1 -mr-0.5 cursor-col-resize"
                        onMouseDown={(event) => startColumnResize('total', event)}
                        role="presentation"
                      />
                    </th>
                    <th
                      className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
                      style={widthStyle('actions')}
                    >
                      Actions
                      <div
                        className="absolute top-0 right-0 h-full w-1 -mr-0.5 cursor-col-resize"
                        onMouseDown={(event) => startColumnResize('actions', event)}
                        role="presentation"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td
                        className="px-2 py-4 whitespace-nowrap text-sm text-gray-700"
                        style={widthStyle('serial')}
                      >
                        {sale.serialNo}
                      </td>
                      <td className="py-4 whitespace-nowrap" style={widthStyle('customer')}>
                        <div className="font-medium text-gray-900">{sale.customerName}</div>
                      </td>
                      <td
                        className="px-4 py-4 whitespace-nowrap text-sm text-gray-600"
                        style={widthStyle('waybill')}
                      >
                        {sale.waybillId ?? '-'}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                        style={widthStyle('orderDate')}
                      >
                        {formatDate(sale.date)}
                      </td>
                      <td className="px-6 py-4" style={widthStyle('address')}>
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {sale.address}
                        </div>
                      </td>
                      <td
                        className="px-4 py-4 whitespace-nowrap text-sm text-gray-600"
                        style={widthStyle('contact1')}
                      >
                        {sale.contact01}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                        style={widthStyle('contact2')}
                      >
                        {sale.contact02 || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap" style={widthStyle('status')}>
                        {onStatusChange && sale.status === 'TEMPORARY' ? (
                          <select
                            className={`px-2 py-1 rounded-full text-xs font-medium border focus:outline-none ${getStatusColor(
                              sale.status ?? '-',
                            )}`}
                            value={sale.status}
                            onChange={(e) => onStatusChange(sale.id, e.target.value)}
                          >
                            {statusOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              sale.status ?? '-',
                            )}`}
                          >
                            {sale.status ?? '-'}
                          </span>
                        )}
                      </td>
                      <td
                        className="pl-12 py-4 whitespace-nowrap text-sm text-gray-600"
                        style={widthStyle('qty')}
                      >
                        {sale.qty}
                      </td>
                      <td className="px-6 py-4" style={widthStyle('products')}>
                        <div className="max-w-xs">
                          {sale.items && sale.items.length > 0 ? (
                            <div className="space-y-1">
                              {sale.items.slice(0, 2).map((item, index) => (
                                <div
                                  key={item.productId + '-' + index}
                                  className="text-xs text-gray-600"
                                >
                                  {item.productName} (x{item.qty})
                                </div>
                              ))}
                              {sale.items.length > 2 && (
                                <div className="text-xs text-blue-600">
                                  +{sale.items.length - 2} more items
                                </div>
                              )}
                              <div className="text-xs font-medium text-blue-600 mt-1">
                                Total: {sale.items.reduce((sum, item) => sum + item.qty, 0)} items
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">No products</span>
                          )}
                        </div>
                      </td>
                      <td className="px-1 py-4 whitespace-nowrap" style={widthStyle('total')}>
                        <div className="text-lg font-semibold text-green-600">
                          LKR {sale.totalPrice ? sale.totalPrice.toFixed(2) : '0.00'}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-right"
                        style={widthStyle('actions')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEdit(sale)}
                            className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-all duration-200"
                            title="Edit Sale"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPendingDeleteId(sale.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete Sale"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            <div className="p-4 space-y-4">
              {paginatedSales.map((sale) => {
                const isExpanded = expandedRows.has(sale.id);
                return (
                  <div
                    key={sale.id}
                    className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {sale.name}
                            </h3>
                            <div className="text-xs text-gray-500 ml-3">{sale.serialNo}</div>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPinIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <p className="text-sm text-gray-600 truncate">{sale.address}</p>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <PhoneIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="text-sm text-gray-600">
                              {sale.contact01}
                              {sale.contact02 && <span className="ml-2">• {sale.contact02}</span>}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Order Date: {formatDate(sale.date)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Waybill Id: {sale.waybillId ?? '-'}
                          </div>
                        </div>
                        <div className="ml-3 flex items-center gap-2">
                          {onStatusChange && sale.status === 'TEMPORARY' ? (
                            <select
                              className={`px-2 py-1 rounded-full text-xs font-medium border focus:outline-none ${getStatusColor(
                                sale.status ?? '-',
                              )}`}
                              value={sale.status}
                              onChange={(e) => onStatusChange(sale.id, e.target.value)}
                            >
                              {statusOptions.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                sale.status ?? '-',
                              )}`}
                            >
                              {sale.status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Info Row */}
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-green-600">
                          LKR {sale.totalPrice ? sale.totalPrice.toFixed(2) : '0.00'}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleRowExpansion(sale.id)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-all duration-200"
                          >
                            {isExpanded ? (
                              <ChevronUpIcon className="w-4 h-4" />
                            ) : (
                              <ChevronDownIcon className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEdit(sale)}
                            className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded-lg transition-all duration-200"
                            title="Edit Sale"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setPendingDeleteId(sale.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete Sale"
                          >
                            <Trash2Icon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-white p-4 space-y-4">
                        {/* Contact Information */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4" />
                            Contact Information
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">WhatsApp:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {sale.contact01}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Contact 2:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {sale.contact02 || '-'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Quantity:</span>
                              <span className="text-sm font-medium text-gray-900">{sale.qty}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Waybill Id:</span>
                              <span className="text-sm font-medium text-gray-900">
                                {sale.waybillId ?? '-'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Products Information */}
                        {sale.items && sale.items.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <PackageIcon className="w-4 h-4" />
                              Products ({sale.items.length} items)
                            </h4>
                            <div className="space-y-2">
                              {sale.items.map((item, index) => (
                                <div
                                  key={item.productId + '-' + index}
                                  className="flex justify-between items-center p-2 bg-gray-50 rounded"
                                >
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.productName}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      LKR {item.price} each
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900">
                                      x{item.qty}
                                    </div>
                                    <div className="text-xs text-green-600">
                                      LKR {(item.qty * item.price).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <div className="pt-2 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-semibold text-gray-700">
                                    Total Items:
                                  </span>
                                  <span className="text-sm font-semibold text-blue-600">
                                    {sale.items.reduce((sum, item) => sum + item.qty, 0)} items
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {(serverSidePagination
        ? serverSidePagination.totalElements > 0
        : filteredSales.length > 0) && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-600 text-center sm:text-left">
              {serverSidePagination ? (
                <>
                  Showing page <span className="font-medium">{serverSidePagination.page + 1}</span>{' '}
                  of <span className="font-medium">{serverSidePagination.totalPages}</span>
                  {' — '}
                  <span className="font-medium">{serverSidePagination.totalElements}</span> records
                  found
                  {serverSidePagination.sizeOptions && (
                    <select
                      value={serverSidePagination.size}
                      onChange={(e) => serverSidePagination.onSizeChange(Number(e.target.value))}
                      className="ml-3 border border-gray-300 rounded px-2 py-0.5 text-sm bg-white"
                    >
                      {serverSidePagination.sizeOptions.map((s) => (
                        <option key={s} value={s}>
                          {s} / page
                        </option>
                      ))}
                    </select>
                  )}
                </>
              ) : (
                <>
                  Showing <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * rowsPerPage, filteredSales.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredSales.length}</span> entries
                  {searchTerm && (
                    <span className="text-gray-500"> (filtered from {sales.length} total)</span>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handlePrev}
                disabled={isFirstPage}
                className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 ${
                  isFirstPage
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400'
                }`}
              >
                Previous
              </button>

              <div className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
                Page {displayPage} of {totalPages}
              </div>

              <button
                onClick={handleNext}
                disabled={isLastPage}
                className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 ${
                  isLastPage
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ConfirmDialog for admin delete */}
      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete Sale"
        message="Are you sure you want to delete this sale record? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (pendingDeleteId) onDelete(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />

      {/* Block dialog for non-admins */}
      <ConfirmDialog
        open={showBlockDialog}
        title="Permission Denied"
        message="You do not have permission to delete this record."
        confirmLabel="OK"
        hideCancel={true}
        onConfirm={() => setShowBlockDialog(false)}
        onCancel={() => setShowBlockDialog(false)}
      />

      {/* View Modal */}
      <SalesViewModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
    </div>
  );
};
