import React from 'react';
import { StockItem } from './StockForm';

interface FiltersProps {
  onFilterChange: (filters: {
    type: string;
    date: string;
    status: string;
  }) => void;
  existingItems: StockItem[];
}

const Filters: React.FC<FiltersProps> = ({ onFilterChange, existingItems }) => {
  const [currentFilters, setCurrentFilters] = React.useState({
    type: 'All',
    date: '',
    status: 'All',
  });

  // ✅ Unique Types
  const uniqueTypes = [
    'All',
    ...Array.from(new Set(existingItems.map((item) => item.type)))
      .filter(Boolean)
      .sort(),
  ];

  // ✅ Unique Statuses
  const uniqueStatuses = [
    'All',
    ...Array.from(new Set(existingItems.map((item) => item.status)))
      .filter(Boolean)
      .sort(),
  ];

  const updateFilters = (updated: Partial<typeof currentFilters>) => {
    const newFilters = { ...currentFilters, ...updated };
    setCurrentFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4 bg-white p-4 rounded shadow">
      
      {/* Filter by Type */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">
          Filter by Type
        </label>
        <select
          value={currentFilters.type}
          onChange={(e) => updateFilters({ type: e.target.value })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        >
          {uniqueTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Filter by Status */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">
          Filter by Status
        </label>
        <select
          value={currentFilters.status}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        >
          {uniqueStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* Filter by Date */}
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">
          Filter by Date
        </label>
        <input
          type="date"
          value={currentFilters.date}
          onChange={(e) => updateFilters({ date: e.target.value })}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>

    </div>
  );
};

export default Filters;
