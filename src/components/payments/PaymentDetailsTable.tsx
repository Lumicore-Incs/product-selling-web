import React, { useState, useEffect } from 'react';
import { PaymentDetail, paymentService, PaymentDetailRequest } from '../../services/payments/paymentService';
import { 
  Calendar, Receipt, Loader2, Hash, RefreshCw, AlertCircle, Edit2, Trash2, X, Save
} from 'lucide-react';

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
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<PaymentDetail | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

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

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
      return;
    }

    setIsDeletingId(id);
    setError(null);

    try {
      const response = await paymentService.deletePaymentDetails(id);
      if (response.success) {
        setLocalDetails(prev => prev.filter(item => item.id !== id));
        if (onRefresh) onRefresh();
      } else {
        setError('Failed to delete the record.');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Error deleting record.');
    } finally {
      setIsDeletingId(null);
    }
  };

  const openEditModal = (detail: PaymentDetail) => {
    setSelectedDetail(detail);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedDetail(null);
    setIsEditModalOpen(false);
  };

  const handleUpdateSuccess = () => {
    handleRefresh();
    closeEditModal();
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

      {/* DESKTOP VIEW */}
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
                    <Calendar className="w-4 h-4" /> Date
                  </div>
                </th>
                <th className="px-6 py-5 font-bold text-gray-400 border-b border-gray-100 text-center">
                  Qty
                </th>
                <th className="px-6 py-5 font-bold text-gray-400 border-b border-gray-100 text-right">
                  Commission
                </th>
                <th className="px-6 py-5 font-bold text-gray-800 border-b border-gray-100 text-right">
                  Total
                </th>
                <th className="px-6 py-5 font-bold text-gray-400 border-b border-gray-100 text-center">
                  Status
                </th>
                <th className="px-6 py-5 font-bold text-gray-400 border-b border-gray-100 text-right">
                   Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {hasDetails ? (
                localDetails.map((detail) => (
                  <tr key={detail.id} className="hover:bg-blue-50/30 transition-all duration-300 group cursor-default">
                    <td className="px-6 py-5 font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                      #{detail.id}
                    </td>
                    <td className="px-6 py-5 text-gray-700 font-medium">
                      {detail.date || 'N/A'}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg font-bold text-xs">
                        {detail.monthlyQty}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-semibold text-gray-600">
                      {detail.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="font-black text-gray-800">
                        {detail.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                         detail.status?.toLowerCase() === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                       }`}>
                         {detail.status || 'Pending'}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end items-center gap-2 opacity-0 opacity-100 ">
                        <button 
                          onClick={() => openEditModal(detail)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(detail.id)}
                          disabled={isDeletingId === detail.id}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {isDeletingId === detail.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
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

      {/* MOBILE VIEW */}
      <div className={`block md:hidden space-y-4 transition-all duration-500 ${isRefreshing ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'}`}>
        {hasDetails ? (
          localDetails.map((detail) => (
            <div key={detail.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
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
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => openEditModal(detail)}
                    className="p-2 text-blue-600 bg-blue-50 rounded-lg font-bold text-xs"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                    onClick={() => handleDelete(detail.id)}
                    className="p-2 text-red-500 bg-red-50 rounded-lg font-bold text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                 <div>
                    <p className="text-xs font-bold text-gray-700">{detail.monthlyQty} Units</p>
                    <p className="text-[10px] text-gray-400">Monthly Qty</p>
                 </div>
                 <div className="text-right">
                    <p className="text-sm font-black text-gray-800 underline decoration-blue-200 decoration-2">LKR {detail.totalAmount.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 uppercase">Total Settlement</p>
                 </div>
              </div>
            </div>
          ))
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && selectedDetail && (
        <EditPaymentDetailModal 
          detail={selectedDetail} 
          onClose={closeEditModal} 
          onSuccess={handleUpdateSuccess} 
        />
      )}
    </div>
  );
};

/* ===============================
   Edit Modal Component
================================= */

interface EditModalProps {
  detail: PaymentDetail;
  onClose: () => void;
  onSuccess: () => void;
}

const EditPaymentDetailModal: React.FC<EditModalProps> = ({ detail, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<PaymentDetailRequest>({
    date: detail.date || '',
    monthlyQty: detail.monthlyQty,
    totalCommission: detail.totalCommission,
    totalAmount: detail.totalAmount,
    status: detail.status,
    paymentId: detail.paymentId
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (formData.monthlyQty < 0 || formData.totalCommission < 0 || formData.totalAmount < 0) {
        throw new Error('Numeric values must be positive.');
      }

      await paymentService.updatePaymentDetails(detail.id, formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to update settlement record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white">
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-blue-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <Edit2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Edit Settlement</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Settlement Date</label>
              <input 
                type="date" 
                required
                className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold"
                value={formData.date || ''}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Quantity</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold focus:border-blue-500"
                  value={formData.monthlyQty}
                  onChange={(e) => setFormData({...formData, monthlyQty: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Status</label>
                <select 
                  className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Commission</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  min="0"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold focus:border-blue-500"
                  value={formData.totalCommission}
                  onChange={(e) => setFormData({...formData, totalCommission: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Total Amount</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  min="0"
                  className="w-full mt-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold focus:border-blue-500"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({...formData, totalAmount: Number(e.target.value)})}
                />
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 p-3 rounded-xl flex items-center gap-2 font-bold"><AlertCircle className="w-3 h-3" /> {error}</p>}

          <div className="pt-4 flex gap-3">
             <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-colors"
             >
                Cancel
             </button>
             <button 
              type="submit" 
              disabled={submitting}
              className="flex-[2] px-6 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
             >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {submitting ? 'Updating...' : 'Save Changes'}
             </button>
          </div>
        </form>
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

