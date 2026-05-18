import { Package, Truck, XCircle, BarChart2 } from 'lucide-react';
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

// ─── Stat Card ──────────────────────────────────────────────────────────────

type AccentColor = 'teal' | 'yellow' | 'emerald' | 'pink';

type StatCardProps = {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  accentColor?: AccentColor;
};

const accentMap: Record<
  AccentColor,
  { value: string; icon: string; bar: string; shadow: string }
> = {
  teal: {
    value: '#0891b2',
    icon: '#0891b2',
    bar: '#0891b2',
    shadow: '0 8px 24px rgba(8,145,178,0.18)',
  },
  yellow: {
    value: '#d97706',
    icon: '#f59e0b',
    bar: '#f59e0b',
    shadow: '0 8px 24px rgba(245,158,11,0.18)',
  },
  emerald: {
    value: '#059669',
    icon: '#10b981',
    bar: '#10b981',
    shadow: '0 8px 24px rgba(16,185,129,0.18)',
  },
  pink: {
    value: '#db2777',
    icon: '#ec4899',
    bar: '#ec4899',
    shadow: '0 8px 24px rgba(236,72,153,0.18)',
  },
};

const StatCard = ({ icon: Icon, label, value, accentColor = 'teal' }: StatCardProps) => {
  const cfg = accentMap[accentColor];
  return (
    <div
      className="relative overflow-hidden flex flex-col justify-between cursor-pointer group transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '20px',
        padding: '20px 20px 24px',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        minHeight: '110px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-xs font-medium tracking-wide"
            style={{ color: '#6b7280', marginBottom: '10px' }}
          >
            {label}
          </p>
          <p
            className="text-3xl font-black leading-none"
            style={{ color: cfg.value, letterSpacing: '-1px' }}
          >
            {value}
          </p>
        </div>

        {/* Icon box */}
        <div
          className="flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
          style={{
            width: '44px',
            height: '44px',
            background: `${cfg.icon}18`,
            flexShrink: 0,
          }}
        >
          <Icon size={22} style={{ color: cfg.icon }} strokeWidth={2.2} />
        </div>
      </div>

      {/* Colored bottom accent bar */}
      <div
        className="absolute bottom-0 left-6 right-6 rounded-t-full"
        style={{ height: '4px', background: cfg.bar, opacity: 0.85 }}
      />
    </div>
  );
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const Dashboard = () => {
  const { addNotification } = useNotification();

  const [stats, setStats] = useState({
    total_order: '0',
    todayOrders: '0',
    confirmedOrders: '0',
    cancelledOrders: '0',
  });
  const [loading, setLoading] = useState(true);
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

  // ─── Shared font family
  const ff = "'Plus Jakarta Sans', sans-serif";

  // ─── Product filter button helper
  const prodBtn = (id: string, label: string) => {
    const active = selectedProduct === id;
    return (
      <button
        key={id}
        onClick={() => handleProductFilter(id)}
        className="px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200"
        style={{
          fontFamily: ff,
          background: active
            ? 'linear-gradient(135deg, #0d9488, #0891b2)'
            : 'rgba(255,255,255,0.75)',
          color: active ? '#fff' : '#374151',
          border: active ? 'none' : '1px solid rgba(0,0,0,0.08)',
          boxShadow: active ? '0 4px 14px rgba(13,148,136,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen relative" style={{ fontFamily: ff }}>
      <BackgroundIcons type="dashboard" />

      <AlertSnackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />

      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7">
        <h1
          className="text-3xl md:text-4xl font-black"
          style={{ color: '#0E626E', letterSpacing: '-0.5px', fontFamily: ff }}
        >
          Welcome Back !
        </h1>

        <div className="flex flex-wrap gap-2">
          {prodBtn('all', 'All Products')}
          {prodBtn('sugar', 'SUGAR END')}
          {prodBtn('vac', 'ANI')}
          {prodBtn('medani', 'MEDANI')}
        </div>
      </div>

      {/* ─── Stats Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard
          icon={Package}
          label="Total Monthly Packs"
          value={loading ? '...' : stats.total_order}
          accentColor="teal"
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

      {/* ─── Sales Section ───────────────────────────────────────────────── */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
        }}
      >
        {/* Sales section top-bar (outside the teal header) */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
        >
          <p className="text-base font-bold text-gray-800">Sales</p>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <input
              type="text"
              value={salesSearch}
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
                setCurrentPage(0);
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
                    onClick={() => setShowTodayOnly(isToday)}
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

        {/* Teal inner header (Sales Entries) */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: 'linear-gradient(135deg, #0d9488, #0a7f8a)',
          }}
        >
          <div>
            <p className="text-white font-bold text-lg leading-tight">Sales Entries</p>
            <p className="text-teal-200 text-xs mt-0.5">
              {loading ? '...' : totalCount.toLocaleString()} entries
            </p>
          </div>

          {/* Inner search + refresh */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={salesSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search..."
                className="text-sm focus:outline-none"
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  borderRadius: '10px',
                  padding: '6px 12px 6px 30px',
                  color: '#fff',
                  fontFamily: ff,
                  width: '160px',
                }}
              />
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.7)"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition-colors">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Table area */}
        <div className="p-2">
          {salesLoading && (
            <p className="text-center py-10 text-gray-400 text-sm">Loading sales...</p>
          )}
          {salesError && (
            <p className="text-red-500 text-center py-10 text-sm">{salesError}</p>
          )}

          {!salesLoading && !salesError && (
            <SalesTable
              sales={sales}
              onEdit={() => {}}
              onDelete={async (id) => {
                try {
                  await orderService.deleteOrder(id);
                  fetchData();
                } catch (err) {
                  setSnackbar({
                    open: true,
                    message: 'Failed to delete order',
                    type: 'error',
                  });
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
                onNext: () =>
                  setCurrentPage((p) => Math.min(totalPages - 1, p + 1)),
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
