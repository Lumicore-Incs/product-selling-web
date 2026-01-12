import React, { useState } from 'react';
import { StockItem } from './StockForm';

interface Props {
  items: StockItem[];
  onEdit: (item: StockItem) => void;
  onDelete: (id: number) => void;
  filterType?: string;
  filterDate?: string;
}

const StockTable: React.FC<Props> = ({ items, onEdit, onDelete, filterType, filterDate }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const filteredItems = items.filter((item) => {
    const matchesType = !filterType || filterType === 'All' || item.type.toLowerCase() === filterType.toLowerCase();
    const matchesDate = !filterDate || new Date(item.date).toISOString().split('T')[0] === filterDate;
    return matchesType && matchesDate;
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
      <div className="hidden lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Quantity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item) => (
                <tr key={item.stock_id ?? JSON.stringify(item)} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{item.quantity}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{item.totalQuantity}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'NEW'
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {item.status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm flex space-x-2">
                    <button
                      onClick={() => onEdit(item)}
                      disabled={item.quantity !== item.totalQuantity}
                      title={item.quantity !== item.totalQuantity ? "Can't edit when quantities don't match" : ""}
                      className={`inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        item.quantity !== item.totalQuantity 
                          ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                          : 'border-blue-100 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500'
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(item.stock_id || 0)}
                      disabled={item.quantity !== item.totalQuantity}
                      title={item.quantity !== item.totalQuantity ? "Can't delete when quantities don't match" : ""}
                      className={`inline-flex items-center px-2.5 py-1.5 border text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        item.quantity !== item.totalQuantity
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
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        <div className="grid gap-4 p-4">
          {paginatedItems.length > 0 ? (
            paginatedItems.map((item) => (
              <div
                key={item.stock_id ?? JSON.stringify(item)}
                className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.type}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    item.status === 'NEW'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    {item.status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Date</div>
                    <div className="font-medium">{new Date(item.date).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Quantity</div>
                    <div className="font-medium">{item.quantity}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total Quantity</div>
                    <div className="font-medium">{item.totalQuantity}</div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => onEdit(item)}
                    disabled={item.quantity !== item.totalQuantity}
                    title={item.quantity !== item.totalQuantity ? "Can't edit when quantities don't match" : ""}
                    className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      item.quantity !== item.totalQuantity
                        ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                        : 'border-blue-100 text-blue-700 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500'
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(item.stock_id || 0)}
                    disabled={item.quantity !== item.totalQuantity}
                    title={item.quantity !== item.totalQuantity ? "Can't delete when quantities don't match" : ""}
                    className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      item.quantity !== item.totalQuantity
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
            <div className="text-center text-gray-500 py-8">
              No records found
            </div>
          )}
        </div>
      </div>
      <div className="px-4 sm:px-6 py-4 border-t">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-gray-500 text-center sm:text-left">
            Showing {paginatedItems.length} of {filteredItems.length} entries
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                currentPage === 1
                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              Previous
            </button>
            <div className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
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
