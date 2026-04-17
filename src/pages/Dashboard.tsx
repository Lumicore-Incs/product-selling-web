import { Package, Truck, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { SalesTable } from '../components/SalesTable';
import { Sale } from '../models/sales';
import { getCurrentUser } from '../service/auth';
import { getDashboardStats } from '../service/dashboard';
import { getAllProducts } from '../service/product';
import { useNotification } from '../context/NotificationContext';
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
  accentColor?: 'teal' | 'yellow' | 'emerald' | 'pink';
};

const StatCard = ({ icon: Icon, label, value, accentColor = 'teal' }: StatCardProps) => {
  const colorConfig = {
    teal: {
      number: 'text-teal-600',
      iconBg: 'bg-teal-500',
      bottomBar: 'bg-teal-500',
      icon: 'text-white',
      hoverShadow: 'hover:shadow-2xl hover:shadow-teal-500/20',
    },
    yellow: {
      number: 'text-amber-600',
      iconBg: 'bg-amber-500',
      bottomBar: 'bg-amber-500',
      icon: 'text-white',
      hoverShadow: 'hover:shadow-2xl hover:shadow-amber-500/20',
    },
    emerald: {
      number: 'text-emerald-600',
      iconBg: 'bg-emerald-500',
      bottomBar: 'bg-emerald-500',
      icon: 'text-white',
      hoverShadow: 'hover:shadow-2xl hover:shadow-emerald-500/20',
    },
    pink: {
      number: 'text-pink-600',
      iconBg: 'bg-pink-500',
      bottomBar: 'bg-pink-500',
      icon: 'text-white',
      hoverShadow: 'hover:shadow-2xl hover:shadow-pink-500/20',
    },
  };

  const config = colorConfig[accentColor];

  return (
    <div
      className={`
        bg-white/95 backdrop-blur-2xl 
        rounded-3xl p-4 
        border border-white/70 
        shadow-lg 
        ${config.hoverShadow}
        transition-all duration-300 
        hover:-translate-y-1 
        hover:scale-[1.02]
        relative overflow-hidden
        cursor-pointer
      `}
    >
      {/* Main Content */}
      <div className="flex justify-between items-start h-1/4">
        <div>
          <p className="text-gray-600 text-[12px] font-medium tracking-wide">
            {label}
          </p>
          <h3 className={`text-[28px] leading-none font-bold mt-3 tracking-tighter ml-4 ${config.number}`}>
            {value}
          </h3>
        </div>

        {/* Icon */}
        <div className={`${config.iconBg} p-2 rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={30} className={config.icon} strokeWidth={2.5} />
        </div>
      </div>

      {/* Thicker Bottom Colored Line */}
      <div className={`absolute bottom-0 left-6 right-6 h-[5px] rounded-t-full ${config.bottomBar}`} />
    </div>
  );
};

export const Dashboard = () => {
  const { addNotification } = useNotification();
  const [stats, setStats] = useState({
    total_order: '0',
    todayOrders: '0',
    confirmedOrders: '0',
    cancelledOrders: '0',
  });
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({
    open: false,
    message: '',
    type: 'error',
  });

  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState('');
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [user, setUser] = useState<{ role: string } | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [salesSearch, setSalesSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (value: string) => {
    setSalesSearch(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(0);
    }, 400);
  };

  const handleProductFilter = (productId: string) => {
    setSelectedProduct(productId);
    setCurrentPage(0);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setSalesLoading(true);

      const filters: OrderFilterParams = {
        search: debouncedSearch,
        status: statusFilter === 'all' ? undefined : statusFilter,
        productId: selectedProduct === 'all' ? undefined : selectedProduct,
      };

      const [statsData, salesResult] = await Promise.all([
        getDashboardStats(),
        showTodayOnly
          ? getOrdersPaginated(currentPage, pageSize, filters)
          : getAllCustomerOrdersPaginated(currentPage, pageSize, filters),
      ]);

      setStats({
        total_order: String(statsData.total_order || 0),
        todayOrders: String(statsData.today_order || 0),
        confirmedOrders: String(statsData.conform_order || 0),
        cancelledOrders: String(statsData.cancel_order || 0),
      });

      setSales((salesResult as PaginatedResult<Sale>).data);
      setTotalCount((salesResult as PaginatedResult<Sale>).total);
      setTotalPages((salesResult as PaginatedResult<Sale>).totalPages);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setSnackbar({ open: true, message: 'Failed to load dashboard data', type: 'error' });
    } finally {
      setLoading(false);
      setSalesLoading(false);
    }
  }, [showTodayOnly, currentPage, pageSize, debouncedSearch, statusFilter, selectedProduct]);

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


  // Fetch user and products
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [userData, productsData] = await Promise.all([
          getCurrentUser(),
          getAllProducts(),
        ]);
        setUser(userData);
        setProducts(productsData as any[]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundIcons type="dashboard" />

      <AlertSnackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold" style={{ color: '#0E626E', fontFamily: 'Plus Jakarta Sans' }}>Welcome Back !</h1>
        </div>

        {/* Product Filters */}
        <div className="flex flex-wrap gap-2 md:gap-3">
          <button
            onClick={() => handleProductFilter('all')}
            className={`px-3 md:px-6 py-2 md:py-2.5 rounded-2xl font-medium text-xs md:text-sm transition-all ${selectedProduct === 'all'
              ? 'bg-teal-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
          >
            All Products
          </button>
          <button
            onClick={() => handleProductFilter('sugar')}
            className={`px-3 md:px-6 py-2 md:py-2.5 rounded-2xl font-medium text-xs md:text-sm transition-all ${selectedProduct === 'sugar'
              ? 'bg-teal-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
          >
            SUGAR END
          </button>
          <button
            onClick={() => handleProductFilter('ani')}
            className={`px-3 md:px-6 py-2 md:py-2.5 rounded-2xl font-medium text-xs md:text-sm transition-all ${selectedProduct === 'ani'
              ? 'bg-teal-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
          >
            ANI
          </button>
          <button
            onClick={() => handleProductFilter('medani')}
            className={`px-3 md:px-6 py-2 md:py-2.5 rounded-2xl font-medium text-xs md:text-sm transition-all ${selectedProduct === 'medani'
              ? 'bg-teal-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
          >
            MEDANI
          </button>
        </div>
      </div>

      {/* Stats Grid with Hover Effect */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          icon={Package}
          label="Total Monthly Packs"
          value={loading ? '...' : stats.total_order}
          accentColor="teal"
        />
         <StatCard
          icon={XCircle}
          label="Poccesing"
          value={loading ? '...' : stats.cancelledOrders}
          accentColor="pink"
        />
        <StatCard
          icon={Package}
          label="Today Packs"
          value={loading ? '...' : stats.todayOrders}
          accentColor="yellow"
        />
        <StatCard
          icon={Truck}
          label="Delivered Packs"
          value={loading ? '...' : stats.confirmedOrders}
          accentColor="emerald"
        />
        <StatCard
          icon={XCircle}
          label="Canceled/Returned Packs"
          value={loading ? '...' : stats.cancelledOrders}
          accentColor="pink"
        />
      </div>

      {/* Sales Table Section */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-xl border border-white p-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sales Entries</h2>
            <p className="text-gray-500 text-sm mt-1">4,406 entries</p>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="text"
              value={salesSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search name, contact, waybill"
              className="w-60 bg-white border border-gray-200 rounded-2xl px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(0);
              }}
              className="w-60 bg-white border border-gray-200 rounded-2xl px-1 py-1 text-s focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <div className="flex bg-white rounded-2xl p-1 border border-gray-200">
              <button
                onClick={() => setShowTodayOnly(false)}
                className={`px-2 py-1 rounded-xl text-sm font-medium transition-all ${!showTodayOnly ? 'bg-teal-600 text-white' : 'text-gray-600'}`}
              >
                All
              </button>
              <button
                onClick={() => setShowTodayOnly(true)}
                className={`px-2 py-1 rounded-xl text-sm font-medium transition-all ${showTodayOnly ? 'bg-teal-600 text-white' : 'text-gray-600'}`}
              >
                Today
              </button>
            </div>
          </div>
        </div>

        {salesLoading && <p className="text-center py-10 text-gray-500">Loading sales...</p>}
        {salesError && <p className="text-red-500 text-center py-10">{salesError}</p>}

        {!salesLoading && !salesError && (
          <SalesTable
            sales={sales}
            onEdit={() => { }}
            onDelete={async (id) => {
              try {
                await orderService.deleteOrder(id);
                fetchData();
              } catch (err) {
                setSnackbar({ open: true, message: 'Failed to delete order', type: 'error' });
              }
            }}
            userRole={user?.role}
            onRefresh={fetchData}
            searchTerm={salesSearch}
            onSearchChange={handleSearchChange}
            serverPagination={{
              page: currentPage,
              pageSize,
              total: totalCount,
              totalPages,
              pageSizeOptions: [5, 10, 20],
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
  );
};