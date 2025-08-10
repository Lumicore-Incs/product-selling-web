import React, { useState } from 'react';
import { EditIcon, Trash2Icon, ChevronDownIcon, ChevronUpIcon, PhoneIcon, MapPinIcon, PackageIcon } from 'lucide-react';

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  name: string;
  address: string;
  contact01: string;
  contact02: string;
  status: string;
  quantity: string;
  items: SaleItem[];
}

interface SalesTableProps {
  sales: Sale[];
  onEdit: (sale: Sale) => void;
  onDelete: (id: string) => void;
}

export const SalesTable: React.FC<SalesTableProps> = ({
  sales,
  onEdit,
  onDelete
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const rowsPerPage = 5;

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'deliver':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed to deliver':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTotalAmount = (items: SaleItem[]) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  // Pagination logic
  const sortedSales = [...sales].sort((a, b) => {
    const aId = isNaN(Number(a.id)) ? a.id : Number(a.id);
    const bId = isNaN(Number(b.id)) ? b.id : Number(b.id);
    if (aId < bId) return 1;
    if (aId > bId) return -1;
    return 0;
  });
  
  const totalPages = Math.ceil(sortedSales.length / rowsPerPage);
  const paginatedSales = sortedSales.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <PackageIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
          Sales Entries
        </h2>
        <p className="text-gray-500 text-base">
          No sales entries yet. Add a new sale to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          Sales Entries
        </h2>
        <p className="text-blue-100 text-sm mt-1">
          {sales.length} total entries
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Contact 1
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Contact 2
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{sale.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">{sale.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {sale.contact01}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {sale.contact02 || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(sale.status)}`}>
                      {sale.status || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                    {sale.quantity}
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      {sale.items && sale.items.length > 0 ? (
                        <div className="space-y-1">
                          {sale.items.slice(0, 2).map((item, index) => (
                            <div key={item.productId + '-' + index} className="text-xs text-gray-600">
                              {item.productName} (x{item.quantity})
                            </div>
                          ))}
                          {sale.items.length > 2 && (
                            <div className="text-xs text-blue-600">
                              +{sale.items.length - 2} more items
                            </div>
                          )}
                          <div className="text-xs font-medium text-blue-600 mt-1">
                            Total: {sale.items.reduce((sum, item) => sum + item.quantity, 0)} items
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No products</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-semibold text-green-600">
                      LKR {sale.items ? getTotalAmount(sale.items).toFixed(2) : '0.00'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(sale)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Edit"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(sale.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Delete"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        <div className="p-4 space-y-4">
          {paginatedSales.map((sale) => {
            const isExpanded = expandedRows.has(sale.id);
            return (
              <div key={sale.id} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                {/* Card Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {sale.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPinIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <p className="text-sm text-gray-600 truncate">{sale.address}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <PhoneIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="text-sm text-gray-600">
                          {sale.contact01}
                          {sale.contact02 && (
                            <span className="ml-2">• {sale.contact02}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-3 flex items-center gap-2">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(sale.status)}`}>
                        {sale.status}
                      </span>
                    </div>
                  </div>

                  {/* Quick Info Row */}
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-green-600">
                      LKR {sale.items ? getTotalAmount(sale.items).toFixed(2) : '0.00'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRowExpansion(sale.id)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-all duration-200"
                      >
                        {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => onEdit(sale)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      >
                        <EditIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(sale.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                      >
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-white p-4 space-y-4">
                    {/* Contact Information */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <PhoneIcon className="w-4 h-4" />
                        Contact Information
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">WhatsApp:</span>
                          <span className="text-sm font-medium text-gray-900">{sale.contact01}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Contact 2:</span>
                          <span className="text-sm font-medium text-gray-900">{sale.contact02 || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Quantity:</span>
                          <span className="text-sm font-medium text-gray-900">{sale.quantity}</span>
                        </div>
                      </div>
                    </div>

                    {/* Products Information */}
                    {sale.items && sale.items.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <PackageIcon className="w-4 h-4" />
                          Products ({sale.items.length} items)
                        </h4>
                        <div className="space-y-2">
                          {sale.items.map((item, index) => (
                            <div key={item.productId + '-' + index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                                <div className="text-xs text-gray-600">LKR {item.price} each</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-900">x{item.quantity}</div>
                                <div className="text-xs text-green-600">LKR {(item.quantity * item.price).toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-gray-700">Total Items:</span>
                              <span className="text-sm font-semibold text-blue-600">
                                {sale.items.reduce((sum, item) => sum + item.quantity, 0)} items
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            Showing <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
            <span className="font-medium">{Math.min(currentPage * rowsPerPage, sales.length)}</span> of{' '}
            <span className="font-medium">{sales.length}</span> entries
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 ${
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400'
              }`}
            >
              Previous
            </button>
            
            <div className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
              Page {currentPage} of {totalPages}
            </div>
            
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 ${
                currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400'
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