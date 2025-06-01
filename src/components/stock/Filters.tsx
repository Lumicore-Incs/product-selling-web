import React from 'react';

interface FiltersProps {
  onFilterChange: (filters: { type: string; date: string }) => void;
}

const types = ['All', 'Electronics', 'Groceries', 'Clothing', 'Furniture'];

const Filters: React.FC<FiltersProps> = ({ onFilterChange }) => {
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ type: e.target.value, date: '' });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ date: e.target.value, type: '' });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-4 bg-white p-4 rounded shadow">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">Filter by Type</label>
        <select onChange={handleTypeChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">Filter by Date</label>
        <input type="date" onChange={handleDateChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
      </div>
    </div>
  );
};

export default Filters;