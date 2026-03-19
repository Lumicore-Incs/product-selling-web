import React, { useState, useEffect } from 'react';
import { PaymentDetail, paymentService } from '../../services/payments/paymentService';
import { Calendar, Receipt, Loader2, IndianRupee, Hash, Layers, CheckCircle2, Clock, RefreshCw, AlertCircle } from 'lucide-react';

interface PaymentDetailsTableProps {
  details: PaymentDetail[];
  loading?: boolean;
  userId?: number | string;
  onRefresh?: () => void;
}

export const PaymentDetailsTable: React.FC<PaymentDetailsTableProps> = ({ 
  details: initialDetails, 
  loading: parentLoading,
  userId,
  onRefresh
}) => {
  const [localDetails, setLocalDetails] = useState<PaymentDetail[]>(initialDetails);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Sync with prop updates from parent
  useEffect(() => {
    setLocalDetails(initialDetails);
  }, [initialDetails]);

  const handleRefresh = async () => {
    if (!userId) {
      setError('User ID missing. Cannot refresh data.');
      return;
    }

    setIsRefreshing(true);
    setError(null);
    setShowSuccess(false);

    try {
      const response = await paymentService.getPaymentsByUserId(userId);
      if (response.success && response.data) {
        setLocalDetails(response.data.paymentDetails || []);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        if (onRefresh) onRefresh();
      } else {
        setError('Failed to fetch latest settlements.');
      }
    } catch (err) {
      console.error('Refresh failed:', err);
      setError('Connection error. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (parentLoading && localDetails.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">Fetching payment details...</p>
      </div>
    );
  }

  const hasDetails = localDetails && localDetails.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
            <Receipt className="w-5 h-5" />
          </div>
          Payment Settlements
        </h3>
        
        <div className="flex items-center gap-4">
          {showSuccess && (
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest animate-in fade-in slide-in-from-right-2 duration-300">
              Updated just now
            </span>
          )}
          {error && (
             <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-bold uppercase animate-shake">
                <AlertCircle className="w-3 h-3" />
                {error}
             </div>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || parentLoading || !userId}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
              ${isRefreshing || parentLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50 shadow-sm active:scale-95'
              }
            `}
          >
            {isRefreshing || parentLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="hidden sm:block text-sm font-semibold text-gray-400 uppercase tracking-widest pl-4 border-l border-gray-100">
            {localDetails.length} Records
          </div>
        </div>
      </div>

      {/* DESKTOP VIEW: Normal Table */}
      <div className={`hidden md:block bg-white rounded-[2rem] shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden transition-all duration-500 ${isRefreshing ? 'opacity-60 grayscale-[0.5]' : 'opacity-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-5 font-bold text-gray-400 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" /> ID
                  </div>
                </th>
                <th className="px-6 py-5 font-bold text-gray-400 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Settlement Date
                  </div>
                </th>
                <th className="px-6 py-5 font-bold text-gray-400 border-b border-gray-100 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Layers className="w-4 h-4" /> Monthly Qty
                  </div>
                </th>
                <th className="px-6 py-5 font-bold text-gray-400 border-b border-gray-100 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <IndianRupee className="w-4 h-4" /> Commission
                  </div>
                </th>
                <th className="px-6 py-5 font-bold text-gray-800 border-b border-gray-100 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <IndianRupee className="w-4 h-4" /> Total Amount
                  </div>
                </th>
                <th className="px-6 py-5 font-bold text-gray-400 border-b border-gray-100 text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {hasDetails ? (
                localDetails.map((detail) => (
                  <tr 
                    key={detail.id} 
                    className="hover:bg-blue-50/30 transition-all duration-300 group cursor-default"
                  >
                    <td className="px-6 py-5 font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                      #{detail.id}
                    </td>
                    <td className="px-6 py-5 text-gray-700 font-medium">
                      {detail.date ? detail.date : 'N/A'}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg font-bold text-xs">
                        {detail.monthlyQty}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-semibold text-gray-600">
                      {detail.totalCommission.toLocaleString(undefined, { 
                         minimumFractionDigits: 2, 
                         maximumFractionDigits: 2 
                      })}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-lg font-black text-gray-800">
                        {detail.totalAmount.toLocaleString(undefined, { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex justify-center">
                        <span className={`
                          px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-1.5
                          ${detail.status?.toLowerCase() === 'paid' 
                            ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' 
                            : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                          }
                        `}>
                          {detail.status?.toLowerCase() === 'paid' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {detail.status || 'Pending'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyState />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOBILE VIEW: Card Layout */}
      <div className={`block md:hidden space-y-4 transition-all duration-500 ${isRefreshing ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'}`}>
        {hasDetails ? (
          localDetails.map((detail) => (
            <div 
              key={detail.id} 
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 active:scale-[0.98] transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-xl text-gray-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                    <p className="text-sm font-bold text-gray-800">{detail.date || 'N/A'}</p>
                  </div>
                </div>
                <span className={`
                  px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5
                  ${detail.status?.toLowerCase() === 'paid' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-amber-100 text-amber-700'
                  }
                `}>
                  {detail.status || 'Pending'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Quantity</p>
                  <p className="text-sm font-black text-gray-700 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-blue-500" />
                    {detail.monthlyQty} Units
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Commission</p>
                  <p className="text-sm font-black text-gray-700 flex items-center gap-1.5">
                    <IndianRupee className="w-3 h-3 text-emerald-500" />
                    {detail.totalCommission.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-blue-600/5 p-4 rounded-xl flex justify-between items-center">
                <p className="text-xs font-bold text-blue-800">Total Settlement</p>
                <p className="text-lg font-black text-blue-600">
                  <span className="text-[10px] mr-1">LKR</span>
                  {detail.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[2rem] border border-dashed border-gray-200 p-10">
            <EmptyState />
          </div>
        )}
      </div>
    </div>
  );
};


const EmptyState = () => (
  <div className="flex flex-col items-center justify-center space-y-3 py-10 md:py-20">
    <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center">
      <Receipt className="w-8 h-8 text-gray-300" />
    </div>
    <div className="space-y-1 text-center">
      <p className="text-gray-800 font-bold">No data available</p>
      <p className="text-gray-400 text-xs">There are no payment records for this user yet.</p>
    </div>
  </div>
);

