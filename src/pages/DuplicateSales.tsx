import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { SalesForm } from '../components/SalesForm';
import { SalesTable } from '../components/SalesTable';
import { Sale as TableSale } from '../models/sales';
import { getCurrentUser } from '../service/auth';
import { dashboardApi } from '../services/api';
import { orderService } from '../services/orders/orderService';
import { salesService } from '../services/salesService';

// Use the table types so shapes match the SalesTable component
type Sale = TableSale;

interface OutletContext {
  salesTitle: string;
  salesBackgroundColor: string;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

export const DuplicateSales: React.FC = () => {
  const { salesTitle } = useOutletContext<OutletContext>();
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ open: false, message: '', type: 'error' });
  const [showExportPopup, setShowExportPopup] = useState(false);

  // Load existing orders from backend on component mount
  useEffect(() => {
    loadOrders();
  }, []);

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
      // Load all orders from backend via service
      console.log('Calling orderService.getAllDuplicateOrders()...');
      const responseOrder = await orderService.getAllDuplicateOrders();

      // Check if response exists and is an array
      if (!responseOrder || !Array.isArray(responseOrder)) {
        console.error('Invalid response format:', responseOrder);
        throw new Error('Invalid data format received from server');
      }

      console.log('Number of orders received:', responseOrder.length);

      // Debug: Log first order structure if available
      if (responseOrder.length > 0) {
        console.log('First order structure:', responseOrder[0]);
        console.log('First order keys:', Object.keys(responseOrder[0]));
      }

      // orderService returns canonical `Sale[]` (mapping done in the service)
      const canonicalSales = responseOrder as unknown as Sale[];
      console.log('Setting sales state with', canonicalSales.length, 'items');
      setSales(canonicalSales);
    } catch (error: unknown) {
      console.error('Error loading orders:', error);

      const err = error as { message?: string; response?: { status?: number } };

      let errorMessage = 'Failed to load orders. ';

      if (err.response?.status === 404) {
        errorMessage +=
          'Endpoint not found. Please check if your backend server is running and the endpoint exists.';
      } else if (err.response?.status === 401) {
        errorMessage += 'Authentication failed. Please login again.';
      } else if (err.message) {
        errorMessage += err.message;
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
    loadOrders();
  };

  const handleCustomerCreated = () => {
    // Refresh orders after a new customer/order is created
    loadOrders();
  };

  const updateSale = async (updatedSale: Sale) => {
    // Optimistic UI update: update local state immediately
    const prev = sales;
    setSales((s) => s.map((sale) => (sale.id === updatedSale.id ? updatedSale : sale)));
    setCurrentSale(null);
    setIsEditing(false);

    try {
      // Call backend update. salesService will try common endpoints and fall back when needed
      await salesService.updateOrder(updatedSale.customerId ?? '', updatedSale as unknown);
      setSnackbar({ open: true, message: 'Order updated successfully', type: 'success' });
    } catch (err: unknown) {
      // Rollback on failure and show error
      setSales(prev);
      const message = (err as Error)?.message || 'Failed to update order';
      setSnackbar({ open: true, message, type: 'error' });
      console.error('Update order failed:', err);
    }
  };

  const deleteSale = async (id: string) => {
    // For now, just update local state since you don't have delete API endpoint
    setSales(sales.filter((sale) => sale.id !== id));
    if (currentSale?.id === id) {
      setCurrentSale(null);
      setIsEditing(false);
    }

    // TODO: Add API call to delete order when backend supports it
    try {
      // Try service wrapper which will call orderApi.deleteOrder if available
      await orderService.deleteOrder(id);
    } catch (err) {
      // If delete isn't implemented server-side it's fine to silently continue for now
      console.warn('Delete order not performed via API:', err);
    }
  };

  const editSale = (sale: Sale) => {
    setCurrentSale(sale);
    setIsEditing(true);
  };

  const exportSales = async (exportType: string) => {
    setIsExporting(true);
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
    } catch (error: unknown) {
      const err = error as { message?: string };
      const errorMessage = `Failed to export ${exportType} data. ${err?.message || ''}`;
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, type: 'error' });
    } finally {
      setIsExporting(false);
      setShowExportPopup(false);
    }
  };

  const refreshData = () => {
    loadOrders();
  };

  if (isLoading && sales.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto p-6 rounded-lg relative">
      <BackgroundIcons />
      <AlertSnackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
      {showExportPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg relative">
            <button
              onClick={() => setShowExportPopup(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h3 className="text-lg font-semibold mb-4">Export Item</h3>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowExportPopup(false);
                  exportSales('sugar'); // Call your existing export function
                }}
                className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-green-700"
              >
                Sugar End
              </button>
              <button
                onClick={() => {
                  setShowExportPopup(false);
                  exportSales('vac'); // Call your existing export function
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-blue-700"
              >
                Vac
              </button>
              <button
                onClick={() => {
                  setShowExportPopup(false);
                  exportSales('others'); // Call your existing export function
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Others
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{salesTitle}</h1>
            <p className="text-gray-600 mt-2">Add, edit, and manage your sales entries</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={refreshData}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md text-white ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setShowExportPopup(true)}
                disabled={isExporting}
                className={`px-4 py-2 rounded-md text-white ${
                  isExporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isExporting ? 'Exporting...' : 'Export Sales'}
              </button>
            )}
          </div>
        </div>
      </header>

      {error && <></>}

      <div className="space-y-8">
        <div>
          <SalesTable sales={sales} onEdit={editSale} onDelete={deleteSale} isLoading={isLoading} />
        </div>

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
            onCustomerCreated={handleCustomerCreated}
          />
        </div>
      </div>
    </div>
  );
};
