import { useEffect, useState } from 'react';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { getCurrentUser } from '../service/auth';
import { getUserAnalytics, UserAnalytics } from '../services/orders/orderService';
import { userService } from '../services/users/userService';
import {
  UsersIcon,
  RotateCcwIcon,
  CalendarIcon,
  PlusIcon,
  Search,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
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
  const [_loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetail[]>([]);
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  
  // Search state for User Directory
  const [dirSearch, setDirSearch] = useState('');

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

  // Filter user directory based on search input
  const filteredDirectoryUsers = usersWithOrders
    .filter(user => user.role !== 'ADMIN')
    .filter(user => {
      if (!dirSearch.trim()) return true;
      const term = dirSearch.toLowerCase();
      return user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
    });

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER USER')) {
    return (
      <div className="p-10 text-center text-red-500 text-xl font-bold">
        Access Denied
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-transparent p-4 lg:p-6 overflow-hidden font-sans">
      {/* Figma background glowing ellipses */}
      <div className="absolute w-[543px] h-[582px] left-[1003px] top-[-137px] bg-[#7100BD] opacity-[0.12] rounded-full pointer-events-none" style={{ filter: 'blur(323.5px)' }} />
      <div className="absolute w-[386px] h-[328px] left-[492px] top-[606px] bg-[#7100BD] opacity-[0.12] rounded-full pointer-events-none" style={{ filter: 'blur(323.5px)' }} />
      <div className="absolute w-[677px] h-[726px] left-[835px] top-[407px] bg-[#0B818D] opacity-[0.12] rounded-full pointer-events-none" style={{ filter: 'blur(323.5px)' }} />
      <div className="absolute w-[677px] h-[726px] left-[-185px] top-[-42px] bg-[#0B818D] opacity-[0.12] rounded-full pointer-events-none" style={{ filter: 'blur(323.5px)' }} />

      <BackgroundIcons />

      <div className="relative max-w-7xl mx-auto z-10 space-y-6">
        {/* Modern Compact Header (Frame 40) */}
        <div 
          className="relative flex flex-col md:flex-row md:items-center justify-between min-h-[96px] md:h-[96px] p-6 md:p-0 md:px-8 rounded-[35px] border border-white/80 shadow-[0_0_31px_rgba(255,255,255,0.25)] bg-white/40 backdrop-blur-xl gap-4 md:gap-0"
        >
          {/* ChatGPT Image Apr 24, 2026, 01_10_57 AM 1 */}
          <div className="hidden md:block absolute left-[38px] top-[-22px] w-[128px] h-[105px]">
            <img 
              src={new URL('../assets/dashboard_analytics.png', import.meta.url).href} 
              alt="Analytics Illustration" 
              className="w-[128px] h-[105px] object-contain"
            />
          </div>

          {/* Heading Text Group */}
          <div className="md:pl-[159px] flex flex-col justify-center">
            <h1 className="text-[28px] font-extrabold leading-[35px] bg-gradient-to-r from-[#004D55] to-[#16A1AF] bg-clip-text text-transparent font-['Plus_Jakarta_Sans']">
              Analytics Dashboard
            </h1>
            <p className="text-[14px] font-bold text-[#868686] font-['Plus_Jakarta_Sans'] mt-1">
              Real-time user performance metrics
            </p>
          </div>

          {/* Add Settlement Button */}
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="w-[151px] h-[42px] bg-[#0B818D] hover:bg-[#096B75] text-white rounded-[10px] font-medium flex items-center justify-center flex-shrink-0 transition-all shadow-md font-['Inter'] text-[16px] leading-[19px]"
          >
            + Add settlement
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* User List Sidebar (Frame 41) */}
          <div className="lg:col-span-1 flex flex-col gap-4 lg:w-[296px] w-full flex-shrink-0">
            <div className="bg-white/40 backdrop-blur-xl rounded-[35px] shadow-[0_0_27px_rgba(0,0,0,0.06)] p-6 border border-white/60 min-h-[478px]">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-[20px] font-semibold text-[#000000] font-['Inter']">User Directory</h2>
                <div className="w-6 h-6 flex items-center justify-center text-black">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                </div>
              </div>

              {/* Directory Search (Frame 43) */}
              <div className="relative mb-4 w-full h-[25px] rounded-[17px] bg-[#FFFFFF]/93">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9298A4] w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search here..."
                  value={dirSearch}
                  onChange={(e) => setDirSearch(e.target.value)}
                  className="w-full h-full pl-[38px] pr-4 border-none rounded-[17px] focus:outline-none focus:ring-1 focus:ring-[#0B818D] text-[10px] font-['Inter'] text-[#374151] placeholder-[#BEBEBE]"
                />
              </div>

              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                {filteredDirectoryUsers.map(user => {
                  const isSelected = selectedUserId === user.id;
                  return (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`flex items-center gap-3 px-3 h-[50px] rounded-[8px] cursor-pointer transition-all duration-300 flex-shrink-0 ${
                        isSelected 
                          ? 'bg-[#0B818D] text-white shadow-md' 
                          : 'bg-transparent hover:bg-white/30'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-[33px] h-[33px] bg-white rounded-[20px] flex items-center justify-center flex-shrink-0 border border-gray-100/30 overflow-hidden">
                        <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id={`starGrad-${user.id}`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                              <stop offset="0%" stopColor="#1EC8B0" />
                              <stop offset="100%" stopColor="#2764E7" />
                            </linearGradient>
                            <linearGradient id={`pinkOverlay-${user.id}`} x1="0" y1="32" x2="32" y2="0" gradientUnits="userSpaceOnUse">
                              <stop offset="0%" stopColor="rgba(255, 108, 232, 0.7)" />
                              <stop offset="100%" stopColor="rgba(255, 108, 232, 0)" />
                            </linearGradient>
                          </defs>
                          <path d="M16 1.5a3 3 0 0 1 2.8 1.9l.5 1.5a3 3 0 0 0 1.8 1.8l1.5.5a3 3 0 0 1 1.9 2.8l-.2 1.6a3 3 0 0 0 .9 2.4l1.2 1.1a3 3 0 0 1 0 4.1l-1.2 1.1a3 3 0 0 0-.9 2.4l.2 1.6a3 3 0 0 1-1.9 2.8l-1.5.5a3 3 0 0 0-1.8 1.8l-.5 1.5a3 3 0 0 1-2.8 1.9a3 3 0 0 1-2.8-1.9l-.5-1.5a3 3 0 0 0-1.8-1.8l-1.5-.5a3 3 0 0 1-1.9-2.8l.2-1.6a3 3 0 0 0-.9-2.4l-1.2-1.1a3 3 0 0 1 0-4.1l1.2-1.1a3 3 0 0 0 .9-2.4l-.2-1.6a3 3 0 0 1 1.9-2.8l1.5.5a3 3 0 0 0 1.8-1.8l.5-1.5A3 3 0 0 1 16 1.5z" fill={`url(#starGrad-${user.id})`}/>
                          <path d="M16 1.5a3 3 0 0 1 2.8 1.9l.5 1.5a3 3 0 0 0 1.8 1.8l1.5.5a3 3 0 0 1 1.9 2.8l-.2 1.6a3 3 0 0 0 .9 2.4l1.2 1.1a3 3 0 0 1 0 4.1l-1.2 1.1a3 3 0 0 0-.9 2.4l.2 1.6a3 3 0 0 1-1.9 2.8l-1.5.5a3 3 0 0 0-1.8 1.8l-.5 1.5a3 3 0 0 1-2.8 1.9a3 3 0 0 1-2.8-1.9l-.5-1.5a3 3 0 0 0-1.8-1.8l-1.5-.5a3 3 0 0 1-1.9-2.8l.2-1.6a3 3 0 0 0-.9-2.4l-1.2-1.1a3 3 0 0 1 0-4.1l1.2-1.1a3 3 0 0 0 .9-2.4l-.2-1.6a3 3 0 0 1 1.9-2.8l1.5-.5a3 3 0 0 0 1.8-1.8l.5-1.5A3 3 0 0 1 16 1.5z" fill={`url(#pinkOverlay-${user.id})`}/>
                          <circle cx="16" cy="11.5" r="4.25" fill="#FFFFFF"/>
                          <path d="M9.5 21.5c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6H9.5z" fill="#FFFFFF"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[12px] font-medium truncate font-['Inter'] ${isSelected ? 'text-white' : 'text-[#3B3B3B]'}`}>{user.name}</div>
                        <div className={`text-[10px] truncate font-['Inter'] mt-[2px] ${isSelected ? 'text-[#EBEBEB]' : 'text-[#727272]'}`}>{user.email}</div>
                      </div>
                      {isSelected && (
                        <div className="w-[40px] h-[12px] bg-[#C5FAFF]/86 border-[0.25px] border-[#00353B] rounded-[5px] text-[#00353B] text-[7px] font-['Inter'] font-normal flex items-center justify-center flex-shrink-0">
                          Verified
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredDirectoryUsers.length === 0 && (
                  <div className="text-center py-8 text-xs text-gray-500 font-['Inter']">No users found</div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Stats Grid */}
            {userAnalytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                  title="Today Orders" 
                  value={userAnalytics.todayQty} 
                  titleColor="#540863" 
                  valueColor="#540863" 
                  bgColor="rgba(255, 255, 255, 0.35)" 
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  } 
                />
                <StatCard 
                  title="Monthly Revenue" 
                  value={userAnalytics.monthQty} 
                  titleColor="#D06027" 
                  valueColor="#B23D03" 
                  bgColor="rgba(255, 255, 255, 0.35)" 
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  } 
                />
                <StatCard 
                  title="Total Delivered" 
                  value={userAnalytics.deliveredQty} 
                  titleColor="#016D18" 
                  valueColor="#016D18" 
                  bgColor="rgba(255, 255, 255, 0.35)" 
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  } 
                />
                <StatCard 
                  title="Total Returned" 
                  value={userAnalytics.returnQty} 
                  titleColor="#E0090C" 
                  valueColor="#920002" 
                  bgColor="rgba(255, 255, 255, 0.35)" 
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><polyline points="3 3 3 8 8 8"/></svg>
                  } 
                />
              </div>
            )}

            {selectedUser && (
              <div className="bg-white/40 backdrop-blur-xl rounded-[21px] shadow-[0_0_14px_rgba(0,0,0,0.07)] p-7 border border-white/60">
                {/* Refined Detail Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <img 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=60" 
                      alt={selectedUser.name} 
                      className="w-20 h-20 rounded-[64px] border-2 border-white shadow-sm object-cover" 
                    />
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-[24px] font-bold text-black leading-[29px] font-['Inter']">{selectedUser.name}</h2>
                        <div className="flex items-center gap-1 w-[77px] h-[18px] border border-[#0B818D] bg-[#7abcC3]/32 rounded-[14px] flex-shrink-0 justify-center">
                          <ShieldCheck className="w-3 h-3 text-[#0B818D]" />
                          <span className="text-[8px] font-normal text-[#0B818D] leading-[10px] font-['Inter']">Verified User</span>
                        </div>
                      </div>
                      <p className="text-[18px] font-medium text-[#616161] leading-[22px] mt-1 font-['Inter']">{selectedUser.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-start sm:items-end">
                     <p className="text-[15px] font-semibold text-[#5C626E] font-['Inter'] leading-[18px]">Total records found</p>
                     <p className="text-[22px] font-semibold text-[#5C626E] mt-[8px] font-['Inter'] leading-[27px]">{paymentDetails.length}</p>
                  </div>
                </div>

                {/* Table with refined glass container */}
                <div className="bg-white/40 rounded-[21px] p-1 border border-white/40 overflow-hidden">
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
  titleColor,
  valueColor,
  bgColor,
}: {
  icon: any;
  title: string;
  value: any;
  titleColor: string;
  valueColor: string;
  bgColor: string;
}) => {
  return (
    <div 
      className="p-[18px] rounded-[21px] flex flex-col justify-between h-[93px] md:h-[95px] border border-white/40 shadow-sm relative overflow-hidden backdrop-blur-md transition-all duration-300 hover:scale-[1.02] w-full md:w-[188px] flex-shrink-0"
      style={{ background: bgColor }}
    >
      <div>
        <p className="text-[18px] font-bold leading-none font-['Inter']" style={{ color: titleColor }}>{title}</p>
      </div>
      <div className="flex items-end justify-between mt-2">
        <h3 className="text-[26px] font-bold leading-none font-['Inter']" style={{ color: valueColor }}>{value}</h3>
        <div 
          className="w-[33px] h-[33px] bg-white rounded-[9px] flex items-center justify-center shadow-sm text-center flex-shrink-0"
          style={{ color: titleColor }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};