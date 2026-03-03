import {
  DownloadIcon,
  HomeIcon,
  LogOutIcon,
  ProportionsIcon,
  ScaleIcon,
  SettingsIcon,
  StoreIcon,
  UsersIcon,
  ShoppingBagIcon,
  ChevronDownIcon,
  BarChart3Icon,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../service/auth';
import { logout } from '../../services/authUtils';

interface NavItem {
  icon: any;
  label: string;
  to?: string;
  isSettings?: boolean;
  children?: NavItem[];
}

const getNavItems = (userRole: string): NavItem[] => {
  // Normalize role string for comparison
  const normalized = (userRole || '').toUpperCase();

  // Check for specific roles
  const isSuperUser = 
    normalized === 'SUPER USER' || 
    normalized === 'SUPER_USER' || 
    normalized === 'SUPERUSER';
  const isAdmin = normalized === 'ADMIN';

  // Admin menu items
  const adminBaseItems: NavItem[] = [
    { icon: HomeIcon, label: 'Dashboard', to: '/' },
    { icon: ProportionsIcon, label: 'Product', to: '/product' },
    {
      icon: UsersIcon,
      label: 'Users',
      children: [
        { icon: UsersIcon, label: 'User List', to: '/users' },
        { icon: ShoppingBagIcon, label: 'User Orders', to: '/user-orders' },
        { icon: BarChart3Icon, label: 'Daily Report', to: '/daily-report' },
      ],
    },
    { icon: StoreIcon, label: 'Stock', to: '/stock' },
    { icon: SettingsIcon, label: 'Settings', to: '/sale/settings', isSettings: true },
  ];

  // Add Duplicate Orders only for SUPER USER
  const adminItems: NavItem[] = isSuperUser ? [
    { icon: HomeIcon, label: 'Dashboard', to: '/' },
    { icon: ScaleIcon, label: 'Duplicate Orders', to: '/sale/duplicate' },
    { icon: DownloadIcon, label: 'Export Orders', to: '/export-order' },
    { icon: ScaleIcon, label: 'Tracking ID', to: '/tracking-id' },
    { icon: ProportionsIcon, label: 'Product', to: '/product' },
    {
      icon: UsersIcon,
      label: 'Users',
      children: [
        { icon: UsersIcon, label: 'User List', to: '/users' },
        { icon: ShoppingBagIcon, label: 'User Orders', to: '/user-orders' },
        { icon: BarChart3Icon, label: 'Daily Report', to: '/daily-report' },
      ],
    },
    { icon: StoreIcon, label: 'Stock', to: '/stock' },
    { icon: SettingsIcon, label: 'Settings', to: '/sale/settings', isSettings: true },
  ] : adminBaseItems;

  // Regular users keep the existing, broader set
  const userItems: NavItem[] = [
    { icon: HomeIcon, label: 'Dashboard', to: '/' },
    { icon: ScaleIcon, label: 'Add New Order', to: '/sale' },
    { icon: ScaleIcon, label: 'Duplicate Orders', to: '/sale/duplicate' },
    { icon: SettingsIcon, label: 'Settings', to: '/sale/settings', isSettings: true },
  ];

  // Return admin menu if admin/superuser, otherwise return user menu
  return (isAdmin || isSuperUser) ? adminItems : userItems;
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  showSettings?: boolean;
  setShowSettings?: (show: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  showSettings,
  setShowSettings,
}) => {
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const location = useLocation();

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

  // Auto-expand parent items if a child is active
  useEffect(() => {
    const items = getNavItems(user?.role || 'USER');
    const newExpanded = new Set<string>();

    const checkActiveRoute = (item: NavItem, parentLabel?: string) => {
      if (item.to && location.pathname === item.to && parentLabel) {
        newExpanded.add(parentLabel);
      }
      if (item.children) {
        item.children.forEach((child) => checkActiveRoute(child, item.label));
      }
    };

    items.forEach((item) => checkActiveRoute(item));
    setExpandedItems(newExpanded);
  }, [location.pathname, user]);

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSettings?.(!showSettings);
  };

  const toggleExpand = (label: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  const renderNavItem = (item: NavItem) => {
    if (item.isSettings) {
      return (
        <button
          key={item.to}
          onClick={handleSettingsClick}
          className={`
            w-full flex items-center px-6 py-3 text-gray-700 font-semibold transition-all duration-300
            hover:bg-white hover:bg-opacity-50
            ${showSettings ? 'bg-white bg-opacity-50 text-blue-600' : ''}
          `}
        >
          <item.icon size={20} className="mr-3" />
          <span>{item.label}</span>
        </button>
      );
    }

    // If item has children, render expandable menu
    if (item.children && item.children.length > 0) {
      const isExpanded = expandedItems.has(item.label);

      return (
        <div key={item.label}>
          <button
            onClick={() => toggleExpand(item.label)}
            className={`
              w-full flex items-center justify-between px-6 py-3 text-gray-700 font-semibold transition-all duration-300
              hover:bg-white hover:bg-opacity-50
              ${isExpanded ? 'bg-white bg-opacity-30' : ''}
            `}
          >
            <div className="flex items-center">
              <item.icon size={20} className="mr-3" />
              <span>{item.label}</span>
            </div>
            <ChevronDownIcon
              size={18}
              className={`transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Sub-menu items */}
          {isExpanded && (
            <div className="bg-white bg-opacity-20 py-2">
              {item.children.map((child) => (
                <NavLink
                  key={child.to}
                  to={child.to || '#'}
                  end={child.to === '/'}
                  onClick={() => onClose()}
                  className={({ isActive }) => `
                    flex items-center pl-16 pr-6 py-2.5 text-gray-700 font-semibold transition-all duration-300
                    hover:bg-white hover:bg-opacity-40 text-sm
                    ${isActive ? 'bg-white bg-opacity-50 text-blue-600 font-bold' : ''}
                  `}
                >
                  <span>{child.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Simple nav item without children
    return (
      <NavLink
        key={item.to}
        to={item.to || '#'}
        end={item.to === '/'}
        onClick={() => onClose()}
        className={({ isActive }) => `
          flex items-center px-6 py-3 text-gray-700 font-semibold transition-all duration-300
          hover:bg-white hover:bg-opacity-50
          ${isActive ? 'bg-white bg-opacity-50 text-blue-600 font-bold' : ''}
        `}
      >
        <item.icon size={20} className="mr-3" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside
        className={`
          fixed md:static left-0 top-0 z-30
          md:w-64 md:bg-opacity-70 bg-white
          backdrop-filter backdrop-blur-lg 
          border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ height: '100vh', backgroundColor: 'cadetblue' }}
      >
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800 tracking-wide">
            {userLoading ? 'Loading...' : user ? user.role.toUpperCase() : 'USER'}
          </h1>
          <button
            onClick={onClose}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <nav className="mt-6">
          {getNavItems(user?.role || 'USER').map(renderNavItem)}
          <button
            className="w-full flex items-center px-6 py-3 text-gray-700 font-semibold transition-all duration-300 hover:bg-white hover:bg-opacity-50"
            onClick={logout}
          >
            <LogOutIcon size={20} className="mr-3" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
};
