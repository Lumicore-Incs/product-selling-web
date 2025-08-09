import { PlusIcon, SearchIcon } from 'lucide-react';
interface HeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}
export function Header({
  searchTerm,
  onSearchChange,
  onAddClick
}: Readonly<HeaderProps>) {
  return <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Product Management
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input type="text" value={searchTerm} onChange={e => onSearchChange(e.target.value)} placeholder="Search products..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <button onClick={onAddClick} className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <PlusIcon className="h-5 w-5" />
              <span>Add Product</span>
            </button>
          </div>
        </div>
      </div>
    </header>;
}