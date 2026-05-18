import {
  BarChart3Icon,
  ChevronDownIcon,
  FileBarChart2Icon,
  HomeIcon,
  LogOutIcon,
  PackageIcon,
  SettingsIcon,
  ShoppingCartIcon,
  StoreIcon,
  UsersIcon,
  TruckIcon,
  ClipboardListIcon,
  XIcon,
  Copy
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../service/auth';
import { logout } from '../../services/authUtils';

interface NavItem {
  icon: any;
  label: string;
  to?: string;
  isSettings?: boolean;
  children?: NavItem[];
  end?: boolean;
}

// 🔹 Navigation Items
const getNavItems = (userRole: string): NavItem[] => {
  const normalized = (userRole || '').toUpperCase();

  const isSuperUser =
    normalized === 'SUPER USER' ||
    normalized === 'SUPER_USER' ||
    normalized === 'SUPERUSER';

  const isAdmin = normalized === 'ADMIN';
  const isUser = normalized === 'USER';

  const items: NavItem[] = [];

  // DASHBOARD - All roles
  items.push({ icon: HomeIcon, label: 'Dashboard', to: '/', end: true });

  // USER Specific items
  if (isUser) {
    items.push({ icon: ClipboardListIcon, label: 'Add New Order', to: '/sale', end: true });
    items.push({ icon: Copy, label: 'Duplicate Orders', to: '/sale/duplicate' });
  }

  // SUPER USER Specific items
  if (isSuperUser) {
    items.push({ icon: ClipboardListIcon, label: 'Export Orders', to: '/export-orders' });
    items.push({ icon: TruckIcon, label: 'Tracking ID', to: '/tracking-id' });
  }

  // USERS category - Super User and Admin
  if (isSuperUser || isAdmin) {
    items.push({
      icon: UsersIcon,
      label: 'Users',
      children: [
        { icon: UsersIcon, label: 'User List', to: '/users' },
        { icon: ShoppingCartIcon, label: 'User Orders', to: '/user-orders' },
      ],
    });
  }

  // PRODUCT - Super User only
  if (isSuperUser) {
    items.push({ icon: PackageIcon, label: 'Product', to: '/product' });
  }

  // STOCK - Super User and Admin
  if (isSuperUser || isAdmin) {
    items.push({ icon: StoreIcon, label: 'Stock', to: '/stock' });
  }

  // DUPLICATE ORDERS - Super User and Admin (User already added above)
  if (isSuperUser || isAdmin) {
    items.push({ icon: Copy, label: 'Duplicate Orders', to: '/sale/duplicate' });
  }

  return items;
};

// 🔹 Help & Settings
const getHelpSettingsItems = (userRole: string): NavItem[] => {
  const normalized = (userRole || '').toUpperCase();

  const isSuperUser =
    normalized === 'SUPER USER' ||
    normalized === 'SUPER_USER' ||
    normalized === 'SUPERUSER';
  const isAdmin = normalized === 'ADMIN';
  const isUser = normalized === 'USER';

  const items: NavItem[] = [];

  // REPORTS - Super User and Admin
  if (isSuperUser || isAdmin) {
    items.push({
      icon: FileBarChart2Icon,
      label: 'Reports',
      children: [
        { icon: FileBarChart2Icon, label: 'Sales Summary', to: '/reports' },
        { icon: BarChart3Icon, label: 'Daily Report', to: '/daily-report' },
      ],
    });
  }

  // SETTINGS - All roles
  items.push({ icon: SettingsIcon, label: 'Settings', to: '/sale/settings', isSettings: true });

  return items;
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch {
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  // 🔹 Auto expand active menu
  useEffect(() => {
    const items = [...getNavItems(user?.role || ''), ...getHelpSettingsItems(user?.role || '')];
    const expanded = new Set<string>();

    const check = (item: NavItem, parent?: string) => {
      if (item.to && location.pathname === item.to && parent) {
        expanded.add(parent);
      }
      item.children?.forEach((c) => check(c, item.label));
    };

    items.forEach((i) => check(i));
    setExpandedItems(expanded);
  }, [location.pathname, user]);

  const toggleExpand = (label: string) => {
    const newSet = new Set(expandedItems);
    newSet.has(label) ? newSet.delete(label) : newSet.add(label);
    setExpandedItems(newSet);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSettings?.(!showSettings);
  };

  // 🔹 Render Items
  const renderNavItem = (item: NavItem) => {
    if (item.isSettings) {
      return (
        <button
          key={item.to}
          onClick={handleSettingsClick}
          className="w-full flex items-center px-4 py-2.5 mx-6 rounded-lg text-[#0B818D] hover:bg-[#0B818D]/20 hover:text-white transition"
        >
          <item.icon size={18} className="mr-3" />
          {item.label}
        </button>
      );
    }

    if (item.children) {
      const isExpanded = expandedItems.has(item.label);

      return (
        <div key={item.label} className="mx-6 ">
          <button
            onClick={() => toggleExpand(item.label)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-[#0B818D] hover:bg-[#0B818D]/20 hover:text-white transition"
          >
            <div className="flex items-center">
              <item.icon size={18} className="mr-3" />
              {item.label}
            </div>
            <ChevronDownIcon
              size={16}
              className={`transition ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {isExpanded && (
            <div className="ml-4 pl-2">
              {item.children.map((child) => (
                <NavLink
                  key={child.to}
                  to={child.to || '#'}
                  onClick={onClose}
                  end={child.end}
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm rounded-md transition ${
                      isActive
                        ? 'bg-[#16a34a]/30 text-white'
                        : 'hover:bg-[#16a34a]/20 hover:text-white text-[#0B818D] '
                    }`
                  }
                >
                  {child.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.to}
        to={item.to || '#'}
        onClick={onClose}
        end={item.end}
        className={({ isActive }) =>
          `flex items-center px-5 py-2.5 mx-6 rounded-lg transition ${
            isActive
              ? 'bg-[#0B818D] text-white'
              : 'hover:bg-[#0B818D]/20 hover:text-white text-[#0B818D] '
          }`
        }
      >
        <item.icon size={18} className="mr-3" />
        {item.label}
      </NavLink>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static z-30 w-64 border-r bg-black md:bg-transparent transition overflow-x-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } flex flex-col`}
        style={{ height: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {/* 🔹 Header */}
        <div className="flex items-center justify-between p-5">
          <img
            src={new URL('../../assets/Logo.PNG', import.meta.url).href}
            className="h-10 pl-8"
          />

          <div className="flex gap-2">
            <button onClick={handleLogout}>
              <LogOutIcon size={18} className="text-[#16a34a]" />
            </button>
            <button onClick={onClose} className="md:hidden">
              <XIcon size={18}  className="text-[#16a34a]" />
            </button>
          </div>
        </div>

        {/* 🔹 Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mt-4">
            <p className="px-4 pb-4 text-s text-[#0B818D]">Main menu</p>
            {getNavItems(user?.role || '').map(renderNavItem)}
          </div>

          <div className="mt-6 pt-4">
            <p className="px-4 pb-4 text-s text-[#0B818D]">Help & Settings</p>
            {getHelpSettingsItems(user?.role || '').map(renderNavItem)}
          </div>
        </div>
      </aside>
    </>
  );
};