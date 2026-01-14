import React from 'react';

import { StockItem } from './StockForm';

interface FiltersProps {
  onFilterChange: (filters: { type: string; date: string }) => void;
  existingItems: StockItem[];
}

const Filters: React.FC<FiltersProps> = ({ onFilterChange, existingItems }) => {
  const [currentFilters, setCurrentFilters] = React.useState({ type: 'All', date: '' });

  // Get unique types from existing items
  const uniqueTypes = ['All', ...Array.from(new Set(existingItems.map(item => item.type)))
    .filter(type => type)
    .sort()
  ];

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilters = { ...currentFilters, type: e.target.value };
    setCurrentFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...currentFilters, date: e.target.value };
    setCurrentFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4 bg-white p-4 rounded shadow">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">Filter by Type</label>
        <select
          value={currentFilters.type}
          onChange={handleTypeChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        >
          {uniqueTypes.map((type: string) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">Filter by Date</label>
        <input
          type="date"
          value={currentFilters.date}
          onChange={handleDateChange}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
        />
      </div>
    </div>
  );
};

export default Filters;