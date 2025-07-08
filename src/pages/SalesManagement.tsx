import React, { useState, useEffect } from 'react';
import { SalesForm } from '../components/SalesForm';
import { SalesTable } from '../components/SalesTable';
import { customerApi, orderApi, CustomerDtoGet, OrderDtoGet } from '../services/api';

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

export const SalesManagement: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing orders from backend on component mount
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Test connection first
      const isConnected = await orderApi.testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to server. Please check if the backend is running on port 8081.');
      }

      // Load all orders from backend
      console.log('Calling orderApi.getAllOrders()...');
      const responseOrder = await orderApi.getAllOrders();

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
          name: order.customerId?.name || '',
          address: order.customerId?.address || '',
          contact01: order.customerId?.contact01 || '',
          contact02: order.customerId?.contact02 || '',
          status: order.status || '',
          quantity: String(order.orderDetails?.reduce((sum: number, item: any) => sum + item.qty, 0) || 0),
          remark: order.customerId?.remark || '',
          totalAmount: order.totalPrice || '',
          items: Array.isArray(order.orderDetails)
              ? order.orderDetails.map((detail: any) => ({
                productId: String(detail.productId?.productId || ''),
                productName: detail.productId?.name || '',
                quantity: detail.qty || 0,
                price: detail.productId?.price || 0
              }))
              : []
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
        errorMessage += 'Endpoint not found. Please check if your backend server is running and the endpoint exists.';
      } else if (error.response?.status === 401) {
        errorMessage += 'Authentication failed. Please login again.';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }

      setError(errorMessage);
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
    setSales(sales.map(sale => sale.id === updatedSale.id ? updatedSale : sale));
    setCurrentSale(null);
    setIsEditing(false);

    // TODO: Add API call to update order when backend supports it
    // await orderApi.updateOrder(updatedSale.id, updatedSale);
  };

  const deleteSale = async (id: string) => {
    // For now, just update local state since you don't have delete API endpoint
    setSales(sales.filter(sale => sale.id !== id));
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

  const exportSales = () => {
    const dataStr = JSON.stringify(sales, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `sales-data-${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
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
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Sales Management</h1>
              <p className="text-gray-600 mt-2">
                Add, edit, and manage your sales entries
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                  onClick={refreshData}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-md text-white ${
                      isLoading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-green-600 hover:bg-green-700'
                  }`}
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                  onClick={exportSales}
                  disabled={sales.length === 0}
                  className={`px-4 py-2 rounded-md text-white ${
                      sales.length === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                Export Sales
              </button>
            </div>
          </div>
        </header>

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              <div className="flex justify-between items-center">
                <span>{error}</span>
                <button
                    onClick={() => setError(null)}
                    className="text-red-700 hover:text-red-900 font-bold"
                >
                  ×
                </button>
              </div>
            </div>
        )}

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
                onCustomerCreated={handleCustomerCreated}
            />
          </div>
          <div>
            <SalesTable
                sales={sales}
                onEdit={editSale}
                onDelete={deleteSale}
                isLoading={isLoading}
            />
          </div>
        </div>
      </div>
  );
};