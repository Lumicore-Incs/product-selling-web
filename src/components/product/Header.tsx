import { PlusIcon } from 'lucide-react';

interface HeaderProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onAddClick: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export function Header({
  onAddClick,
}: Readonly<HeaderProps>) {
  return (
    <header className="mb-6">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: '#006D77', fontFamily: 'Inter, sans-serif' }}>
          Product Management
        </h1>
        <button
          onClick={onAddClick}
          className="flex items-center justify-center gap-1.5 px-6 py-2 text-white text-sm rounded-lg font-medium transition-opacity hover:opacity-90 shadow-sm"
          style={{ backgroundColor: '#008F8F' }}
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add</span>
        </button>
      </div>
    </header>
  );
}
