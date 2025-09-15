import { useState, useEffect } from 'react';
import { TrendingDownIcon, ScaleIcon, CreditCardIcon, TrendingUpIcon } from 'lucide-react';
import { SalesTable, Sale } from '../components/SalesTable';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { getDashboardStats } from '../service/dashboard';
import { getOrders, getAllCustomerOrders, Order } from '../service/order';
import { getCurrentUser } from '../service/auth';
import { getAllProducts } from '../service/product'; // Add this import
import { AlertSnackbar } from '../components/AlertSnackbar';

type StatCardProps = {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
  trend: string;
};

const StatCard = ({
                    icon: Icon,
                    label,
                    value,
                    trend
                  }: StatCardProps) => (
    <div className="bg-blue-200 bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
        </div>
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon size={24} className="text-blue-500" />
        </div>
      </div>
      <div className="flex items-center mt-4">
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
    totalOrdersTrend: '+0%',
    todayOrdersTrend: '+0%',
    confirmedOrdersTrend: '+0%',
    cancelledOrdersTrend: '+0%'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({ open: false, message: '', type: 'error' });

  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState('');
  const [showTodayOnly, setShowTodayOnly] = useState(false);

  const [user, setUser] = useState<{ role: string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Add product-related state
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
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
        setProducts(productsData);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setSalesLoading(true);

        const [statsData, salesApiData] = await Promise.all([
          getDashboardStats(),
          showTodayOnly ? getOrders() : getAllCustomerOrders()
        ]);

        // Process stats
        setStats({
          total_order: String(statsData.total_order || 0),
          todayOrders: String(statsData.today_order || 0),
          confirmedOrders: String(statsData.conform_order || 0),
          cancelledOrders: String(statsData.cancel_order || 0),
          totalOrdersTrend: statsData.totalOrdersTrend || '+0%',
          todayOrdersTrend: statsData.todayOrdersTrend || '+0%',
          confirmedOrdersTrend: statsData.confirmedOrdersTrend || '+0%',
          cancelledOrdersTrend: statsData.cancelledOrdersTrend || '+0%'
        });
        setError('');

        // Process sales
        const mappedSales: Sale[] = salesApiData.map(order => ({
          id: String(order.orderId),
          name: order.customerId.name,
          address: order.customerId.address,
          contact01: order.customerId.contact01,
          contact02: order.customerId.contact02 || '-',
          status: order.status,
          quantity: String(order.orderDetails.reduce((sum, item) => sum + item.qty, 0)),
          items: order.orderDetails.map(detail => ({
            productId: String(detail.productId.productId),
            productName: detail.productId.name,
            quantity: detail.qty,
            price: detail.productId.price,
          })),
        }));
        setSales(mappedSales);
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
    };

    fetchData();
  }, [showTodayOnly]);

  const filteredSales = statusFilter === 'all'
      ? sales
      : sales.filter(sale => sale.status === statusFilter);

  // Add product-based filtering
  const productFilteredSales = selectedProduct === 'all'
      ? filteredSales
      : filteredSales.filter(sale =>
          sale.items.some(item => item.productId === selectedProduct)
      );

  const handleEdit = (sale: any) => {
    console.log('Editing:', sale);
  };

  const handleDelete = (id: string) => {
    console.log('Deleting:', id);
  };

  // Add product filter handler
  const handleProductFilter = (productId: string) => {
    setSelectedProduct(productId);
  };

  return (
      <div className="space-y-6 overflow-x-hidden mx-6 relative">
        <BackgroundIcons type="dashboard" />
        <AlertSnackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        />
        <div className="flex justify-between items-center mb-6 ">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
          {!userLoading && user && user.role.toLowerCase() === 'admin' && (
              <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => handleProductFilter('all')}
                    className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center ${
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

        {error && (
            <></>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 mr-6">
          <StatCard
              icon={ScaleIcon}
              label="Total Order"
              value={loading ? "Loading..." : stats.total_order}
              trend={stats.totalOrdersTrend}
          />
          <StatCard
              icon={CreditCardIcon}
              label="Today Order"
              value={loading ? "Loading..." : stats.todayOrders}
              trend={stats.todayOrdersTrend}
          />
          <StatCard
              icon={TrendingUpIcon}
              label="Conform Order"
              value={loading ? "Loading..." : stats.confirmedOrders}
              trend={stats.confirmedOrdersTrend}
          />
          <StatCard
              icon={TrendingDownIcon}
              label="Cancel Order"
              value={loading ? "Loading..." : stats.cancelledOrders}
              trend={stats.cancelledOrdersTrend}
          />
        </div>

        <div  className="bg-gray-200 w-[85%] md:w-[100%] bg-opacity-70 backdrop-filter backdrop-blur-lg rounded-xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Sales</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              <div className="inline-flex rounded-lg bg-gray-100 p-1 cursor-pointer transition-all duration-300 ease-in-out">
                <div className="relative flex">
                  <div className={`
            absolute top-0 h-full rounded-md bg-white shadow-sm transition-all duration-300
            ${showTodayOnly ? 'left-0 w-[60px]' : 'left-[60px] w-[40px]'}
          `} />
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
                    sales={productFilteredSales}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}
          </div>
        </div>
      </div>
  );
};