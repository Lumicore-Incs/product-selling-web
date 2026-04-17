import { PlusIcon, SearchIcon, RefreshCwIcon } from 'lucide-react';
interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}
export function Header({
  searchTerm,
  onSearchChange,
  onAddClick,
  onRefresh,
  loading,
}: Readonly<HeaderProps>) {
  return (
    <header className="top-0 z-10 mb-6">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-bold font-plus-jakarta-sans"  style={{ color: '#0E626E' }}>Product Management</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search products..."
                className="w-full sm:w-60 bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={onAddClick}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 text-white text-xs sm:text-sm rounded-lg font-medium whitespace-nowrap transition-opacity hover:opacity-90"
               style={{ backgroundColor: '#0E626E' }}
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add</span>
              </button>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 text-xs sm:text-sm rounded-lg font-medium hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{loading ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
