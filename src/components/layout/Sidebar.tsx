import {
  BarChart3Icon,
  ChevronDownIcon,
  FileBarChart2Icon,
  HomeIcon,
  LogOutIcon,
  ProportionsIcon,
  ScaleIcon,
  SettingsIcon,
  ShoppingBagIcon,
  StoreIcon,
  UsersIcon,
  XIcon,
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
}

// 🔹 Navigation Items
const getNavItems = (userRole: string): NavItem[] => {
  const normalized = (userRole || '').toUpperCase();

  const isSuperUser =
    normalized === 'SUPER USER' ||
    normalized === 'SUPER_USER' ||
    normalized === 'SUPERUSER';

  const isAdmin = normalized === 'ADMIN';

  const mainMenuItems: NavItem[] = [
    { icon: HomeIcon, label: 'Dashboard', to: '/' },
    { icon: ProportionsIcon, label: 'Product', to: '/product' },
    {
      icon: UsersIcon,
      label: 'Users',
      children: [
        { icon: UsersIcon, label: 'User List', to: '/users' },
        { icon: ShoppingBagIcon, label: 'User Orders', to: '/user-orders' },
      ],
    },
    { icon: StoreIcon, label: 'Stock', to: '/stock' },
  ];

  const superUserItems: NavItem[] = isSuperUser
    ? [
      { icon: ScaleIcon, label: 'Duplicate Orders', to: '/sale/duplicate' },
      { icon: ScaleIcon, label: 'Tracking ID', to: '/tracking-id' },
    ]
    : [];

  const regularUserItems: NavItem[] =
    isSuperUser || isAdmin
      ? []
      : [
        { icon: ScaleIcon, label: 'Add New Order', to: '/sale' },
        { icon: ScaleIcon, label: 'Duplicate Orders', to: '/sale/duplicate' },
      ];

  return [
    ...mainMenuItems,
    ...(isAdmin || isSuperUser ? [] : regularUserItems),
    ...superUserItems,
  ];
};

// 🔹 Help & Settings
const getHelpSettingsItems = (): NavItem[] => [
  {
    icon: FileBarChart2Icon,
    label: 'Reports',
    children: [
      { icon: FileBarChart2Icon, label: 'Sales Summary', to: '/reports' },
      { icon: BarChart3Icon, label: 'Daily Report', to: '/daily-report' },
    ],
  },
  { icon: SettingsIcon, label: 'Settings', to: '/sale/settings', isSettings: true },
];

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
    const items = [...getNavItems(user?.role || ''), ...getHelpSettingsItems()];
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
          className="w-full flex items-center px-4 py-2.5 mx-6 rounded-lg border-b-2 border-transparent hover:border-b-2 hover:border-[#0E626E] transition"
          style={{color:'#0E626E', font:'plus-jakarta-sans'}}
        >
          <item.icon size={18} className="mr-3" />
          {item.label}
        </button>
      );
    }

    if (item.children) {
      const isExpanded = expandedItems.has(item.label);

      return (
        <div key={item.label} className="mx-6">
          <button
            onClick={() => toggleExpand(item.label)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border-b-2 border-transparent hover:border-b-2 hover:border-[#0E626E] transition"
            style={{color:'#0E626E', font:'plus-jakarta-sans'}}
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
            <div className="ml-4 border-l border-transparent border-[#0E626E] pl-2">
              {item.children.map((child) => (
                <NavLink
                  key={child.to}
                  to={child.to || '#'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm rounded-md border-b-2 border-transparent transition ${isActive
                      ? 'bg-teal-600 text-white'
                      : 'text-[#0E626E] hover:border-b-2 hover:border-[#0E626E]'
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
        className={({ isActive }) =>
          `flex items-center px-5 py-2.5 mx-6 rounded-lg border-b-2 border-transparent transition ${isActive
            ? 'bg-teal-600 text-white'
            : 'text-[#0E626E] hover:border-b-2 hover:border-[#0E626E]'
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
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:static z-30 w-64 border-r border-white transition ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } flex flex-col`}
        style={{ height: '100vh' }}
      >
        {/* 🔷 Header */}
        <div className="flex items-center justify-between p-5 border-b border-white">
          <div className="flex items-center gap-2">

            {/* 🔷 Logo Image */}
            <img
              src={new URL('../../assets/Logo.PNG', import.meta.url).href}
              alt="Logo"
              className="h-10 w-auto object-contain pl-8"
            />

          </div>

          <div className="flex gap-2">
            <button onClick={handleLogout}>
              <LogOutIcon size={18} style={{color:'#0E626E'}} />
            </button>
            <button onClick={onClose} className="md:hidden">
              <XIcon size={18} />
            </button>
          </div>
        </div>

        {/* 🔷 Content */}
        <div
          className="flex-1 overflow-y-auto" 
          style={{ scrollbarWidth: 'none', }}
        >
          <style>
            {`.flex-1::-webkit-scrollbar { display: none; }`}
          </style>

          {/* Main */}
          <div className="mt-4">
            <p className="px-4 pb-4 text-xs text-white">Main menu</p>
            {getNavItems(user?.role || '').map(renderNavItem)}
          </div>

          {/* Help */}
          <div className="mt-6 border-t border-white pt-4">
            <p className="px-4 text-xs text-white">Help & Settings</p>
            {getHelpSettingsItems().map(renderNavItem)}
          </div>
        </div>
      </aside>
    </>
  );
};