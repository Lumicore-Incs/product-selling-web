import { CreditCardIcon, ScaleIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { SalesTable } from '../components/SalesTable';
import { Sale } from '../models/sales';
import { getCurrentUser } from '../service/auth';
import { getDashboardStats } from '../service/dashboard';
import { getAllProducts } from '../service/product';
import {
  getAllCustomerOrdersPaginated,
  getOrders,
  orderService,
} from '../services/orders/orderService';

type StatCardProps = {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  trend: string;
};

const StatCard = ({ icon: Icon, label, value, trend }: StatCardProps) => (
  <div className="bg-blue-200 bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-xl p-6 md:mb-8 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
      </div>
      <div className="p-3 bg-blue-50 rounded-lg">
        <Icon size={24} className="text-blue-500" />
      </div>
    </div>
    <div className="flex items-center mt-4 ">
      <TrendingUpIcon size={16} className="text-green-500 mr-1" />
      <span className="text-sm text-green-500">{trend}</span>
    </div>
  </div>
);

export const Dashboard = () => {
  const [stats, setStats] = useState({
    total_order: '0',
    todayOrders: '0',
    confirmedOrders: '0',
    cancelledOrders: '0',
    totalOrdersTrend: 'upcomming',
    todayOrdersTrend: 'upcomming',
    confirmedOrdersTrend: 'upcomming',
    cancelledOrdersTrend: 'upcomming',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ open: false, message: '', type: 'error' });

  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState('');
  const [showTodayOnly, setShowTodayOnly] = useState(false);

  const [user, setUser] = useState<{ role: string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [salesSearch, setSalesSearch] = useState('');

  // All-orders server-side pagination state
  const [allOrdersPage, setAllOrdersPage] = useState(0);
  const [allOrdersSize, setAllOrdersSize] = useState(5);
  const [allOrdersTotalPages, setAllOrdersTotalPages] = useState(0);
  const [allOrdersTotalElements, setAllOrdersTotalElements] = useState(0);
  // Debounced search used for the server call
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add product-related state
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  // Add state for check status button
  const [checkStatusLoading, setCheckStatusLoading] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'ALL STATUS' },
    { value: 'PENDING', label: 'PENDING' },
    { value: 'TEMPORARY', label: 'DUPLICATE' },
    { value: 'Processing', label: 'PROCESSING' },
    { value: 'Dispatched to Destination', label: 'DISPATCHED TO DESTINATION' },
    { value: 'Received at Destination', label: 'RECEIVED AT DESTINATION' },
    { value: 'Out for Delivery', label: 'OUT FOR DELIVERY' },
    { value: 'Rescheduled', label: 'RESCHEDULED' },
    { value: 'Failed to Deliver', label: 'FAILED TO DELIVER' },
    { value: 'Returned to Client', label: 'RETURNED TO CLIENT' },
    { value: 'Delivered', label: 'DELIVERED' },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Add effect to fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const productsData = await getAllProducts();
        setProducts(productsData as any[]);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setSalesLoading(true);

      if (showTodayOnly) {
        const [statsData, salesApiData] = await Promise.all([getDashboardStats(), getOrders()]);
        setStats({
          total_order: String(statsData.total_order || 0),
          todayOrders: String(statsData.today_order || 0),
          confirmedOrders: String(statsData.conform_order || 0),
          cancelledOrders: String(statsData.cancel_order || 0),
          totalOrdersTrend: statsData.totalOrdersTrend || 'upcomming',
          todayOrdersTrend: statsData.todayOrdersTrend || 'upcomming',
          confirmedOrdersTrend: statsData.confirmedOrdersTrend || 'upcomming',
          cancelledOrdersTrend: statsData.cancelledOrdersTrend || 'upcomming',
        });
        setSales(salesApiData as Sale[]);
        setAllOrdersTotalPages(0);
        setAllOrdersTotalElements(0);
      } else {
        const [statsData, pagedData] = await Promise.all([
          getDashboardStats(),
          getAllCustomerOrdersPaginated({
            page: allOrdersPage,
            size: allOrdersSize,
            status: statusFilter,
            search: debouncedSearch,
          }),
        ]);
        setStats({
          total_order: String(statsData.total_order || 0),
          todayOrders: String(statsData.today_order || 0),
          confirmedOrders: String(statsData.conform_order || 0),
          cancelledOrders: String(statsData.cancel_order || 0),
          totalOrdersTrend: statsData.totalOrdersTrend || 'upcomming',
          todayOrdersTrend: statsData.todayOrdersTrend || 'upcomming',
          confirmedOrdersTrend: statsData.confirmedOrdersTrend || 'upcomming',
          cancelledOrdersTrend: statsData.cancelledOrdersTrend || 'upcomming',
        });
        setSales(pagedData.content);
        setAllOrdersTotalPages(pagedData.totalPages);
        setAllOrdersTotalElements(pagedData.totalElements);
      }

      setError('');
      setSalesError('');
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard statistics');
      setSnackbar({ open: true, message: 'Failed to load dashboard statistics', type: 'error' });
      setSalesError('Failed to load recent sales');
      setSnackbar({ open: true, message: 'Failed to load recent sales', type: 'error' });
    } finally {
      setLoading(false);
      setSalesLoading(false);
    }
  }, [showTodayOnly, allOrdersPage, allOrdersSize, statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounce salesSearch for server-side queries (All Orders mode only)
  useEffect(() => {
    if (showTodayOnly) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setAllOrdersPage(0);
      setDebouncedSearch(salesSearch);
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [salesSearch, showTodayOnly]);

  // Reset page when statusFilter changes in All Orders mode
  useEffect(() => {
    if (!showTodayOnly) setAllOrdersPage(0);
  }, [statusFilter, showTodayOnly]);

  // Client-side filtering (used only in Today mode)
  const filteredSales =
    showTodayOnly && statusFilter !== 'all'
      ? sales.filter((sale) => sale.status === statusFilter)
      : sales;

  // Product-based filtering stays client-side for both modes
  const productFilteredSales =
    selectedProduct === 'all'
      ? filteredSales
      : filteredSales.filter((sale) =>
          sale.items.some((item) => item.productId === selectedProduct),
        );

  // Search: client-side only in Today mode (server-side in All Orders mode)
  const normalizedSearch = salesSearch.trim().toLowerCase();
  const searchedSales =
    !showTodayOnly || normalizedSearch === ''
      ? productFilteredSales
      : productFilteredSales.filter((sale) => {
          const name = (sale.customerName || sale.name || '').toLowerCase();
          const contact1 = (sale.contact01 || '').toLowerCase();
          const contact2 = (sale.contact02 || '').toLowerCase();
          const waybill = (sale.waybillId || '').toLowerCase();
          return (
            name.includes(normalizedSearch) ||
            contact1.includes(normalizedSearch) ||
            contact2.includes(normalizedSearch) ||
            waybill.includes(normalizedSearch)
          );
        });

  const handleEdit = (sale: any) => {
    console.log('Editing:', sale);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError('');
    try {
      await orderService.deleteOrder(id);
      // Refresh the full list from server to keep data consistent
      await fetchData();
      setSnackbar({ open: true, message: 'Order deleted successfully', type: 'success' });
    } catch (err: unknown) {
      const message = (err as Error)?.message || 'Failed to delete order';
      setSnackbar({ open: true, message, type: 'error' });
      console.error('Delete order failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add product filter handler
  const handleProductFilter = (productId: string) => {
    setSelectedProduct(productId);
  };

  // Handle check tracking status
  const handleCheckStatus = async () => {
    try {
      setCheckStatusLoading(true);
      await orderService.updateTrackingStatus();
      setSnackbar({
        open: true,
        message: 'Tracking status updated successfully',
        type: 'success',
      });
      // Refresh the data after updating tracking status
      await fetchData();
    } catch (err) {
      const message = (err as Error)?.message || 'Failed to update tracking status';
      setSnackbar({
        open: true,
        message,
        type: 'error',
      });
      console.error('Check status failed:', err);
    } finally {
      setCheckStatusLoading(false);
    }
  };

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
      <BackgroundIcons type="dashboard" />
      <AlertSnackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <button
          onClick={handleCheckStatus}
          disabled={checkStatusLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
        >
          {checkStatusLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Checking...
            </>
          ) : (
            'Check Status'
          )}
        </button>
        {!userLoading && user && user.role.toLowerCase() === 'admin' && (
          <div className="flex flex-wrap gap-2 max-w-full overflow-x-auto pb-2">
            <button
              onClick={() => handleProductFilter('all')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center shrink-0 ${
                selectedProduct === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 bg-opacity-70 hover:bg-opacity-100 text-blue-600'
              }`}
            >
              <span>All Products</span>
            </button>
            {productsLoading && (
              <div className="px-4 py-2 bg-gray-100 bg-opacity-70 text-gray-600 rounded-lg">
                Loading products...
              </div>
            )}
            {!productsLoading && products.length === 0 && (
              <div className="px-4 py-2 bg-red-100 bg-opacity-70 text-red-600 rounded-lg">
                No products found
              </div>
            )}
            {!productsLoading && products.length > 0 && (
              <>
                {products.map((product, index) => {
                  const productId = product.productId || product.id || index;
                  const productName = product.name || product.productName || `Product ${index + 1}`;

                  return (
                    <button
                      key={productId}
                      onClick={() => handleProductFilter(String(productId))}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center ${
                        selectedProduct === String(productId)
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 bg-opacity-70 hover:bg-opacity-100 text-blue-600'
                      }`}
                    >
                      <span>{productName}</span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {error && <></>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-2">
        <StatCard
          icon={ScaleIcon}
          label="Total Monthly Packs"
          value={loading ? 'Loading...' : stats.total_order}
          trend={stats.totalOrdersTrend}
        />
        <StatCard
          icon={CreditCardIcon}
          label="Today Packs"
          value={loading ? 'Loading...' : stats.todayOrders}
          trend={stats.todayOrdersTrend}
        />
        <StatCard
          icon={TrendingUpIcon}
          label="Delivered Packs"
          value={loading ? 'Loading...' : stats.confirmedOrders}
          trend={stats.confirmedOrdersTrend}
        />
        <StatCard
          icon={TrendingDownIcon}
          label="Cancelled/ Returned Packs"
          value={loading ? 'Loading...' : stats.cancelledOrders}
          trend={stats.cancelledOrdersTrend}
        />
      </div>

      <div className="bg-gray-200 w-full bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-xl p-4 sm:p-6 shadow-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Sales</h2>
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <div className="w-full sm:w-[260px]">
              <input
                type="text"
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                placeholder="Search name, contact, waybill"
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="relative min-w-[150px]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
            <div className="inline-flex rounded-lg bg-gray-100 p-1 cursor-pointer transition-all duration-300 ease-in-out">
              <div className="relative flex">
                <div
                  className={`
            absolute top-0 h-full rounded-md bg-white shadow-sm transition-all duration-300
            ${showTodayOnly ? 'left-0 w-[60px]' : 'left-[60px] w-[40px]'}
          `}
                />
                <div
                  className={`
              px-3 py-1 text-sm z-10 transition-colors duration-300
              ${showTodayOnly ? 'text-blue-600 font-medium' : 'text-gray-500'}
            `}
                  onClick={() => setShowTodayOnly(true)}
                >
                  Today
                </div>
                <div
                  className={`
              px-3 py-1 text-sm z-10 transition-colors duration-300
              ${!showTodayOnly ? 'text-blue-600 font-medium' : 'text-gray-500'}
            `}
                  onClick={() => setShowTodayOnly(false)}
                >
                  All
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          {salesLoading && <p>Loading sales...</p>}
          {salesError && <p className="text-red-500">{salesError}</p>}
          {!salesLoading && !salesError && (
            <SalesTable
              sales={searchedSales}
              onEdit={handleEdit}
              onDelete={handleDelete}
              userRole={user?.role}
              onRefresh={fetchData}
              hideSearch={!showTodayOnly}
              serverSidePagination={
                !showTodayOnly
                  ? {
                      page: allOrdersPage,
                      totalPages: allOrdersTotalPages,
                      totalElements: allOrdersTotalElements,
                      size: allOrdersSize,
                      sizeOptions: [5, 10, 20],
                      onPageChange: setAllOrdersPage,
                      onSizeChange: (s) => {
                        setAllOrdersSize(s);
                        setAllOrdersPage(0);
                      },
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};
