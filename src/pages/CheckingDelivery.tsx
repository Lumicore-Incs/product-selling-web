import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Upload,
  Send,
  X,
  RefreshCcw,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
} from 'lucide-react';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { SalesTable } from '../components/SalesTable';
import { SalesForm } from '../components/SalesForm';
import { Sale } from '../models/sales';
import { getCurrentUser } from '../service/auth';
import { orderService, uploadTracking } from '../services/orders/orderService';
import { parseTrackingExcel, TrackingRow } from '../utils/excelUtils';

export const CheckingDelivery: React.FC = () => {
  const navigate = useNavigate();

  // Excel Upload state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelRows, setExcelRows] = useState<TrackingRow[]>([]);
  const [isExcelParsing, setIsExcelParsing] = useState(false);
  const [isExcelSubmitting, setIsExcelSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sales / Orders state
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ role: string } | null>(null);

  // Notification snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ open: false, message: '', type: 'error' });

  // Pagination & Filtering state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ff = "'Plus Jakarta Sans', sans-serif";

  const statusOptions = [
    { value: 'all', label: 'ALL STATUS' },
    { value: 'Dispatched to Destination', label: 'DISPATCHED TO DESTINATION' },
    { value: 'Out for Delivery', label: 'OUT FOR DELIVERY' },
    { value: 'Delivered', label: 'DELIVERED' },
    { value: 'Received at Destination', label: 'RECEIVED AT DESTINATION' },
    { value: 'Received by Client', label: 'RECEIVED BY CLIENT' },
    { value: 'Returned to Branch Rescheduled', label: 'RETURNED TO BRANCH RESCHEDULED' },
    { value: 'Returned to Branch Failed', label: 'RETURNED TO BRANCH FAILED' },
    { value: 'Returned to Branch', label: 'RETURNED TO BRANCH' },
    { value: 'Rescheduled', label: 'RESCHEDULED' },
    { value: 'Collected from Warehouse', label: 'COLLECTED FROM WAREHOUSE' },
    { value: 'Returned to HO', label: 'RETURNED TO HO' },
    { value: 'Failed to Deliver', label: 'FAILED TO DELIVER' },
    { value: 'Returned to Client', label: 'RETURNED TO CLIENT' },
    { value: 'Processing', label: 'PROCESSING' },
    { value: 'PENDING', label: 'PENDING' },
    { value: 'TEMPORARY', label: 'DUPLICATE' },
  ];

  // Check user role: Admin or Super Admin only
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        const normalized = (userData?.role || '').toUpperCase();
        const isSuperUser =
          normalized === 'SUPER USER' ||
          normalized === 'SUPER_USER' ||
          normalized === 'SUPERUSER';
        const isAdmin = normalized === 'ADMIN';

        if (!userData || (!isSuperUser && !isAdmin)) {
          navigate('/', { replace: true });
          return;
        }

        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        navigate('/', { replace: true });
      }
    };
    fetchUser();
  }, [navigate]);

  // Load orders when filters / page change
  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [page, pageSize, debouncedSearch, statusFilter, showTodayOnly, dateFilter, user]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 400);
  };

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters = {
        search: debouncedSearch,
        status: statusFilter === 'all' ? undefined : statusFilter,
        date: dateFilter ? dateFilter : undefined,
      };

      const result = await (showTodayOnly
        ? orderService.getOrdersPaginated(page, pageSize, filters)
        : orderService.getAllCustomerOrdersPaginated(page, pageSize, filters));

      if (!result) {
        throw new Error('Invalid data format received from server');
      }

      setTotal(result.total);
      setTotalPages(result.totalPages);
      setSales(result.data as Sale[]);
    } catch (error: any) {
      console.error('Error loading orders in Checking Delivery:', error);
      let errorMessage = 'Failed to load delivery orders. ';
      if (error.response?.status === 404) {
        errorMessage += 'Endpoint not found.';
      } else if (error.response?.status === 401) {
        errorMessage += 'Authentication failed. Please login again.';
      } else if (error.message) {
        errorMessage += error.message;
      }
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, type: 'error' });
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Excel Upload Handler
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '.xlsx',
      '.xls',
    ];

    if (!allowedTypes.some((type) => file.type === type || file.name.endsWith(type))) {
      setSnackbar({
        open: true,
        message: 'Please select a valid Excel file (.xlsx or .xls)',
        type: 'error',
      });
      return;
    }

    setExcelFile(file);
    setIsExcelParsing(true);
    try {
      const data = await parseTrackingExcel(file);
      setExcelRows(data);
      setSnackbar({
        open: true,
        message: `Excel file loaded successfully! ${data.length} records ready to submit.`,
        type: 'success',
      });
    } catch (err) {
      console.error('Failed to parse Excel:', err);
      setSnackbar({
        open: true,
        message: 'Failed to parse Excel file. Please ensure columns match the template.',
        type: 'error',
      });
      handleClearExcel();
    } finally {
      setIsExcelParsing(false);
    }
  };

  // 🔹 Clear Excel Handler
  const handleClearExcel = () => {
    setExcelFile(null);
    setExcelRows([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 🔹 Excel Submit Handler
  const handleSubmitExcel = async () => {
    if (excelRows.length === 0) {
      setSnackbar({ open: true, message: 'No Excel records to submit', type: 'error' });
      return;
    }

    setIsExcelSubmitting(true);
    try {
      const trackingData = excelRows.map((row) => ({
        wayBillNo: row.waybillId,
        orderId: row.orderId,
        customerName: row.customerName,
        contact: row.phoneNumber,
      }));

      await uploadTracking(trackingData);
      setSnackbar({
        open: true,
        message: `Successfully submitted ${trackingData.length} tracking records!`,
        type: 'success',
      });

      handleClearExcel();
      // Reload the orders table to show newly updated tracking info
      await loadOrders();
    } catch (error) {
      console.error('Failed to upload tracking data:', error);
      setSnackbar({ open: true, message: 'Failed to upload tracking data', type: 'error' });
    } finally {
      setIsExcelSubmitting(false);
    }
  };

  // 🔹 Update Tracking Status API Call
  const handleUpdateTrackingStatus = async () => {
    try {
      setIsUpdatingTracking(true);
      await orderService.updateTrackingStatus();
      setSnackbar({
        open: true,
        message: 'Tracking status update initiated successfully!',
        type: 'success',
      });
      await loadOrders();
    } catch (err: unknown) {
      const message = (err as Error)?.message || 'Failed to update tracking status';
      setSnackbar({ open: true, message, type: 'error' });
      console.error('Update tracking failed:', err);
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  // 🔹 Order Edit / Update / Delete handlers
  const updateSale = async (updatedSale: Sale) => {
    const prev = sales;
    setSales((s) => s.map((sale) => (sale.id === updatedSale.id ? updatedSale : sale)));
    setCurrentSale(null);
    setIsEditing(false);
    setIsLoading(true);

    try {
      await orderService.updateDuplicateOrder(updatedSale.id, updatedSale as any);
      setSnackbar({ open: true, message: 'Order updated successfully', type: 'success' });
      await loadOrders();
    } catch (err: unknown) {
      setSales(prev);
      const message = (err as Error)?.message || 'Failed to update order';
      setSnackbar({ open: true, message, type: 'error' });
      console.error('Update order failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSale = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await orderService.deleteOrder(id);
      setSnackbar({ open: true, message: 'Order deleted successfully', type: 'success' });
      await loadOrders();
    } catch (err: unknown) {
      const message = (err as Error)?.message || 'Failed to delete order';
      setSnackbar({ open: true, message, type: 'error' });
      console.error('Delete order failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const editSale = (sale: Sale) => {
    setCurrentSale(sale);
    setIsEditing(true);
  };

  const refreshData = () => {
    loadOrders();
  };

  // Status counts for quick dashboard metrics
  const deliveredCount = sales.filter((s) => s.status?.toLowerCase() === 'delivered').length;
  const outForDeliveryCount = sales.filter((s) => s.status?.toLowerCase() === 'out for delivery').length;
  const returnedCount = sales.filter(
    (s) => s.status?.toLowerCase().includes('return') || s.status?.toLowerCase().includes('fail')
  ).length;

  return (
    <div className="w-full max-w-full relative overflow-x-hidden">
      <BackgroundIcons type="sales" />
      <AlertSnackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />

      {/* 🔹 Header Section */}
      <header className="mb-6 pt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#0B818D]/10 flex items-center justify-center text-[#0B818D] shadow-sm">
                <Truck size={24} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Checking Delivery</h1>
                <p className="text-gray-600 mt-0.5 text-sm sm:text-base">
                  Upload Excel tracking details, verify orders, and manage deliveries
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={handleUpdateTrackingStatus}
              disabled={isUpdatingTracking || isLoading}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all shadow-sm ${
                isUpdatingTracking
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-[#0B818D] hover:bg-[#096d77]'
              }`}
            >
              <RefreshCcw size={16} className={isUpdatingTracking ? 'animate-spin' : ''} />
              {isUpdatingTracking ? 'Updating Tracking...' : 'Update Tracking Status'}
            </button>

            <button
              onClick={refreshData}
              disabled={isLoading}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-white text-sm font-medium transition-colors ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* 🔹 Excel Upload & Submit Card (User requirement) */}
        <div
          className="mt-6 p-4 sm:p-5 rounded-2xl border border-white/80 shadow-md backdrop-blur-md"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(243,248,250,0.9) 100%)',
          }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-600 flex-shrink-0">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800">Excel Tracking Upload</h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  Select an Excel file (.xlsx, .xls) containing tracking IDs and waybills to submit
                </p>
              </div>
            </div>

            {/* Upload & Submit Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleExcelFileChange}
                ref={fileInputRef}
                disabled={isExcelParsing || isExcelSubmitting}
              />

              {/* Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExcelParsing || isExcelSubmitting}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
                  isExcelParsing
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-[#0B818D] text-white hover:bg-[#096d77]'
                }`}
              >
                <Upload size={16} className={isExcelParsing ? 'animate-bounce' : ''} />
                {isExcelParsing ? 'Reading Excel...' : excelFile ? 'Change Excel File' : 'Upload Excel'}
              </button>

              {/* Submit Excel Button */}
              <button
                type="button"
                onClick={handleSubmitExcel}
                disabled={excelRows.length === 0 || isExcelSubmitting || isExcelParsing}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
                  excelRows.length > 0 && !isExcelSubmitting
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Send size={16} className={isExcelSubmitting ? 'animate-spin' : ''} />
                {isExcelSubmitting ? 'Submitting...' : 'Submit Excel'}
              </button>

              {/* Clear button if file chosen */}
              {excelFile && (
                <button
                  type="button"
                  onClick={handleClearExcel}
                  disabled={isExcelSubmitting}
                  className="p-2.5 rounded-xl bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                  title="Clear file"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Uploaded File Info Preview Badge */}
          {excelFile && (
            <div className="mt-3 pt-3 border-t border-gray-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-gray-700">
                <Check size={14} className="text-emerald-600 font-bold" />
                <span className="font-semibold text-gray-800">{excelFile.name}</span>
                <span className="text-gray-400">({(excelFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                {excelRows.length} {excelRows.length === 1 ? 'row' : 'rows'} detected and ready
              </div>
            </div>
          )}
        </div>

        {/* 🔹 Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-white/60 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Total Orders</span>
              <Clock size={16} className="text-[#0B818D]" />
            </div>
            <p className="text-xl font-bold text-gray-800 mt-1">{total}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-white/60 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Delivered (Page)</span>
              <CheckCircle2 size={16} className="text-green-500" />
            </div>
            <p className="text-xl font-bold text-green-600 mt-1">{deliveredCount}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-white/60 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Out for Delivery</span>
              <Truck size={16} className="text-blue-500" />
            </div>
            <p className="text-xl font-bold text-blue-600 mt-1">{outForDeliveryCount}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-white/60 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">Returned / Failed</span>
              <AlertTriangle size={16} className="text-rose-500" />
            </div>
            <p className="text-xl font-bold text-rose-600 mt-1">{returnedCount}</p>
          </div>
        </div>

        {/* 🔹 Filters & Search Toolbar (Right above the Sales Table) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mt-5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search name, contact, waybill"
              className="text-sm focus:outline-none focus:ring-2 focus:ring-teal-300/50 transition-all"
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(0,0,0,0.09)',
                borderRadius: '12px',
                padding: '7px 14px',
                width: '220px',
                fontFamily: ff,
              }}
            />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="text-sm focus:outline-none focus:ring-2 focus:ring-teal-300/50"
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(0,0,0,0.09)',
                borderRadius: '12px',
                padding: '7px 12px',
                fontFamily: ff,
                color: '#374151',
              }}
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Date filter */}
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setPage(0);
                }}
                className="text-sm focus:outline-none focus:ring-2 focus:ring-teal-300/50"
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(0,0,0,0.09)',
                  borderRadius: '12px',
                  padding: '5px 12px',
                  fontFamily: ff,
                  color: '#374151',
                }}
              />
              {dateFilter && (
                <button
                  onClick={() => {
                    setDateFilter('');
                    setPage(0);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-medium px-1"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Today / All toggle */}
            <div
              className="flex p-1 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(0,0,0,0.09)',
              }}
            >
              {['All', 'Today'].map((lbl) => {
                const isToday = lbl === 'Today';
                const active = showTodayOnly === isToday;
                return (
                  <button
                    key={lbl}
                    onClick={() => {
                      setShowTodayOnly(isToday);
                      setPage(0);
                    }}
                    className="px-3 py-1 rounded-lg text-sm font-semibold transition-all duration-200"
                    style={{
                      fontFamily: ff,
                      background: active
                        ? 'linear-gradient(135deg, #0d9488, #0891b2)'
                        : 'transparent',
                      color: active ? '#fff' : '#6b7280',
                    }}
                  >
                    {lbl}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {error && <></>}

      {/* 🔹 Sales Table & Edit Form Section */}
      <div className="space-y-6">
        {isEditing && currentSale && (
          <div>
            <SalesForm
              onSave={refreshData}
              onUpdate={updateSale}
              currentSale={currentSale}
              isEditing={isEditing}
              onCancelEdit={() => {
                setCurrentSale(null);
                setIsEditing(false);
              }}
            />
          </div>
        )}

        <div className={isEditing ? 'opacity-50 pointer-events-none p-2' : ''}>
          <SalesTable
            sales={sales}
            onEdit={
              user?.role === 'ADMIN' || user?.role === 'SUPER USER' || user?.role === 'SUPER_USER'
                ? editSale
                : undefined
            }
            onDelete={
              user?.role === 'ADMIN' || user?.role === 'SUPER USER' || user?.role === 'SUPER_USER'
                ? deleteSale
                : undefined
            }
            isLoading={isLoading}
            userRole={user?.role}
            onRefresh={refreshData}
            searchTerm={search}
            onSearchChange={handleSearchChange}
            alwaysEditableStatus={
              user?.role === 'ADMIN' || user?.role === 'SUPER USER' || user?.role === 'SUPER_USER'
            }
            onWaybillChange={
              user?.role === 'ADMIN' || user?.role === 'SUPER USER' || user?.role === 'SUPER_USER'
                ? (saleId, newWaybill) => {
                    setSales((s) =>
                      s.map((sale) => (sale.id === saleId ? { ...sale, waybillId: newWaybill } : sale))
                    );
                  }
                : undefined
            }
            onWaybillSave={
              user?.role === 'ADMIN' || user?.role === 'SUPER USER' || user?.role === 'SUPER_USER'
                ? async (saleId) => {
                    const sale = sales.find((s) => s.id === saleId);
                    if (!sale) return;
                    await updateSale(sale);
                  }
                : undefined
            }
            onStatusChange={
              user?.role === 'ADMIN' || user?.role === 'SUPER USER' || user?.role === 'SUPER_USER'
                ? async (saleId, newStatus) => {
                    const sale = sales.find((s) => s.id === saleId);
                    if (!sale) return;
                    const updatedSale = { ...sale, status: newStatus };
                    await updateSale(updatedSale);
                  }
                : undefined
            }
            serverPagination={{
              page,
              pageSize,
              total,
              totalPages,
              pageSizeOptions: [10, 20, 50],
              onPrev: () => setPage((p) => Math.max(0, p - 1)),
              onNext: () => setPage((p) => Math.min(totalPages - 1, p + 1)),
              onPageSizeChange: (newSize) => {
                setPageSize(newSize);
                setPage(0);
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};
