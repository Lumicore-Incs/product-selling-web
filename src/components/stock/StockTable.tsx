import React, { useState } from 'react';
import { StockItem } from './StockForm';

interface Props {
  items: StockItem[];
  onEdit: (item: StockItem) => void;
  onDelete: (id: number) => void;
  filterType?: string;
  filterMonth?: string;
  filterDate?: string;
  filterStatus?: string;
}

const statusBadgeClass = (status: StockItem['status']) => {
  switch (status) {
    case 'NEW':
      return 'bg-green-100 text-green-800 border border-green-200';
    case 'RETURN':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    case 'DAMAGE':
      return 'bg-red-100 text-red-800 border border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
};

const StockTable: React.FC<Props> = ({ items, onEdit, onDelete, filterType, filterMonth, filterDate, filterStatus }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const filteredItems = items.filter((item) => {
    const matchesType = !filterType || filterType === 'All' || item.type.toLowerCase() === filterType.toLowerCase();
    
    let matchesMonth = true;
    if (filterMonth && filterMonth !== '') {
      const itemMonth = new Date(item.date).getMonth() + 1; // 1-12
      matchesMonth = itemMonth.toString() === filterMonth;
    }

    const matchesStatus = !filterStatus || filterStatus === 'All' || item.status === filterStatus;
    const matchesDate = !filterDate || new Date(item.date).toISOString().split('T')[0] === filterDate;
    
    return matchesType && matchesMonth && matchesDate && matchesStatus;
  });
  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="bg-white rounded shadow overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>

              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item, index) => (
                <tr key={item.id ?? item.stock_id ?? `row-${currentPage}-${index}`} className="hover:bg-gray-50 transition">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{item.quantity}</span>
                  </td>

                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(item.status)}`}>
                      {item.status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      disabled={item.totalQuantity != null && item.quantity !== item.totalQuantity}
                      title={item.totalQuantity != null && item.quantity !== item.totalQuantity ? "Can't edit when quantities don't match" : ""}
                      className={`inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        item.totalQuantity != null && item.quantity !== item.totalQuantity 
                          ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                          : 'border-blue-100 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500'
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(item.id || item.stock_id || 0)}
                      disabled={item.totalQuantity != null && item.quantity !== item.totalQuantity}
                      title={item.totalQuantity != null && item.quantity !== item.totalQuantity ? "Can't delete when quantities don't match" : ""}
                      className={`inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        item.totalQuantity != null && item.quantity !== item.totalQuantity
                          ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                          : 'border-red-100 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500'
                      }`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 sm:px-6 py-4 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        <div className="divide-y divide-gray-200">
          {paginatedItems.length > 0 ? (
            paginatedItems.map((item, index) => (
              <div
                key={item.id ?? item.stock_id ?? `mobile-row-${currentPage}-${index}`}
                className="p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.type}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass(item.status)}`}>
                    {item.status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold">Date</div>
                    <div className="font-medium text-gray-900">{new Date(item.date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold">Quantity</div>
                    <div className="font-medium text-gray-900">{item.quantity}</div>
                  </div>

                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => onEdit(item)}
                    disabled={item.totalQuantity != null && item.quantity !== item.totalQuantity}
                    title={item.totalQuantity != null && item.quantity !== item.totalQuantity ? "Can't edit when quantities don't match" : ""}
                    className={`inline-flex items-center px-3 py-2 border text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      item.totalQuantity != null && item.quantity !== item.totalQuantity
                        ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                        : 'border-blue-100 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500'
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(item.id || item.stock_id || 0)}
                    disabled={item.totalQuantity != null && item.quantity !== item.totalQuantity}
                    title={item.totalQuantity != null && item.quantity !== item.totalQuantity ? "Can't delete when quantities don't match" : ""}
                    className={`inline-flex items-center px-3 py-2 border text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      item.totalQuantity != null && item.quantity !== item.totalQuantity
                        ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                        : 'border-red-100 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500'
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8 px-4">
              No records found
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="px-4 sm:px-6 py-4 border-t bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-gray-500 text-center sm:text-left">
            Showing {paginatedItems.length} of {filteredItems.length}
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-3 sm:px-4 py-2 rounded-md border text-xs sm:text-sm font-medium transition-colors ${
                currentPage === 1
                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Prev
            </button>
            <div className="px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
              {currentPage}/{totalPages}
            </div>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-3 sm:px-4 py-2 rounded-md border text-xs sm:text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTable;
