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
  Copy,
  BadgeDollarSign,
  PanelLeftClose
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
    items.push({
      icon: BadgeDollarSign,
      label: 'Orders',
      children: [
        { icon: Copy, label: 'Duplicate Orders', to: '/sale/duplicate' },
        { icon: ShoppingCartIcon, label: 'My Orders', to: '/my-orders' },
      ],
    });
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
    items.push({
      icon: BadgeDollarSign,
      label: 'Orders',
      children: [
        { icon: Copy, label: 'Duplicate Orders', to: '/sale/duplicate' },
        { icon: ShoppingCartIcon, label: 'My Orders', to: '/my-orders' },
      ],
    });
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
        { icon: FileBarChart2Icon, label: 'Monthly Report', to: '/monthly-report' },
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
          className="w-full flex items-center px-4 py-2 mx-6 rounded-md text-[#0B818D] hover:bg-[#0B818D]/10 hover:text-[#065f69] transition"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: 400, lineHeight: '16px' }}
        >
          <item.icon size={20} className="mr-3" />
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
            className="w-full flex items-center justify-between px-4 py-2 rounded-md text-[#0B818D] hover:bg-[#0B818D]/10 hover:text-[#065f69] transition"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: 400, lineHeight: '16px' }}
          >
            <div className="flex items-center">
              <item.icon size={20} className="mr-3" />
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
                    `block px-4 py-2 rounded-md transition ${
                      isActive
                        ? 'bg-[#0B818D] text-white'
                        : 'hover:bg-[#0B818D]/10 hover:text-[#065f69] text-[#0B818D]'
                    }`
                  }
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: 400, lineHeight: '16px' }}
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
          `flex items-center px-4 py-2 mx-6 rounded-md transition ${
            isActive
              ? 'bg-[#0B818D] text-white'
              : 'hover:bg-[#0B818D]/10 hover:text-[#065f69] text-[#0B818D]'
          }`
        }
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: 400, lineHeight: '16px' }}
      >
        <item.icon size={20} className="mr-3" />
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
        className={`fixed md:static z-30 w-64 transition overflow-x-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } flex flex-col`}
        style={{
          height: '100vh',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          background: 'rgba(200, 235, 238, 0.55)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(11,129,141,0.12)',
        }}
      >
        {/* 🔹 Header */}
        <div className="flex items-center justify-between p-5 pt-8 pl-8">
          <div className="flex items-center justify-between gap-2 w-full pr-4">
            <div className="relative w-[150px] h-[50px] overflow-hidden flex-shrink-0">
              <img
                src={new URL('../../assets/Logo.PNG', import.meta.url).href}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{ height: '160px', maxWidth: 'none' }}
                alt="Logo"
              />
            </div>
            <div
              className="flex items-center justify-center cursor-pointer hover:bg-[#0B818D]/10 transition"
              style={{
                width: 44,
                height: 44,
                border: '2.5px solid #5aabb5',
                borderRadius: '14px',
              }}
            >
              <PanelLeftClose size={22} className="text-[#5aabb5]" />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="md:hidden">
              <XIcon size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* 🔹 Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mt-4">
            <h3
              className="pl-6 mb-3 text-[#0B818D]"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 400,
                fontSize: '13px',
                lineHeight: '16px',
              }}
            >
              Main menu
            </h3>

            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
              {getNavItems(user?.role || '').map(renderNavItem)}
            </div>
          </div>

          {/* 🔹 Help & Settings Section */}
          <div className="pb-6">
            <h3
              className="pl-6 mb-3 text-[#0B818D]"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 400,
                fontSize: '13px',
                lineHeight: '16px',
              }}
            >
              Help & Settings
            </h3>
            {getHelpSettingsItems(user?.role || '').map(renderNavItem)}
          </div>
        </div>
      </aside>
    </>
  );
};