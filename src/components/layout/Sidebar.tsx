import React from "react";
import { NavLink } from "react-router-dom";
import { HomeIcon, UsersIcon, SettingsIcon, LogOutIcon } from "lucide-react";
const navItems = [
  {
    icon: HomeIcon,
    label: "Dashboard",
    to: "/dashboard",
  },
   {
    icon: SettingsIcon,
    label: "Sale",
    to: "/sale",
  },
  {
    icon: UsersIcon,
    label: "Users",
    to: "/users",
  },
  {
    icon: SettingsIcon,
    label: "stock",
    to: "/stock",
  },
];
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      <aside
        className={`
          fixed md:static left-0 top-0 z-30
          w-64 bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg 
          border-r border-gray-200 transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Admin</h1>
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
          {navItems.map((item) => (
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
          ))}
          <button className="w-full flex items-center px-6 py-3 text-gray-700 transition-all duration-300 hover:bg-white hover:bg-opacity-50">
            <LogOutIcon size={20} className="mr-3" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>
    </>
  );
};
