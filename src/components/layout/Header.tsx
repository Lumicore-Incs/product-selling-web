import React, { useState, useEffect } from 'react';
import {
  SearchIcon,
  BellIcon,
  MenuIcon,
  User2Icon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  AlertTriangleIcon,
  XIcon,
  RefreshCcwDot,
  Settings 
} from 'lucide-react';
import { getCurrentUser } from '../../service/auth';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';
import { orderService } from '../../services/orders/orderService';

interface HeaderProps {
  onMenuClick: () => void;
  onSettingsClick?: () => void;
  headerColor?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onSettingsClick, headerColor = '#2a98a4' }) => {
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
      <header className="w-full bg-opacity-70 backdrop-filter backdrop-blur-lg border-b border-white sticky top-0 z-10">

      <div className="flex items-center justify-between gap-2 sm:gap-6 px-4 sm:px-8 py-5">

        {/* LEFT */}
        <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 bg-white bg-opacity-30 hover:bg-opacity-50 rounded-lg transition-all"
          >
            <MenuIcon size={20} className="text-gray-600" />
          </button>

          <div className="hidden sm:block flex-1 max-w-xs lg:max-w-sm">
            <div className="relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search here..."
                className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-80 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-300 text-sm"
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
            className={`p-2 bg-white bg-opacity-30 hover:bg-opacity-50 rounded-lg transition-all ${
              refreshLoading ? 'animate-spin' : ''
            }`}
          >
            <RefreshCcwDot size={18} className="text-gray-600" />
          </button>

          {/* NOTIFICATIONS */}
          <div className="relative group">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 bg-gray-100 bg-opacity-30 hover:bg-opacity-50 rounded-xl transition-all relative"
            >
              <BellIcon size={18} className={`text-green-600 ${notifications.length > 0 ? 'animate-bounce' : ''}`} />
              {notifications.length > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-xl flex items-center justify-center">
                  {notifications.length}
                </span>
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

          {/* SETTINGS - OPEN SETTINGS PANEL */}
          <button 
            onClick={onSettingsClick}
            className="p-2 bg-white bg-opacity-30 hover:bg-opacity-50 rounded-xl transition-all"
          >
            <Settings size={18} className="text-green-600" />
          </button>

          {/* PROFILE */}
          <div className="flex items-center gap-2 border-l pl-3">
            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-300 to-cyan-300 flex items-center justify-center"
            >
              <User2Icon size={18} className="text-white" />
            </button>

            <div onClick={() => navigate('/profile')} className="hidden sm:block cursor-pointer">
              <p className="text-sm font-bold">
                {userLoading ? 'Loading...' : user?.name || 'Piyumal'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};