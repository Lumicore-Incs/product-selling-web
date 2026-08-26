import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { SalesForm } from '../components/SalesForm';
import { SalesTable } from '../components/SalesTable';
import { Sale as TableSale } from '../models/sales';

import { getCurrentUser } from '../service/auth';
import { dashboardApi } from '../services/api';
import { orderService } from '../services/orders/orderService';

type Sale = TableSale;

interface OutletContext {
  salesTitle: string;
  salesBackgroundColor: string;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

export const SalesManagement: React.FC = () => {
  const { salesTitle } = useOutletContext<OutletContext>();
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
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(0);
    }, 400);
  };

  // Load existing orders from backend on component mount
  useEffect(() => {
    loadOrders();
  }, []);

  // Reload orders when page, pageSize, or search changes
  useEffect(() => {
    if (page >= 0) {
      loadOrders();
    }
  }, [page, pageSize, debouncedSearch]);

  // Load user data for role-based permissions
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
      // Load orders using pagination from orderService with search filter
      console.log(
        `Calling orderService.getAllCustomerOrdersPaginated(page=${page}, size=${pageSize}, search=${debouncedSearch})...`,
      );
      const result = await orderService.getAllCustomerOrdersPaginated(page, pageSize, {
        search: debouncedSearch,
      });

      // Check if response exists
      if (!result) {
        console.error('Invalid response format:', result);
        throw new Error('Invalid data format received from server');
      }

      // Update pagination state
      setTotal(result.total);
      setTotalPages(result.totalPages);

      const canonicalSales = result.data as Sale[];
      setSales(canonicalSales);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      console.error('Error stack:', error.stack);

      let errorMessage = 'Failed to load orders. ';

      if (error.response?.status === 404) {
        errorMessage +=
          'Endpoint not found. Please check if your backend server is running and the endpoint exists.';
      } else if (error.response?.status === 401) {
        errorMessage += 'Authentication failed. Please login again.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }

      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, type: 'error' });
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addSale = () => {
    // Reset to first page when adding a new sale
    setPage(0);
    loadOrders();
  };

  const updateSale = async (updatedSale: Sale) => {
    const prev = sales;
    setSales((s) => s.map((sale) => (sale.id === updatedSale.id ? updatedSale : sale)));
    setCurrentSale(null);
    setIsEditing(false);
    setIsLoading(true);

    try {
      // use the duplicate-specific update endpoint implemented in orderService
      await orderService.updateDuplicateOrder(updatedSale.id, updatedSale as unknown);
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
      // Refresh the full list from server to keep data consistent
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

  const exportSales = async (exportType: string) => {
    setError(null);
    try {
      let endpoint = '';
      switch (exportType) {
        case 'sugar':
          endpoint = '/dashboard/excel/sug';
          break;
        case 'vac':
          endpoint = '/dashboard/excel/vac';
          break;
        case 'others':
          endpoint = '/dashboard/excel/others';
          break;
        default:
          endpoint = '/dashboard/excel/sug';
      }

      // Call the API with the specific endpoint
      const blob = await dashboardApi.exportSalesExcel(endpoint);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);

      setSnackbar({
        open: true,
        message: `Exported ${exportType} data successfully`,
        type: 'success',
      });
    } catch (error: any) {
      const errorMessage = `Failed to export ${exportType} data. ${error?.message || ''}`;
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, type: 'error' });
    } finally {
      setShowExportPopup(false);
    }
  };

  const refreshData = () => {
    loadOrders();
  };

  if (isLoading && sales.length === 0) {
    return (
      <div className="max-w-7xl ">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
    w-full
    max-w-full
    sm:max-w-full
    md:max-w-7xl
    lg:max-w-screen-2xl
    mx-auto
    px-3
    sm:px-4
    md:px-6
    relative
    overflow-x-hidden
  "
    >
      <BackgroundIcons type="sales" />
      <AlertSnackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
      {showExportPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg relative max-w-sm w-full">
            <button
              onClick={() => setShowExportPopup(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
            <h3 className="text-lg sm:text-xl font-semibold mb-4">Export Item</h3>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setShowExportPopup(false);
                  exportSales('sugar');
                }}
                className="flex-1 px-3 sm:px-4 py-2 bg-pink-500 text-white text-sm sm:text-base rounded-md hover:bg-pink-600 transition-colors"
              >
                Sugar End
              </button>
              <button
                onClick={() => {
                  setShowExportPopup(false);
                  exportSales('vac');
                }}
                className="flex-1 px-3 sm:px-4 py-2 bg-green-600 text-white text-sm sm:text-base rounded-md hover:bg-green-700 transition-colors"
              >
                Vac
              </button>
              <button
                onClick={() => {
                  setShowExportPopup(false);
                  exportSales('others');
                }}
                className="flex-1 px-3 sm:px-4 py-2 bg-yellow-600 text-white text-sm sm:text-base rounded-md hover:bg-yellow-700 transition-colors"
              >
                Others
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="mb-4 sm:mb-6 px-1">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-[28px] sm:text-[32px] font-bold text-[#115E59] font-['Plus_Jakarta_Sans',sans-serif] tracking-tight leading-tight">
              {salesTitle}
            </h1>
            <p className="text-[#475569] mt-0.5 text-[13px] sm:text-[14px] font-medium font-['Inter',sans-serif]">
              Create new custom order
            </p>
          </div>
        </div>
      </header>

      {error && <></>}

      <div className="space-y-8">
        <div>
          <SalesForm
            onSave={addSale}
            onUpdate={updateSale}
            currentSale={currentSale}
            isEditing={isEditing}
            onCancelEdit={() => {
              setCurrentSale(null);
              setIsEditing(false);
            }}
          />
        </div>
        <div>
          <SalesTable
            sales={sales}
            onEdit={editSale}
            onDelete={deleteSale}
            isLoading={isLoading}
            userRole={user?.role}
            onRefresh={refreshData}
            searchTerm={search}
            onSearchChange={handleSearchChange}
            onStatusChange={async (saleId, newStatus) => {
              const sale = sales.find((s) => s.id === saleId);
              if (!sale) return;
              const updatedSale = { ...sale, status: newStatus };
              await updateSale(updatedSale);
            }}
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
