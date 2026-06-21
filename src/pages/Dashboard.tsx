import { Briefcase, ShoppingBag, Truck, XCircle, Loader } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { SalesTable } from '../components/SalesTable';
import { Sale } from '../models/sales';
import { getCurrentUser } from '../service/auth';
import { getDashboardStats } from '../service/dashboard';

import {
  getAllCustomerOrdersPaginated,
  getOrdersPaginated,
  orderService,
  type OrderFilterParams,
  type PaginatedResult,
} from '../services/orders/orderService';

// ─── Types ───────────────────────────────────────────────────────────────────

type AccentColor = 'teal' | 'yellow' | 'blue' | 'emerald' | 'pink';

type StatCardProps = {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  accentColor?: AccentColor;
};

type AccentConfig = { value: string; icon: string; bar: string; shadow: string };

// ─── Accent Map ──────────────────────────────────────────────────────────────

const accentMap: Record<AccentColor, AccentConfig> = {
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
  blue: {
    value: '#060ad9',
    icon: '#0b2ef5',
    bar: '#0b0ff5',
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

// ─── Stat Card ───────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, accentColor = 'teal' }: StatCardProps) => {
  const cfg = accentMap[accentColor];
  return (
    <div
      className="relative overflow-hidden flex flex-col justify-between cursor-pointer group transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '16px',
        padding: 'clamp(10px, 2.5vw, 20px) clamp(10px, 2.5vw, 20px) clamp(18px, 3vw, 24px)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        minHeight: 'clamp(90px, 12vw, 110px)',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p
            style={{
              color: '#5C626E',
              marginBottom: '10px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 400,
              wordBreak: 'break-word',
              lineHeight: '19px',
            }}
          >
            {label}
          </p>
          <p
            style={{
              color: cfg.value,
              fontFamily: 'Inter, sans-serif',
              fontSize: '30px',
              fontWeight: 700,
              lineHeight: '36px',
            }}
          >
            {value}
          </p>

          {/* Icon box */}
          <div
            className="flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 flex-shrink-0"
            style={{
              width: 'clamp(32px, 5vw, 44px)',
              height: 'clamp(32px, 5vw, 44px)',
              background: `${cfg.icon}18`,
            }}
          >
            <Icon
              style={{
                color: cfg.icon,
                width: 'clamp(16px, 2.5vw, 24px)',
                height: 'clamp(16px, 2.5vw, 24px)',
              }}
              strokeWidth={2.2}
            />
          </div>
        </div>
      </div>

      {/* Colored bottom accent bar */}
      <div
        className="absolute bottom-0 left-4 right-4 rounded-t-full"
        style={{ height: '3px', background: cfg.bar, opacity: 0.85 }}
      />
    </div>
  );
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const Dashboard = () => {


  const [stats, setStats] = useState({
    total_order: '0',
    todayOrders: '0',
    confirmedOrders: '0',
    cancelledOrders: '0',
    processingOrders: '0',
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
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
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

  const handleProductFilter = (productId: string) => {
    setSelectedProduct(productId);
    setCurrentPage(0);
  };

  const fetchData = useCallback(async () => {
    const filters: OrderFilterParams = {
      search: debouncedSearch,
      status: statusFilter === 'all' ? undefined : statusFilter,
      productId: selectedProduct === 'all' ? undefined : selectedProduct,
    };

    // Fetch stats
    try {
      setLoading(true);
      setSalesLoading(true);
      setSalesError('');

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
        processingOrders: String(statsData.processing_order || 0),
      });
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }

    // Fetch sales
    try {
      setSalesLoading(true);
      const salesResult = await (
        showTodayOnly
          ? getOrdersPaginated(currentPage, pageSize, filters)
          : getAllCustomerOrdersPaginated(currentPage, pageSize, filters)
      );
      setSales((salesResult as PaginatedResult<Sale>).data);
      setTotalCount((salesResult as PaginatedResult<Sale>).total);
      setTotalPages((salesResult as PaginatedResult<Sale>).totalPages);
    } catch (err) {
      console.error('Failed to fetch sales data:', err);
      setSnackbar({ open: true, message: 'Failed to load sales data', type: 'error' });
    } finally {
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
        const userData = await getCurrentUser();
        setUser(userData);
        // Map products to { id, name } — backend may return array of objects or strings
        const mapped = Array.isArray(productsData)
          ? (productsData as any[]).map((p: any) => ({
              id: String(p?.productId ?? p?.id ?? p?.product_id ?? p),
              name: String(p?.name ?? p?.productName ?? p?.product_name ?? p),
            }))
          : [];
        setProducts(mapped);
      } catch (err) {
        console.error(err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ff = "'Plus Jakarta Sans', sans-serif";

  const prodBtn = (id: string, label: string) => {
    const active = selectedProduct === id;
    return (
      <button
        key={id}
        onClick={() => handleProductFilter(id)}
        className="px-4 py-2 rounded-xl transition-all duration-200"
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: '16px',
          lineHeight: '19px',
          background: active
            ? '#0B818D'
            : 'rgba(122, 188, 195, 0.5)',
          color: active ? '#FFFFFF' : '#0B818D',
          border: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen relative mt-4 sm:mt-6 px-2 sm:px-0" style={{ fontFamily: ff }}>
      <BackgroundIcons type="dashboard" />

      <AlertSnackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />

      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 sm:mb-7">
        <h1
          style={{
            color: '#0E626E',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: '28px',
            lineHeight: '35px',
          }}
        >
          Welcome Back !
        </h1>

        {/* Product filter — dynamically loaded from API */}
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {prodBtn('all', 'All Products')}
          {products.map((p: any) =>
            prodBtn(
              String(p.productId ?? p.id ?? p.name),
              p.shortName || p.name || `Product ${p.productId}`
            )
          )}
        </div>
      </div>

      {/* ─── Stats Grid ──────────────────────────────────────────────────── */}
      {/*
        Mobile  : 2 cols, 5th card spans full width
        Tablet  : 3 cols
        Desktop : 5 cols
      */}
      <div className="mb-5 sm:mb-7">
        <style>{`
          .stats-grid {
            display: grid;
            gap: 12px;
            grid-template-columns: repeat(2, 1fr);
          }
          @media (max-width: 639px) {
            .stats-grid > *:last-child { grid-column: span 2; }
          }
          @media (min-width: 640px) {
            .stats-grid { grid-template-columns: repeat(3, 1fr); }
          }
          @media (min-width: 1024px) {
            .stats-grid { grid-template-columns: repeat(5, 1fr); }
          }
        `}</style>
        <div className="stats-grid">
          <StatCard
            icon={Briefcase}
            label="Total Monthly Packs"
            value={loading ? '...' : stats.total_order}
            accentColor="teal"
          />
          <StatCard
            icon={ShoppingBag}
            label="Today Packs"
            value={loading ? '...' : stats.todayOrders}
            accentColor="yellow"
          />
          <StatCard
            icon={Loader}
            label="Processing Packs"
            value={loading ? '...' : stats.processingOrders}
            accentColor="blue"
          />
          <StatCard
            icon={Truck}
            label="Delivered Packs"
            value={loading ? '...' : stats.confirmedOrders}
            accentColor="emerald"
          />
          <StatCard
            icon={XCircle}
            label="Canceled/Retuned Packs"
            value={loading ? '...' : stats.cancelledOrders}
            accentColor="pink"
          />
        </div>
      </div>

      {/* ─── Sales Section ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl sm:rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
        }}
      >
        {/* Top-bar */}
        <div
          className="flex flex-col gap-3 px-4 sm:px-6 py-3 sm:py-4"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm sm:text-base font-bold text-gray-800">Sales</p>

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
                    className="px-3 py-1 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200"
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

          {/* Search + Status filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={salesSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search name, contact, waybill"
              className="text-sm focus:outline-none focus:ring-2 focus:ring-teal-300/50 transition-all flex-1"
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(0,0,0,0.09)',
                borderRadius: '12px',
                padding: '8px 14px',
                fontFamily: ff,
                minWidth: 0,
              }}
            />

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
                padding: '8px 12px',
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
          </div>
        </div>

        {/* Table area */}
        <div className="p-2">
          {salesError && (
            <p className="text-red-500 text-center py-10 text-sm">{salesError}</p>
          )}

          {!salesError && (
            <SalesTable
              sales={sales}
              isLoading={salesLoading}
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