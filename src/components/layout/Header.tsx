import React from 'react';
import { SearchIcon, BellIcon, MenuIcon } from 'lucide-react';
interface HeaderProps {
  onMenuClick: () => void;
}
export const Header: React.FC<HeaderProps> = ({
  onMenuClick
}) => {
  return <header className="bg-white bg-opacity-70 backdrop-filter backdrop-blur-lg border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button onClick={onMenuClick} className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MenuIcon size={24} className="text-gray-600" />
          </button>
          <div className="flex-1 max-w-md">
            <div className="relative">
              <SearchIcon size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search..." className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent" />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-300">
            <BellIcon size={20} className="text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            <div className="hidden sm:block text-sm font-medium text-gray-700">
              Admin User
            </div>
          </div>
        </div>
      </div>
    </header>;
};