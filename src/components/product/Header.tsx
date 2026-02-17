import { PlusIcon, SearchIcon } from 'lucide-react';
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
    <header className="bg-white shadow sticky top-0 z-10">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Product Management</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch">
            <div className="relative flex-1 sm:flex-none">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-56 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={onAddClick}
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <PlusIcon className="h-4 sm:h-5 w-4 sm:w-5" />
              <span>Add</span>
            </button>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 text-sm sm:text-base rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
