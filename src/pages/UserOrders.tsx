import { useEffect, useMemo, useState } from 'react';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { Sale } from '../models/sales';
import { getCurrentUser } from '../service/auth';
import { getUserDetails } from '../services/orders/orderService';
import { userService } from '../services/users/userService';
import {
  UsersIcon,
  TrendingUpIcon,
  PackageCheckIcon,
  RotateCcwIcon,
  CalendarIcon,
} from 'lucide-react';

interface UserWithOrders {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  orders: Sale[];
}

export const UserOrders = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [usersWithOrders, setUsersWithOrders] = useState<UserWithOrders[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDetails, setUserDetails] = useState<any>(null);

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserDetails(selectedUserId);
    }
  }, [selectedUserId]);

  const initialize = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER USER')) {
      setLoading(false);
      return;
    }

    await fetchUserOrders();
  };

  const fetchUserOrders = async () => {
    setLoading(true);

    const users = await userService.getAllUsers();

    const userMap = new Map<string, UserWithOrders>();

    users.forEach((u: any) => {
      userMap.set(u.id, {
        id: u.id,
        name: u.name || u.userName || 'Unknown',
        email: u.email,
        role: u.role,
        phone: u.phone,
        orders: [],
      });
    });

    // Fetch user details for all users in parallel
    const userDetailsPromises = users.map((u: any) =>
      getUserDetails(u.id).catch((err) => {
        console.error(`Failed to fetch details for user ${u.id}:`, err);
        return null;
      })
    );

    const userDetailsArray = await Promise.all(userDetailsPromises);

    // Map user details back to userMap
    users.forEach((u: any, index: number) => {
      const userInMap = userMap.get(u.id);
      if (userInMap && userDetailsArray[index]) {
        // Merge user details, keeping orders array
        const details = userDetailsArray[index];
        Object.assign(userInMap, {
          ...details,
          orders: details.orders || [],
        });
      }
    });

    const usersArray = Array.from(userMap.values());
    setUsersWithOrders(usersArray);

    const firstNonAdminUser = usersArray.find(
      u => u.role !== 'ADMIN'
    );

    if (firstNonAdminUser) {
      setSelectedUserId(firstNonAdminUser.id);
    }

    setLoading(false);
  };

  const fetchUserDetails = async (userId: string) => {
    try {
      const details = await getUserDetails(userId);
      setUserDetails(details);
    } catch (err) {
      console.error('Failed to fetch user details:', err);
      setUserDetails(null);
    }
  };

  const selectedUser = usersWithOrders.find(
    u => u.id === selectedUserId
  );

  const stats = useMemo(() => {
    if (!selectedUser) return null;

    const todayOrders = selectedUser.orders.filter(o => {
      const date = new Date(o.date || '');
      return date.toDateString() === today.toDateString();
    });

    const monthlyOrders = selectedUser.orders.filter(o => {
      const date = new Date(o.date || '');
      return date >= startOfMonth;
    });

    const deliveredThisMonth = monthlyOrders.filter(
      o => o.status?.toLowerCase() === 'delivered'
    );

    const returnedOrders = selectedUser.orders.filter(
      o => o.status?.toLowerCase() === 'returned'
    );

    const totalSales = selectedUser.orders.reduce(
      (sum, o) => sum + (o.totalPrice || 0),
      0
    );

    return {
      todayCount: todayOrders.length,
      monthCount: monthlyOrders.length,
      deliveredMonthCount: deliveredThisMonth.length,
      returnedCount: returnedOrders.length,
      totalSales,
    };
  }, [selectedUser]);

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER USER')) {
    return (
      <div className="p-10 text-center text-red-500 text-xl font-bold">
        Access Denied
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <BackgroundIcons />

      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-800">
            User Order Analytics Dashboard
          </h1>
          <p className="text-gray-500 mt-2">
            Monitor daily & monthly performance of users
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sidebar */}
          <div className="bg-white rounded-2xl shadow-md border p-4">
            <h2 className="font-semibold text-gray-700 mb-4">Users</h2>

            {usersWithOrders
              .filter(user => user.role !== 'ADMIN')
              .map(user => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUserId(user.id)}
                  className={`p-3 rounded-xl cursor-pointer mb-2 transition ${
                    selectedUserId === user.id
                      ? 'bg-blue-100 border border-blue-400'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500">
                    {user.email}
                  </div>
                </div>
              ))}
          </div>

          {/* Main Section */}
          <div className="lg:col-span-3 space-y-6">

            {stats && (
              <div className="grid md:grid-cols-5 gap-4">

                <StatCard icon={<CalendarIcon />} title="Today Orders" value={stats.todayCount} color="blue" />
                <StatCard icon={<UsersIcon />} title="This Month Orders" value={stats.monthCount} color="purple" />
                <StatCard icon={<PackageCheckIcon />} title="Delivered (Month)" value={stats.deliveredMonthCount} color="green" />
                <StatCard icon={<RotateCcwIcon />} title="Returned" value={stats.returnedCount} color="red" />
                <StatCard icon={<TrendingUpIcon />} title="Total Sales (LKR)" value={stats.totalSales.toFixed(2)} color="yellow" />

              </div>
            )}

            {selectedUser && (
              <div className="bg-white rounded-2xl shadow-md border p-6">

                {/* User Info + Role */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedUser.name}'s Orders
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {selectedUser.email}
                    </p>
                  </div>

                  {/* Role Badge */}
                  <div
                    className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-sm ${
                      selectedUser.role === 'ADMIN'
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white'
                        : selectedUser.role === 'SUPER USER'
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                        : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                    }`}
                  >
                    {selectedUser.role}
                  </div>
                </div>

                {/* Orders Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Serial</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Order Date</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-700">Total Amount (LKR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUser.orders.length > 0 ? (
                        selectedUser.orders.map((order: Sale, index: number) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3">{order.serialNo || `#${index + 1}`}</td>
                            <td className="px-4 py-3">
                              {order.date
                                ? new Date(order.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  order.status?.toLowerCase() === 'delivered'
                                    ? 'bg-green-100 text-green-800'
                                    : order.status?.toLowerCase() === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : order.status?.toLowerCase() === 'cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : order.status?.toLowerCase() === 'returned'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {order.status || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-800">
                              {order.totalPrice?.toFixed(2) || '0.00'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                            No orders found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>


              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

/* ===============================
   Stat Card Component
================================= */

const StatCard = ({
  icon,
  title,
  value,
  color,
}: {
  icon: any;
  title: string;
  value: any;
  color: string;
}) => {
  const colors: any = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 border hover:shadow-lg transition">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <h3 className="text-xl font-bold mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};