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

  const handleReset = () => {
    updateFilters({ type: 'All', date: '', status: 'All' });
  };

  return (
    <div className="flex flex-col md:flex-row items-end gap-[30px] xl:gap-[25px] mb-6 bg-[rgba(255,255,255,0.49)] p-[28px] rounded-[8px] shadow-sm border border-white/40 backdrop-blur-md">
      
      {/* Filter by Type */}
      <div className="flex-1 max-w-[273px]">
        <label className="block text-[18px] font-semibold text-[#414141] mb-[5px]">
          Filter by type
        </label>
        <div className="relative">
          <select
            value={currentFilters.type}
            onChange={(e) => updateFilters({ type: e.target.value })}
            className="w-full h-[32px] border border-[#BCC1CB] rounded-[8px] bg-transparent pl-3 pr-8 text-[12px] text-[#949494] appearance-none outline-none"
          >
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <div className="absolute right-[10px] top-[8px] pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9L12 15L18 9" stroke="#949494" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Filter by Status */}
      <div className="flex-1 max-w-[273px]">
        <label className="block text-[18px] font-semibold text-[#414141] mb-[5px]">
          Filter by status
        </label>
        <div className="relative">
          <select
            value={currentFilters.status}
            onChange={(e) => updateFilters({ status: e.target.value })}
            className="w-full h-[32px] border border-[#BCC1CB] rounded-[8px] bg-transparent pl-3 pr-8 text-[12px] text-[#949494] appearance-none outline-none"
          >
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <div className="absolute right-[10px] top-[8px] pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9L12 15L18 9" stroke="#949494" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Filter by Date */}
      <div className="flex-1 max-w-[273px]">
        <label className="block text-[18px] font-semibold text-[#414141] mb-[5px]">
          Filter by date
        </label>
        <div className="relative">
          <input
            type="date"
            value={currentFilters.date}
            onChange={(e) => updateFilters({ date: e.target.value })}
            className="w-full h-[32px] border border-[#BCC1CB] rounded-[8px] bg-transparent pl-3 pr-8 text-[12px] text-[#949494] outline-none [color-scheme:light]"
          />
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex-1 flex justify-start items-end max-w-[148px]">
        <button
          onClick={handleReset}
          className="w-full h-[37px] bg-[#C5C5C5] hover:bg-[#b3b3b3] transition rounded-[8px] flex items-center justify-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4C7.58 4 4.01 7.58 4.01 12C4.01 16.42 7.58 20 12 20C15.73 20 18.84 17.45 19.73 14H17.65C16.83 16.33 14.61 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.14 6.69 16.22 7.78L13 11H20V4L17.65 6.35Z" fill="#5C626E"/>
          </svg>
          <span className="text-[16px] font-semibold text-[#5C626E]">Reset</span>
        </button>
      </div>

    </div>
  );
};

export default Filters;
