import React, { useEffect, useCallback } from 'react';
import { MapPinIcon, PackageIcon, PhoneIcon, XIcon } from 'lucide-react';
import { Sale } from '../models/sales';

interface SalesViewModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const SalesViewModal: React.FC<SalesViewModalProps> = ({ sale, onClose }) => {
  // Handle escape key press
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Handle click outside modal
  const handleOutsideClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Add and remove event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handleEscapeKey]);

  if (!sale) return null;

  const getTotalAmount = (sale: Sale) => {
    return sale.items ? sale.items.reduce((sum, item) => sum + item.qty * item.price, 0) : 0;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fadeIn_0.2s_ease-in-out]"
      onClick={handleOutsideClick}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-[slideIn_0.3s_ease-out] relative"
        style={{
          backgroundImage: 'radial-gradient(circle at top right, #f0f9ff 0%, white 50%)'
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 flex items-center justify-between rounded-t-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.343 0L13.858 8.485 15.272 9.9l7.9-7.9h-.83zm5.657 0L19.514 8.485 20.93 9.9l8.485-8.485h-1.415zM32.372 0L26.1 6.272 27.515 7.687 34.2 0h-1.829zm5.657 0l-6.9 6.9 1.414 1.415L40.2 0h-2.172zm5.657 0l-6.9 6.9 1.415 1.415L45.857 0h-2.17zM5.373 54.627L0 49.254l.828-.828 5.373 5.373h-.828zM54.627 54.627L49.254 60l-.828-.828 5.373-5.373h.828zm-5.657 0L43.4 60l-1.414-1.414L48.97 51.8v2.827zm-5.657 0L37.743 60l-1.414-1.414L42.314 51.8v2.827zm-5.657 0L32.086 60l-1.414-1.414L36.657 51.8v2.827zM32 54.627L26.343 60l-1.414-1.414L30.914 51.8v2.827zm-5.657 0L20.686 60l-1.414-1.414L25.257 51.8v2.827zm-5.657 0L15.029 60l-1.414-1.414L19.6 51.8v2.827zm-5.657 0L9.372 60l-1.414-1.414L13.943 51.8v2.827zm-5.657 0L3.715 60l-1.414-1.414L8.286 51.8v2.827z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")', backgroundSize: '30px 30px' }}></div>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight relative">Sale Details</h2>
          <button
            onClick={onClose}
            className="group relative text-white hover:text-blue-100 transition-all duration-300 p-2.5 hover:bg-white/10 rounded-full"
            title="Close"
          >
            <XIcon className="w-6 h-6 transform transition-transform duration-300 group-hover:rotate-90" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Press Esc to close
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Basic Information */}
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-blue-50">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">{sale.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Serial No: {sale.serialNo}</p>
              </div>
              <span
                className={`px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                  sale.status === 'PENDING' 
                    ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  sale.status === 'PENDING' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></span>
                {sale.status}
              </span>
            </div>
          </div>

          {/* Address & Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-blue-50 space-y-4">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <MapPinIcon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-semibold text-lg">Delivery Address</span>
              </div>
              <p className="text-gray-600 pl-13 leading-relaxed">{sale.address}</p>
            </div>

            {/* Contact Information */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-blue-50 space-y-4">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                  <PhoneIcon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-semibold text-lg">Contact Details</span>
              </div>
              <div className="space-y-3 pl-13">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Primary:</span>
                  <span className="font-medium text-gray-900">{sale.contact01}</span>
                </div>
                {sale.contact02 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Secondary:</span>
                    <span className="font-medium text-gray-900">{sale.contact02}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-blue-50 space-y-6">
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <PackageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-semibold text-lg">Products</span>
            </div>
            <div className="space-y-4">
              {sale.items && sale.items.map((item, index) => (
                <div
                  key={`${item.productId}-${index}`}
                  className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors duration-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                      <span className="text-lg font-semibold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-500">LKR {item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-gray-50 px-3 py-1 rounded-full">
                      <span className="font-medium text-gray-700">×{item.qty}</span>
                    </div>
                    <p className="text-sm font-medium text-green-600 mt-1">
                      LKR {(item.price * item.qty).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-col items-center sm:items-start gap-1">
                <span className="text-gray-600">Total Items</span>
                <span className="text-2xl font-bold text-gray-900">
                  {sale.items ? sale.items.reduce((sum, item) => sum + item.qty, 0) : 0}
                </span>
              </div>
              <div className="h-px sm:h-12 w-full sm:w-px bg-gray-200"></div>
              <div className="flex flex-col items-center sm:items-end gap-1">
                <span className="text-gray-600">Total Amount</span>
                <span className="text-2xl font-bold text-green-600">
                  LKR {getTotalAmount(sale).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
