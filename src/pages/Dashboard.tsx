import { CreditCardIcon, ScaleIcon, TrendingDownIcon, TrendingUpIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { SalesTable } from '../components/SalesTable';
import { Sale } from '../models/sales';
import { getCurrentUser } from '../service/auth';
import { getDashboardStats } from '../service/dashboard';
import { getAllProducts } from '../service/product'; // Add this import
import {
  getAllCustomerOrdersPaginated,
  getOrdersPaginated,
  orderService,
  type OrderFilterParams,
  type PaginatedResult,
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

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE_OPTIONS = [5, 10, 20];

  const [user, setUser] = useState<{ role: string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [salesSearch, setSalesSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (value: string) => {
    setSalesSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(0);
    }, 400);
  };

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

      const filters: OrderFilterParams = {
        search: debouncedSearch,
        status: statusFilter,
        productId: selectedProduct,
      };

      const [statsData, salesResult] = await Promise.all([
        getDashboardStats(),
        showTodayOnly
          ? getOrdersPaginated(currentPage, pageSize, filters)
          : getAllCustomerOrdersPaginated(currentPage, pageSize, filters),
      ]);

      // Process stats
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
      setError('');

      setSales((salesResult as PaginatedResult<Sale>).data);
      setTotalCount((salesResult as PaginatedResult<Sale>).total);
      setTotalPages((salesResult as PaginatedResult<Sale>).totalPages);
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
  }, [showTodayOnly, currentPage, pageSize, debouncedSearch, statusFilter, selectedProduct]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredSales = sales;

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
    setCurrentPage(0);
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
          )}a
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
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search name, contact, waybill"
                className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="relative min-w-[150px]">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(0);
                }}
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
                  onClick={() => {
                    setShowTodayOnly(true);
                    setCurrentPage(0);
                  }}
                >
                  Today
                </div>
                <div
                  className={`
              px-3 py-1 text-sm z-10 transition-colors duration-300
              ${!showTodayOnly ? 'text-blue-600 font-medium' : 'text-gray-500'}
            `}
                  onClick={() => {
                    setShowTodayOnly(false);
                    setCurrentPage(0);
                  }}
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
              sales={filteredSales}
              onEdit={handleEdit}
              onDelete={handleDelete}
              userRole={user?.role}
              onRefresh={fetchData}
              searchTerm={salesSearch}
              onSearchChange={handleSearchChange}
              serverPagination={{
                page: currentPage,
                pageSize,
                total: totalCount,
                totalPages,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                onPrev: () => setCurrentPage((p) => Math.max(0, p - 1)),
                onNext: () => setCurrentPage((p) => Math.min(totalPages - 1, p + 1)),
                onPageSizeChange: (size) => {
                  setPageSize(size);
                  setCurrentPage(0);
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
