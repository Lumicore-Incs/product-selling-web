import {
  ChevronDownIcon,
  UsersIcon,
  XIcon,
  Copy,
  LayoutGrid,
  FileUp,
  MapPin,
  Package,
  Layers,
  Settings,
  BarChart3,
  PanelLeftClose
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../../service/auth';

interface NavItem {
  icon?: any;
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
  items.push({ icon: LayoutGrid, label: 'Dashboard', to: '/', end: true });

  // USER Specific items
  if (isUser) {
    items.push({ icon: FileUp, label: 'Add New Order', to: '/sale', end: true });
    items.push({ icon: Copy, label: 'Duplicate Orders', to: '/sale/duplicate' });
  }

  // SUPER USER Specific items
  if (isSuperUser) {
    items.push({ icon: FileUp, label: 'Export orders', to: '/export-orders' });
    items.push({ icon: MapPin, label: 'Tracking Id', to: '/tracking-id' });
  }

  // PRODUCT - Super User only
  if (isSuperUser) {
    items.push({ icon: Package, label: 'Product', to: '/product' });
  }

  // USERS category - Super User and Admin
  if (isSuperUser || isAdmin) {
    items.push({
      icon: UsersIcon,
      label: 'Users',
      children: [
        { label: 'User List', to: '/users' },
        { label: 'User orders', to: '/user-orders' },
      ],
    });
  }

  // STOCK - Super User and Admin
  if (isSuperUser || isAdmin) {
    items.push({ icon: Layers, label: 'Stock', to: '/stock' });
  }

  // DUPLICATE ORDERS - Super User and Admin (User already added above)
  if (isSuperUser || isAdmin) {
    items.push({ icon: Copy, label: 'Duplicate orders', to: '/sale/duplicate' });
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

  const items: NavItem[] = [];

  // SETTINGS - All roles
  items.push({ icon: Settings, label: 'Settings', to: '/sale/settings', isSettings: true });

  // REPORTS - Super User and Admin
  if (isSuperUser || isAdmin) {
    items.push({
      icon: BarChart3,
      label: 'Reports',
      children: [
        { label: 'Monthly Report', to: '/monthly-report' },
        { label: 'Sales Summary', to: '/reports' },
        { label: 'Daily Report', to: '/daily-report' },
      ],
    });
  }

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
          className="w-full flex items-center px-4 py-2.5 mx-4 my-0.5 rounded-xl text-[#0B818D] hover:bg-[#0B818D]/10 hover:text-[#0B818D] transition text-left"
        >
          <item.icon size={18} className="mr-3" />
          <span className="text-[14px] font-medium">{item.label}</span>
        </button>
      );
    }

    if (item.children) {
      const isExpanded = expandedItems.has(item.label);
      const isChildActive = item.children.some(child => location.pathname === child.to);

      return (
        <div key={item.label} className="w-full">
          <button
            onClick={() => toggleExpand(item.label)}
            className={`w-full flex items-center justify-between px-4 py-2.5 mx-4 my-0.5 rounded-xl transition text-left ${
              isChildActive && !isExpanded
                ? 'bg-[#0B818D] text-white shadow-sm'
                : 'text-[#0B818D] hover:bg-[#0B818D]/10'
            }`}
            style={{ width: 'calc(100% - 32px)' }}
          >
            <div className="flex items-center">
              <item.icon size={18} className="mr-3" />
              <span className="text-[14px] font-medium">{item.label}</span>
            </div>
            <ChevronDownIcon
              size={16}
              className={`transition ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {isExpanded && (
            <div className="mt-1 space-y-1 mx-4" style={{ width: 'calc(100% - 32px)' }}>
              {item.children.map((child) => (
                <NavLink
                  key={child.to}
                  to={child.to || '#'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `block px-4 py-2 pl-11 text-[14px] font-medium rounded-xl transition ${
                      isActive
                        ? 'bg-[#0B818D] text-white shadow-sm'
                        : 'text-[#0B818D] hover:bg-[#0B818D]/15'
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
          `flex items-center px-4 py-2.5 mx-4 my-0.5 rounded-xl font-medium transition ${
            isActive
              ? 'bg-[#0B818D] text-white shadow-sm'
              : 'text-[#0B818D] hover:bg-[#0B818D]/10 hover:text-[#0B818D]'
          }`
        }
        style={{ width: 'calc(100% - 32px)' }}
      >
        <item.icon size={18} className="mr-3" />
        <span className="text-[14px]">{item.label}</span>
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
        className={`fixed md:static z-30 w-64 border-r transition overflow-x-hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } flex flex-col`}
        style={{
          height: '100vh',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          backgroundColor: '#E1F0F3',
          borderColor: '#FFFFFF',
        }}
      >
        {/* 🔹 Header */}
        <div className="flex items-center justify-between p-5 pt-8 mb-6">
          <div className="pl-4 w-[140px]">
            <img
              src={new URL('../../assets/Logo.PNG', import.meta.url).href}
              className="w-full h-auto max-h-10 object-contain"
              alt="Logo"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 bg-[#D2EBEF] hover:bg-[#c0e0e5] rounded-lg text-[#0B818D] transition md:hidden"
              title="Close Menu"
            >
              <XIcon size={18} />
            </button>
            <button
              className="p-1.5 bg-[#D2EBEF] hover:bg-[#c0e0e5] rounded-lg text-[#0B818D] transition hidden md:block"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>
        </div>

        {/* 🔹 Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-6 pb-6 scrollbar-hide">
          <div>
            <p className="px-8 pb-2 text-[12px] font-semibold uppercase tracking-wider text-[#0B818D]/60 font-['Inter']">Main menu</p>
            <div className="space-y-0.5">
              {getNavItems(user?.role || '').map(renderNavItem)}
            </div>
          </div>

          <div>
            <p className="px-8 pb-2 text-[12px] font-semibold uppercase tracking-wider text-[#0B818D]/60 font-['Inter']">Help & Settings</p>
            <div className="space-y-0.5">
              {getHelpSettingsItems(user?.role || '').map(renderNavItem)}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};