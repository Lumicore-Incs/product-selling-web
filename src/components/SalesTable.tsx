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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Sale } from '../models/sales';
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

interface SalesTableProps {
  sales: Sale[];
  isLoading?: boolean;
  onEdit?: (sale: Sale) => void;
  onDelete?: (id: string) => void;
  userRole?: string;
  onRefresh?: () => void;
  onStatusChange?: (saleId: string, newStatus: string) => void;
  alwaysEditableStatus?: boolean;
  onWaybillChange?: (saleId: string, newWaybill: string) => void;
  onWaybillSave?: (saleId: string) => void;
  /** Search term value (for controlled input) */
  searchTerm?: string;
  /** Callback when search term changes */
  onSearchChange?: (term: string) => void;
  /** When provided the table uses server-side pagination instead of internal client-side pagination */
  serverPagination?: {
    page: number; // 0-based
    pageSize: number;
    total: number;
    totalPages: number;
    pageSizeOptions: number[];
    onPrev: () => void;
    onNext: () => void;
    onPageSizeChange: (size: number) => void;
  };
}

export const SalesTable: React.FC<SalesTableProps> = ({
  sales,
  isLoading,
  onEdit,
  onDelete,
  onRefresh,
  onStatusChange,
  alwaysEditableStatus,
  onWaybillChange,
  onWaybillSave,
  searchTerm: externalSearchTerm,
  onSearchChange,
  serverPagination,
}) => {
  // Status options
  const statusOptions = alwaysEditableStatus
    ? [
        'TEMPORARY',
        'PENDING',
        'Processing',
        'Collected At Sorting Center',
        'Collected from Warehouse',
        'Dispatched To Destination',
        'Received At Destination',
        'Out For Delivery',
        'Failed To Deliver',
        'Returned to HO',
        'Returned to Branch Rescheduled',
        'Returned to Branch Failed',
        'Returned to Branch',
        'Returned to Client',
        'Delivered',
      ]
    : ['TEMPORARY', 'PENDING'];

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
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const rowsPerPage = 5;

  // Use external search term if provided via props, otherwise use internal state
  const searchTerm = onSearchChange ? externalSearchTerm || '' : internalSearchTerm;

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
        return 'bg-black-500 text-white border-yellow-900';
      case 'Received At Destination':
        return 'bg-yellow-400 text-white border-yellow-500';
      case 'Out For Delivery':
        return 'bg-gray-300 text-black border-gray-400';
      case 'PENDING':
        return 'bg-orange-200 text-yellow-800 border-orange-300';
      case 'Failed To Deliver':
        return 'bg-red-500 text-white border-red-400';
      case 'Returned to HO':
        return 'bg-orange-300 text-white border-red-400';
      case 'Returned to Branch Rescheduled':
        return 'bg-orange-600 text-white border-red-400';
      case 'Returned to Branch Failed':
        return 'bg-red-500 text-white border-red-400';
      case 'Returned to Branch':
        return 'bg-red-300 text-white border-red-400';
      case 'Returned to Client':
        return 'bg-red-500 text-white border-red-400';
      case 'Delivered':
        return 'bg-green-600 text-white border-green-600';
      default:
        return 'bg-gray-100 text-black border-gray-200';
    }
  };



  // Filter sales based on search term (bypassed when server-side pagination is active)
  const filteredSales = serverPagination
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

  // Pagination logic
  const sortedSales = [...filteredSales].sort((a, b) => {
    const aId = isNaN(Number(a.id)) ? a.id : Number(a.id);
    const bId = isNaN(Number(b.id)) ? b.id : Number(b.id);
    if (aId < bId) return 1;
    if (aId > bId) return -1;
    return 0;
  });

  const totalPages = serverPagination
    ? serverPagination.totalPages
    : Math.ceil(sortedSales.length / rowsPerPage);

  const paginatedSales = serverPagination
    ? sortedSales
    : sortedSales.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handlePrev = () => {
    if (serverPagination) {
      serverPagination.onPrev();
    } else {
      setCurrentPage((p) => Math.max(1, p - 1));
    }
  };

  const handleNext = () => {
    if (serverPagination) {
      serverPagination.onNext();
    } else {
      setCurrentPage((p) => Math.min(totalPages, p + 1));
    }
  };

  // Derived display values for pagination footer
  const displayPage = serverPagination ? serverPagination.page + 1 : currentPage;
  const displayFrom = serverPagination
    ? serverPagination.page * serverPagination.pageSize + 1
    : (currentPage - 1) * rowsPerPage + 1;
  const displayTo = serverPagination
    ? Math.min((serverPagination.page + 1) * serverPagination.pageSize, serverPagination.total)
    : Math.min(currentPage * rowsPerPage, filteredSales.length);
  const displayTotal = serverPagination ? serverPagination.total : filteredSales.length;
  const isPrevDisabled = serverPagination ? serverPagination.page === 0 : currentPage === 1;
  const isNextDisabled = serverPagination
    ? serverPagination.page >= serverPagination.totalPages - 1
    : currentPage === totalPages;

  // Show skeleton loader when data is loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden font-inter">
        <div className="bg-gray-50 border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Sales Entries</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Spinner size={20} colorClass="text-gray-600" />
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
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 sm:p-8 text-center font-inter">
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
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden font-inter">
      {/* Header with Search & Refresh */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 sm:p-4" style={{backgroundColor:'#147989', font:'plus-jakarta-sans'}}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Sales Entries</h2>
            <p className="text-gray-100 text-sm mt-1">
              {serverPagination
                ? `${serverPagination.total} entries`
                : `${filteredSales.length} of ${sales.length} entries`}
            </p>
          </div>

          <div className="flex items-center w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-72">
              <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-white" />
              <input
                type="text"
                placeholder="Search by serial, customer, waybill, address..."
                value={searchTerm}
                onChange={(e) => {
                  if (onSearchChange) {
                    onSearchChange(e.target.value);
                  } else {
                    setInternalSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }
                }}
               className="text-sm focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '10px',
                  padding: '6px 12px 6px 30px',
                  color: '#fff',
                  width: '270px',
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    if (onSearchChange) onSearchChange('');
                    else {
                      setInternalSearchTerm('');
                      setCurrentPage(1);
                    }
                  }}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh"
                className="p-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-white hover:text-gray-700 transition-colors"
              >
                <RefreshCwIcon className="w-4 h-4" />
              </button>
            )}
          </div>
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
                if (onSearchChange) onSearchChange('');
                else setInternalSearchTerm('');
                setCurrentPage(1);
              }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-inter"
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
                <thead className="bg-blue-50 border-b border-gray-200">
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
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
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
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
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
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
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
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
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
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
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
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
                      className=" py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
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
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
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
                      className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
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
                <tbody className="divide-y divide-gray-200">
                  {paginatedSales.map((sale, index) => (
                    <tr
                      key={sale.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                        style={widthStyle('serial')}
                      >
                        {sale.serialNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" style={widthStyle('customer')}>
                        <div className="font-medium text-gray-900">{sale.customerName}</div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                        style={widthStyle('waybill')}
                      >
                        {onWaybillChange ? (
                          <input
                            type="text"
                            value={sale.waybillId || ''}
                            onChange={(e) => onWaybillChange(sale.id, e.target.value)}
                            onBlur={() => onWaybillSave && onWaybillSave(sale.id)}
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Waybill..."
                          />
                        ) : (
                          sale.waybillId ?? '-'
                        )}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                        style={widthStyle('orderDate')}
                      >
                        {formatDate(sale.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600" style={widthStyle('address')}>
                        <div className="max-w-xs truncate">{sale.address}</div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
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
                      <td className="py-4 whitespace-nowrap" style={widthStyle('status')}>
                        {onStatusChange && (alwaysEditableStatus || sale.status === 'TEMPORARY') ? (
                          <select
                            className={`py-1 rounded-full text-xs font-medium border focus:outline-none ${getStatusColor(
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
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                        style={widthStyle('qty')}
                      >
                        {sale.qty}
                      </td>
                      <td className="px-6 py-4" style={widthStyle('products')}>
                        <div className="text-sm text-gray-600">
                          {sale.items?.length ? `${sale.items.length} items` : '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" style={widthStyle('total')}>
                        <div className="font-semibold text-green-600">
                          LKR {sale.totalPrice ? sale.totalPrice.toFixed(2) : '0.00'}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-center"
                        style={widthStyle('actions')}
                      >
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-all"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(sale)}
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-all"
                              title="Edit Sale"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => setPendingDeleteId(sale.id)}
                              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                              title="Delete Sale"
                            >
                              <Trash2Icon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View - Updated Style */}
          <div className="lg:hidden">
            <div className="p-4 space-y-4">
              {paginatedSales.map((sale) => {
                const isExpanded = expandedRows.has(sale.id);
                return (
                  <div
                    key={sale.id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {sale.customerName}
                            </h3>
                            <div className="text-xs text-gray-500 ml-3">#{sale.serialNo}</div>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPinIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <p className="text-sm text-gray-600 truncate">{sale.address}</p>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <span>Waybill:</span>
                            {onWaybillChange ? (
                              <input
                                type="text"
                                value={sale.waybillId || ''}
                                onChange={(e) => onWaybillChange(sale.id, e.target.value)}
                                onBlur={() => onWaybillSave && onWaybillSave(sale.id)}
                                className="px-5 py-0.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
                                placeholder="Waybill..."
                              />
                            ) : (
                              <span>{sale.waybillId ?? '-'}</span>
                            )}
                            <span>• {formatDate(sale.date)}</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          {onStatusChange && (alwaysEditableStatus || sale.status === 'TEMPORARY') ? (
                            <select
                              className={`px-3 py-1 rounded-full text-xs font-medium border focus:outline-none ${getStatusColor(
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
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-green-600">
                          LKR {sale.totalPrice ? sale.totalPrice.toFixed(2) : '0.00'}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleRowExpansion(sale.id)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all"
                          >
                            {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-all"
                            title="View Details"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(sale)}
                              className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-all"
                              title="Edit Sale"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => setPendingDeleteId(sale.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                              title="Delete Sale"
                            >
                              <Trash2Icon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4" />
                            Contact Information
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Contact 1:</span>
                              <span className="font-medium text-gray-900">{sale.contact01}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Contact 2:</span>
                              <span className="font-medium text-gray-900">{sale.contact02 || '-'}</span>
                            </div>
                          </div>
                        </div>

                        {sale.items && sale.items.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                              <PackageIcon className="w-4 h-4" />
                              Products ({sale.items.length})
                            </h4>
                            <div className="space-y-2">
                              {sale.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border">
                                  <div className="text-sm font-medium">{item.productName}</div>
                                  <div className="text-right">
                                    <div className="text-sm">x{item.qty}</div>
                                    <div className="text-xs text-green-600">
                                      LKR {(item.price * item.qty).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                              ))}
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
      {displayTotal > 0 && (
        <div className="border-t border-gray-200 bg-white px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{displayFrom}</span> to{' '}
              <span className="font-medium">{displayTo}</span> of{' '}
              <span className="font-medium">{displayTotal}</span> entries
              {!serverPagination && searchTerm && (
                <span className="text-gray-500"> (filtered)</span>
              )}
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handlePrev}
                disabled={isPrevDisabled}
                className={`flex items-center justify-center w-8 h-8 rounded-md border transition-all ${
                  isPrevDisabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300 shadow-sm'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-sm font-medium text-gray-600 px-2">
                {displayPage}
              </div>

              <button
                onClick={handleNext}
                disabled={isNextDisabled}
                className={`flex items-center justify-center w-8 h-8 rounded-md border transition-all ${
                  isNextDisabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300 shadow-sm'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete Sale"
        message="Are you sure you want to delete this sale record? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (pendingDeleteId && onDelete) onDelete(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />

      <ConfirmDialog
        open={showBlockDialog}
        title="Permission Denied"
        message="You do not have permission to delete this record."
        confirmLabel="OK"
        hideCancel={true}
        onConfirm={() => setShowBlockDialog(false)}
        onCancel={() => setShowBlockDialog(false)}
      />

      <SalesViewModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
    </div>
  );
};