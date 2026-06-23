import { useEffect, useState } from 'react';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { getCurrentUser } from '../service/auth';
import { getUserAnalytics, UserAnalytics } from '../services/orders/orderService';
import { userService } from '../services/users/userService';
import {
  UsersIcon,
  PackageCheckIcon,
  RotateCcwIcon,
  CalendarIcon,
  PlusIcon,
} from 'lucide-react';
import { PaymentModal } from '../components/payments/PaymentModal';
import { PaymentDetailsTable } from '../components/payments/PaymentDetailsTable';
import { paymentService, PaymentDetail } from '../services/payments/paymentService';

interface UserWithOrders {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
}

export const UserOrders = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [usersWithOrders, setUsersWithOrders] = useState<UserWithOrders[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchPaymentDetails(selectedUserId);
      fetchUserAnalytics(selectedUserId);
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

    try {
      const users = await userService.getAllUsers();
      const usersArray: UserWithOrders[] = users.map((u: any) => ({
        id: u.id,
        name: u.name || u.userName || 'Unknown',
        email: u.email,
        role: u.role,
        phone: u.phone,
      }));

      setUsersWithOrders(usersArray);

      const firstNonAdminUser = usersArray.find(u => u.role !== 'ADMIN');
      if (firstNonAdminUser) {
        setSelectedUserId(firstNonAdminUser.id);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentDetails = async (userId: string) => {
    setPaymentDetailsLoading(true);
    try {
      const response = await paymentService.getPaymentsByUserId(userId);
      if (response.success) {
        setPaymentDetails(response.data.paymentDetails || []);
      }
    } catch (err) {
      console.error('Failed to fetch payment details:', err);
      setPaymentDetails([]);
    } finally {
      setPaymentDetailsLoading(false);
    }
  };

  const fetchUserAnalytics = async (userId: string) => {
    try {
      setUserAnalytics(null);
      const response = await getUserAnalytics(userId);
      if (response.success && response.data) {
        setUserAnalytics(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch user analytics:', err);
      setUserAnalytics(null);
    }
  };

  const selectedUser = usersWithOrders.find(u => u.id === selectedUserId);

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER USER')) {
    return (
      <div className="p-10 text-center text-red-500 text-xl font-bold">
        Access Denied
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#afdbe0] p-4 lg:p-8 overflow-hidden font-sans rounded-3xl">
      {/* Background Blobs (Slightly more subtle) */}
      <div className="absolute top-[-5%] left-[-5%] w-[400px] h-[400px] bg-blue-300/10 rounded-full blur-[80px]" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-indigo-300/10 rounded-full blur-[100px]" />

      <BackgroundIcons />

      <div className="relative max-w-7xl mx-auto z-10">
        {/* Modern Compact Header */}
        <div className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/60 shadow-xl shadow-blue-50/50">
          <div className="flex items-center gap-6">
            <div className="hidden md:flex w-14 h-14 bg-blue-600 rounded-2xl items-center justify-center shadow-lg shadow-blue-200">
               <PackageCheckIcon className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Analytics Dashboard</h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Real-time user performance metrics</p>
            </div>
          </div>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="mt-4 md:mt-0 group px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xl shadow-blue-200 flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Settlement</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* User List Sidebar (More Compact) */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="bg-white/50 backdrop-blur-xl rounded-3xl shadow-lg border border-white/60 p-5">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-sm font-black text-gray-800 uppercase tracking-wider">User Directory</h2>
                <UsersIcon className="w-4 h-4 text-gray-400" />
              </div>

              <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                {loading ? (
                  <div className="text-center py-4 text-gray-500 text-xs font-bold">Loading directory...</div>
                ) : usersWithOrders.filter(user => user.role !== 'ADMIN').length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-xs">No users found</div>
                ) : (
                  usersWithOrders
                    .filter(user => user.role !== 'ADMIN')
                    .map(user => (
                      <div
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 border ${selectedUserId === user.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                            : 'bg-transparent border-transparent hover:bg-blue-50/50 hover:border-blue-100 text-gray-600 hover:text-blue-600'
                          }`}
                      >
                        <div className="font-bold text-sm truncate">{user.name}</div>
                        <div className={`text-[10px] truncate ${selectedUserId === user.id ? 'text-blue-100' : 'text-gray-400'}`}>
                          {user.email}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">

            {/* Quick Stats Grid (Compact Icons, Bold Labels) */}
            {userAnalytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<CalendarIcon className="w-4 h-4" />} title="Today" value={userAnalytics.todayQty} color="blue" />
                <StatCard icon={<UsersIcon className="w-4 h-4" />} title="Monthly" value={userAnalytics.monthQty} color="purple" />
                <StatCard icon={<PackageCheckIcon className="w-4 h-4" />} title="Delivered" value={userAnalytics.deliveredQty} color="green" />
                <StatCard icon={<RotateCcwIcon className="w-4 h-4" />} title="Returned" value={userAnalytics.returnQty} color="red" />
              </div>
            )}

            {selectedUser && (
              <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/80 p-8 min-h-[500px]">
                {/* Refined Detail Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400 text-xl border border-gray-200">
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-gray-800 tracking-tight">{selectedUser.name}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-gray-400">{selectedUser.email}</span>
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          selectedUser.role === 'SUPER USER' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {selectedUser.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Records Found</p>
                     <p className="text-2xl font-black text-gray-800">{paymentDetails.length}</p>
                  </div>
                </div>

                {/* Table with refined glass container */}
                <div className="bg-white/40 p-1 rounded-3xl border border-white/40">
                  {selectedUserId && (
                    <PaymentDetailsTable
                      details={paymentDetails}
                      loading={paymentDetailsLoading}
                      userId={selectedUserId}
                      onRefresh={() => fetchPaymentDetails(selectedUserId)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        userId={selectedUserId || ''}
        userName={selectedUser?.name}
        deliveredQty={userAnalytics?.deliveredQty || 0}
      />
    </div>
  );
};

/* ===============================
   Modern Stat Card Component
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
  const accentColors: any = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
    green: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    red: 'text-rose-600 bg-rose-50 border-rose-100',
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-4 border border-white hover:bg-white/80 transition-all duration-300 group shadow-sm hover:shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-xl border transition-transform duration-500 group-hover:scale-110 ${accentColors[color]}`}>
          {icon}
        </div>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{title}</p>
      </div>
      <h3 className="text-2xl font-black text-gray-800 tracking-tight leading-none">{value}</h3>
    </div>
  );
};