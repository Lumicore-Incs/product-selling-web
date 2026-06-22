import React, { useState } from 'react';
import { StockItem } from './StockForm';
import { Product } from '../../models/product';

interface Props {
  items: StockItem[];
  products: Product[];
  onEdit: (item: StockItem) => void;
  onDelete: (id: number) => void;
  filterType?: string;
  filterDate?: string;
  filterStatus?: string;
}

const statusBadgeClass = (status: StockItem['status']) => {
  switch (status) {
    case 'NEW':
      return 'bg-[rgba(137,250,154,0.46)] text-[#016D18]';
    case 'RETURN':
      return 'bg-blue-100 text-blue-800';
    case 'DAMAGE':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const StockTable: React.FC<Props> = ({ items, products, onEdit, onDelete, filterType, filterDate, filterStatus }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const filteredItems = items.filter((item) => {
    const matchesType = !filterType || filterType === 'All' || item.type.toLowerCase() === filterType.toLowerCase();
    const matchesDate = !filterDate || new Date(item.date).toISOString().split('T')[0] === filterDate;
    const matchesStatus = !filterStatus || filterStatus === 'All' || item.status === filterStatus;
    return matchesType && matchesDate && matchesStatus;
  });
  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="bg-[rgba(255,255,255,0.49)] rounded-[18px] mb-6 overflow-hidden backdrop-blur-md">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[rgba(255,255,255,0.42)]">
            <tr>
              <th className="px-6 py-5 text-left text-[16px] font-medium text-[#414141]">Id</th>
              <th className="px-6 py-5 text-left text-[16px] font-medium text-[#414141]">Name</th>
              <th className="px-6 py-5 text-left text-[16px] font-medium text-[#414141]">Short Name</th>
              <th className="px-6 py-5 text-left text-[16px] font-medium text-[#414141]">Serial Prefix</th>
              <th className="px-6 py-5 text-left text-[16px] font-medium text-[#414141]">Price</th>
              <th className="px-6 py-5 text-left text-[16px] font-medium text-[#414141]">Status</th>
              <th className="px-6 py-5 text-left text-[16px] font-medium text-[#414141]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item, index) => {
                const product = products.find(p => p.name === item.type);
                return (
                <tr key={item.stock_id ?? JSON.stringify(item)} className="even:bg-[rgba(255,255,255,0.2)] hover:bg-white/30 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-[16px] font-medium text-[#414141]">
                    {(currentPage - 1) * rowsPerPage + index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[16px] font-medium text-[#414141]">
                    {item.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[16px] font-medium text-[#414141]">
                    {product?.shortName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[16px] font-medium text-[#414141]">
                    {product?.serialPrefix || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-[16px] font-medium text-[#414141]">
                    {product?.price ? `LKR ${product.price.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium ${statusBadgeClass(item.status)}`}>
                      {item.status === 'NEW' ? 'Active' : item.status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap flex gap-3">
                    <button
                      onClick={() => onEdit(item)}
                      disabled={item.quantity !== item.totalQuantity}
                      title={item.quantity !== item.totalQuantity ? "Can't edit when quantities don't match" : ""}
                      className={`w-[20px] h-[20px] flex items-center justify-center transition-opacity ${
                        item.quantity !== item.totalQuantity ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-70'
                      }`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="#2348CD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="#2348CD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(item.stock_id || 0)}
                      disabled={item.quantity !== item.totalQuantity}
                      title={item.quantity !== item.totalQuantity ? "Can't delete when quantities don't match" : ""}
                      className={`w-[22px] h-[22px] flex items-center justify-center transition-opacity ${
                        item.quantity !== item.totalQuantity ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-70'
                      }`}
                    >
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 7H20M10 11V17M14 11V17M5 7L6 19C6 19.5304 6.21071 20.0391 6.58579 20.4142C6.96086 20.7893 7.46957 21 8 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19L19 7M9 7V4C9 3.73478 9.10536 3.48043 9.29289 3.29289C9.48043 3.10536 9.73478 3 10 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8946 3.48043 15 3.73478 15 4V7" stroke="#E0090C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-6 text-center text-[#414141]">
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
            paginatedItems.map((item, index) => {
              const product = products.find(p => p.name === item.type);
              return (
              <div
                key={item.stock_id ?? JSON.stringify(item)}
                className="p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.type}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-semibold ${statusBadgeClass(item.status)}`}>
                    {item.status === 'NEW' ? 'Active' : item.status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold">Id</div>
                    <div className="font-medium text-gray-900">{(currentPage - 1) * rowsPerPage + index + 1}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold">Short Name</div>
                    <div className="font-medium text-gray-900">{product?.shortName || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold">Serial Prefix</div>
                    <div className="font-medium text-gray-900">{product?.serialPrefix || '-'}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs uppercase font-semibold">Price</div>
                    <div className="font-medium text-gray-900">{product?.price ? `LKR ${product.price.toFixed(2)}` : '-'}</div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => onEdit(item)}
                    disabled={item.quantity !== item.totalQuantity}
                    title={item.quantity !== item.totalQuantity ? "Can't edit when quantities don't match" : ""}
                    className={`inline-flex items-center px-3 py-2 border text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
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
                    className={`inline-flex items-center px-3 py-2 border text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      item.quantity !== item.totalQuantity
                        ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                        : 'border-red-100 text-red-700 bg-red-50 hover:bg-red-100 focus:ring-red-500'
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </div>
              );
            })
          ) : (
            <div className="text-center text-gray-500 py-8 px-4">
              No records found
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-[14px] text-[#414141] text-center sm:text-left">
            Showing {paginatedItems.length} of {filteredItems.length}
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-[8px] text-[14px] font-medium transition-colors ${
                currentPage === 1
                  ? 'bg-transparent text-gray-400 cursor-not-allowed'
                  : 'bg-white/50 text-[#414141] hover:bg-white/70'
              }`}
            >
              Prev
            </button>
            <div className="px-4 py-2 text-[14px] font-medium text-[#414141] bg-white/50 rounded-[8px]">
              {currentPage}/{totalPages || 1}
            </div>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages || totalPages === 0}
              className={`px-4 py-2 rounded-[8px] text-[14px] font-medium transition-colors ${
                currentPage === totalPages || totalPages === 0
                  ? 'bg-transparent text-gray-400 cursor-not-allowed'
                  : 'bg-white/50 text-[#414141] hover:bg-white/70'
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
