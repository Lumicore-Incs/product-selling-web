import { PlusIcon, SearchIcon } from 'lucide-react';
interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function Header({
  onAddClick,
}: Readonly<HeaderProps>) {
  return (
    <header className="top-0 z-10 mb-6">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between">
          <h1 className="text-lg sm:text-2xl font-bold font-plus-jakarta-sans"  style={{ color: '#0E626E' }}>Product Management</h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 sm:flex-none">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-teal-600 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search..."
                className="w-full sm:w-[250px] bg-white rounded-full pl-10 pr-4 py-2 text-xs sm:text-sm text-[#0E626E] placeholder-[#0E626E]/60 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={onAddClick}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-2 text-white text-xs sm:text-sm rounded-lg font-medium whitespace-nowrap transition-opacity hover:opacity-90 bg-[#0E626E]"
              >
                <PlusIcon className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
