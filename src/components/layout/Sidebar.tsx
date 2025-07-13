import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { HomeIcon, UsersIcon, SettingsIcon, LogOutIcon, StoreIcon, ProportionsIcon, ScaleIcon } from "lucide-react";
import { getCurrentUser } from '../../service/auth';
import { authUtils } from '../../services/api';

const getNavItems = (userRole: string) => {
  const allNavItems = [
    {
      icon: HomeIcon,
      label: "Dashboard",
      to: "/dashboard",
    },
    {
      icon: ScaleIcon,
      label: "Sales Management",
      to: "/sale",
    },
    {
      icon: ProportionsIcon,
      label: "Product",
      to: "/product",
      adminOnly: true,
    },
    {
      icon: UsersIcon,
      label: "Users",
      to: "/users",
      adminOnly: true,
    },
    {
      icon: StoreIcon,
      label: "stock",
      to: "/stock",
      adminOnly: true,
    },
    {
      icon: SettingsIcon,
      label: "Settings",
      to: "/sale/settings",
      isSettings: true,
    },
  ];

  // Filter out admin-only items for regular users
  return allNavItems.filter(item => !item.adminOnly || userRole === 'ADMIN');
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
  setShowSettings 
}) => {
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [userLoading, setUserLoading] = useState(true);
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

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSettings?.(!showSettings);
  };

  const renderNavItem = (item: any) => {
    if (item.isSettings) {
      return (
        <button
          key={item.to}
          onClick={handleSettingsClick}
          className={`
            w-full flex items-center px-6 py-3 text-gray-700 transition-all duration-300
            hover:bg-white hover:bg-opacity-50
            ${showSettings ? "bg-white bg-opacity-50 text-blue-600" : ""}
          `}
        >
          <item.icon size={20} className="mr-3" />
          <span>{item.label}</span>
        </button>
      );
    }

    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.to === "/"}
        onClick={() => onClose()}
        className={({ isActive }) => `
          flex items-center px-6 py-3 text-gray-700 transition-all duration-300
          hover:bg-white hover:bg-opacity-50
          ${isActive ? "bg-white bg-opacity-50 text-blue-600" : ""}
        `}
      >
        <item.icon size={20} className="mr-3" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <>
      <aside
        className={`
          fixed md:static left-0 top-0 z-30
          w-64 bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg 
          border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0"  : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
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
          {getNavItems(user?.role || 'USER' ).map(renderNavItem)}
          <button className="w-full flex items-center px-6 py-3 text-gray-700 transition-all duration-300 hover:bg-white hover:bg-opacity-50" onClick={authUtils.logout}>
            <LogOutIcon size={20} className="mr-3" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
};
