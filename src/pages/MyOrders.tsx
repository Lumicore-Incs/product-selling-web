import React, { useEffect, useRef, useState } from 'react';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { SalesTable } from '../components/SalesTable';
import { Sale } from '../models/sales';

import { getCurrentUser } from '../service/auth';
import { orderService } from '../services/orders/orderService';
import { SalesForm } from '../components/SalesForm';

export const MyOrders: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ open: false, message: '', type: 'error' });

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
    { value: 'PENDING', label: 'PENDING' },
    { value: 'TEMPORARY', label: 'DUPLICATE' },
    { value: 'Processing', label: 'PROCESSING' },
    { value: 'Dispatched to Destination', label: 'DISPATCHED TO DESTINATION' },
    { value: 'Received at Destination', label: 'RECEIVED AT DESTINATION' },
    { value: 'Received by Client', label: 'RECEIVED BY CLIENT' },
    { value: 'Out for Delivery', label: 'OUT FOR DELIVERY' },
    { value: 'Returned to Branch Rescheduled', label: 'RETURNED TO BRANCH RESCHEDULED' },
    { value: 'Returned to Branch Failed', label: 'RETURNED TO BRANCH FAILED' },
    { value: 'Returned to Branch', label: 'RETURNED TO BRANCH' },
    { value: 'Rescheduled', label: 'RESCHEDULED' },
    { value: 'Collected from Warehouse', label: 'COLLECTED FROM WAREHOUSE' },
    { value: 'Returned to HO', label: 'RETURNED TO HO' },
    { value: 'Failed to Deliver', label: 'FAILED TO DELIVER' },
    { value: 'Returned to Client', label: 'RETURNED TO CLIENT' },
    { value: 'Delivered', label: 'DELIVERED' },
  ];

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 400);
  };

  useEffect(() => {
    loadOrders();
  }, [page, pageSize, debouncedSearch, statusFilter, showTodayOnly, dateFilter]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setUser(null);
      }
    };
    fetchUser();
  }, []);

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

      const canonicalSales = result.data as Sale[];
      setSales(canonicalSales);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      let errorMessage = 'Failed to load orders. ';
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
      await loadOrders();
      setSnackbar({ open: true, message: 'Order deleted successfully', type: 'success' });
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

  return (
    <div className="w-full max-w-full  relative overflow-x-hidden">
      <BackgroundIcons type="sales" />
      <AlertSnackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
      <header className="mb-6 sm:mb-8 pt-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Orders</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              View and manage your specific orders
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={refreshData}
              disabled={isLoading}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-white text-sm sm:text-base transition-colors ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Sales section top-bar (outside the teal header) */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mt-4"
        >
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
                width: '210px',
                fontFamily: ff,
              }}
            />

            {/* Status */}
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

            {/* Date */}
            <div className="flex items-center gap-2">
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
                  className="text-xs text-red-500 hover:text-red-700"
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

      <div className="space-y-8">
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
