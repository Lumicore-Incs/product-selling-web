import React, { useState, useEffect } from 'react';
import {
  SearchIcon,
  BellIcon,
  MenuIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  AlertTriangleIcon,
  XIcon,
  RefreshCcwDot
} from 'lucide-react';
import { getCurrentUser } from '../../service/auth';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { orderService } from '../../services/orders/orderService';

interface HeaderProps {
  onMenuClick: () => void;
  onSettingsClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const { notifications, removeNotification, addNotification } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);

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

  const handleRefreshStatus = async () => {
    try {
      setRefreshLoading(true);
      await orderService.updateTrackingStatus();
      addNotification('Tracking status updated successfully', 'success');
    } catch (err) {
      const message = (err as Error)?.message || 'Failed to update tracking status';
      addNotification(message, 'error');
      console.error('Refresh status failed:', err);
    } finally {
      setRefreshLoading(false);
    }
  };

  return (
      <header className="w-full bg-transparent sticky top-0 z-10">

      <div className="flex items-center justify-between gap-2 sm:gap-6 px-4 sm:px-8 py-5">

        {/* LEFT */}
        <div className="my-2 flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 bg-white bg-opacity-30 hover:bg-opacity-50 rounded-lg transition-all"
          >
            <MenuIcon size={20} className="text-gray-600" />
          </button>

          <div className="hidden sm:block flex-1 max-w-xs lg:max-w-sm">
            <div className="relative">
              <SearchIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0B818D]" />
              <input
                type="text"
                placeholder="Search here..."
                className="w-full pl-11 pr-4 py-2.5 bg-white shadow-sm border border-transparent text-[#0B818D] rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-200/50 text-sm placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4 sm:gap-5">

          {/* ✅ REFRESH ICON - CALLS CHECK STATUS API */}
          <button 
            onClick={handleRefreshStatus}
            disabled={refreshLoading}
            className={`w-[38px] h-[38px] flex items-center justify-center bg-white hover:bg-gray-50 border border-white/50 rounded-full shadow-sm transition-all flex-shrink-0 ${
              refreshLoading ? 'animate-spin' : ''
            }`}
          >
            <RefreshCcwDot size={18} className="text-[#0B818D]" />
          </button>

          {/* NOTIFICATIONS */}
          <div className="relative group">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-[38px] h-[38px] flex items-center justify-center bg-white hover:bg-gray-50 border border-white/50 rounded-full shadow-sm transition-all relative flex-shrink-0"
            >
              <BellIcon size={18} className={`text-[#0B818D] ${notifications.length > 0 ? 'animate-bounce' : ''}`} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {/* DROPDOWN */}
            <div
              className={`absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border p-4 z-50 max-h-96 overflow-y-auto ${
                showNotifications ? 'opacity-100 visible' : 'opacity-0 invisible'
              }`}
            >
              {notifications.length === 0 ? (
                <div className="text-center py-6">
                  <BellIcon size={30} className="mx-auto text-gray-300" />
                  <p className="text-gray-500 text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon =
                    notif.type === 'success' ? CheckCircleIcon :
                    notif.type === 'error' ? AlertCircleIcon :
                    notif.type === 'warning' ? AlertTriangleIcon :
                    InfoIcon;

                  return (
                    <div key={notif.id} className="flex gap-3 p-3 border rounded-lg mb-2">
                      <Icon size={20} />
                      <div className="flex-1">
                        <p className="text-sm">{notif.message}</p>
                        <p className="text-xs text-gray-400">
                          {notif.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <button onClick={() => removeNotification(notif.id)}>
                        <XIcon size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PROFILE */}
          <div className="flex items-center gap-3 border-l border-gray-200/50 pl-4">
            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-full overflow-hidden border border-white shadow-sm flex items-center justify-center flex-shrink-0"
            >
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&h=100&q=80" 
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </button>

            <div onClick={() => navigate('/profile')} className="hidden sm:block cursor-pointer">
              <p className="text-sm font-semibold text-gray-700 hover:text-[#0B818D] transition-colors">
                {userLoading ? 'Loading...' : user?.name || 'Piyumal'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};