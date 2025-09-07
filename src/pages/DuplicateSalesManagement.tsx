import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { SalesForm } from '../components/SalesForm';
import { SalesTable } from '../components/SalesTable';
import { CustomerDtoGet, dashboardApi, orderApi } from '../services/api';
import { getCurrentUser } from '../services/auth';

interface SaleItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
}

interface Sale {
  id: string;
  name: string;
  address: string;
  contact01: string;
  contact02: string;
  status: string;
  qty: string;
  remark: string;
  totalPrice: string;
  items: SaleItem[];
  totalAmount?: number;
}

interface OutletContext {
  salesTitle: string;
  salesBackgroundColor: string;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

export const DuplicateSalesManagement: React.FC = () => {
  const { salesTitle, salesBackgroundColor, showSettings, setShowSettings } =
    useOutletContext<OutletContext>();
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
      // Test connection first
      const isConnected = await orderApi.testConnection();
      if (!isConnected) {
        throw new Error(
          'Cannot connect to server. Please check if the backend is running on port 8081.'
        );
      }

      // Load all orders from backend
      console.log('Calling orderApi.getAllDuplicateOrders()...');
      const responseOrder = await orderApi.getAllDuplicateOrders();

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

      // Convert backend OrderDtoGet to frontend Sale format
      // Use the same mapping as Dashboard component
      const convertedSales: Sale[] = responseOrder.map((order: any, index: number) => {
        console.log(`Converting order ${index}:`, order);
        console.log(`Available fields:`, Object.keys(order));

        const converted = {
          id: String(order.orderId || ''),
          name: order.customer?.name || '',
          address: order.customer?.address || '',
          contact01: order.customer?.contact01 || '',
          contact02: order.customer?.contact02 || '',
          status: order.status || '',
          quantity: String(
            order.orderDetails?.reduce((sum: number, item: any) => sum + item.qty, 0) || 0
          ),
          remark: order.customer?.remark || '',
          totalAmount: order.totalPrice || '',
          items: Array.isArray(order.orderDetails)
            ? order.orderDetails.map((detail: any) => ({
                productId: String(detail.productId?.productId || ''),
                productName: detail.productId?.name || '',
                quantity: detail.qty || 0,
                price: detail.productId?.price || 0,
              }))
            : [],
        };

        console.log(`Converted order ${index}:`, converted);
        return converted;
      });

      console.log('Final convertedSales:', convertedSales);
      console.log('Setting sales state with', convertedSales.length, 'items');

      setSales(convertedSales);
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

  const addSale = (sale: Omit<Sale, 'id'>) => {
    loadOrders();
  };

  const handleCustomerCreated = (customer: CustomerDtoGet) => {
    // Refresh orders after a new customer/order is created
    loadOrders();
  };

  const updateSale = (updatedSale: Sale) => {
    // For now, just update local state since you don't have update API endpoint
    setSales(sales.map((sale) => (sale.id === updatedSale.id ? updatedSale : sale)));
    setCurrentSale(null);
    setIsEditing(false);

    // TODO: Add API call to update order when backend supports it
    // await orderApi.updateOrder(updatedSale.id, updatedSale);
  };

  const deleteSale = async (id: string) => {
    // For now, just update local state since you don't have delete API endpoint
    setSales(sales.filter((sale) => sale.id !== id));
    if (currentSale?.id === id) {
      setCurrentSale(null);
      setIsEditing(false);
    }

    // TODO: Add API call to delete order when backend supports it
    // await orderApi.deleteOrder(id);
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
    } catch (error: any) {
      const errorMessage = `Failed to export ${exportType} data. ${error?.message || ''}`;
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
    <div className="max-w-7xl w-full mx-auto p-6 rounded-lg">
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
            <p className="text-gray-600 mt-2">edit, and manage your duplicate sales entries</p>
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
