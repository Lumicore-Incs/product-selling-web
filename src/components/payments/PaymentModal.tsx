import React, { useEffect, useState } from 'react';
import { X, User, DollarSign, Wallet, CreditCard, CheckCircle2, Edit3, Plus } from 'lucide-react';
import { PaymentForm } from './PaymentForm';
import { paymentService, PaymentResponseData } from '../../services/payments/paymentService';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  deliveredQty?: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  userId, 
  userName,
  deliveredQty = 0
}) => {
  const [paymentData, setPaymentData] = useState<PaymentResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await paymentService.getPaymentsByUserId(userId);
      if (response.success) {
        setPaymentData(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch payment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && userId) {
      fetchData();
      setShowSuccess(false);
      setMode('create');
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    setShowSuccess(true);
    fetchData();
    setMode('create');
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#fdfdff] w-full max-w-4xl max-h-[95vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border border-white">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white relative">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-200 ring-4 ring-blue-50">
              <CreditCard className="text-white w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                {mode === 'edit' ? 'Update Payment' : 'Payment Management'}
              </h2>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-blue-100">
                  <User className="w-3 h-3" /> ID: {userId}
                </div>
                {userName && (
                  <span className="text-sm text-gray-400 font-semibold tracking-wide">
                    {userName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="group p-3 hover:bg-red-50 rounded-2xl transition-all duration-300 text-gray-300 hover:text-red-500 border border-transparent hover:border-red-100"
          >
            <X className="w-7 h-7 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 custom-scrollbar">
          
          {showSuccess && (
            <div className="bg-green-500 text-white px-6 py-4 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 shadow-lg shadow-green-100 border border-green-400">
              <div className="bg-white/20 p-1.5 rounded-full">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="font-bold tracking-wide">
                Payment details {mode === 'edit' ? 'updated' : 'saved'} successfully!
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Form Section */}
            <div className="lg:col-span-3 space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-2xl text-blue-700 font-bold text-sm gap-2">
                {mode === 'edit' ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {mode === 'edit' ? 'Edit Configuration' : 'Add New Configuration'}
              </div>
              <div className="bg-white border border-gray-100 p-8 rounded-[2rem] shadow-sm">
                <PaymentForm 
                  userId={parseInt(userId)} 
                  onSuccess={handleSuccess} 
                  mode={mode}
                  paymentId={paymentData?.id}
                  isParentLoading={loading}
                  deliveredQty={deliveredQty}
                  initialData={paymentData ? {
                    commission: paymentData.commission,
                    basicSalary: paymentData.basicSalary
                  } : undefined}
                />
              </div>
            </div>

            {/* Summary Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center px-4 py-2 bg-indigo-50 rounded-2xl text-indigo-700 font-bold text-sm gap-2">
                  <Wallet className="w-4 h-4" />
                  Active Settings
                </div>
                {!loading && paymentData && (
                  <button 
                    onClick={() => setMode(mode === 'edit' ? 'create' : 'edit')}
                    className={`p-2 rounded-xl transition-all border flex items-center gap-2 text-xs font-bold ${
                      mode === 'edit' 
                        ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-100' 
                        : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50 shadow-sm'
                    }`}
                  >
                    {mode === 'edit' ? <Plus className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                    {mode === 'edit' ? 'Switch to Add' : 'Edit'}
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-5">
                {loading ? (
                  <>
                    <div className="h-32 bg-gray-100 rounded-[2rem] animate-pulse" />
                    <div className="h-32 bg-gray-100 rounded-[2rem] animate-pulse" />
                  </>
                ) : (
                  <>
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-[2rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden group border border-blue-400">
                      <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:scale-125 transition-transform duration-700">
                        <Wallet className="w-32 h-32" />
                      </div>
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Base Salary</p>
                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                          <Wallet className="w-5 h-5" />
                        </div>
                      </div>
                      <p className="text-4xl font-black tracking-tighter">
                        <span className="text-xl font-medium mr-1 text-blue-200">LKR</span>
                        {paymentData?.basicSalary?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                      </p>
                    </div>
                    
                    <div className="bg-white border-2 border-indigo-50 p-8 rounded-[2rem] shadow-lg shadow-indigo-50/50 relative overflow-hidden group hover:border-indigo-100 transition-colors">
                      <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:scale-125 transition-transform duration-700 text-indigo-700">
                        <DollarSign className="w-32 h-32" />
                      </div>
                      <div className="flex justify-between items-start mb-6">
                        <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Commission</p>
                        <div className="bg-indigo-50 p-2 rounded-xl">
                          <DollarSign className="w-5 h-5 text-indigo-600" />
                        </div>
                      </div>
                      <p className="text-4xl font-black text-gray-800 tracking-tighter">
                        <span className="text-xl font-medium mr-1 text-indigo-300">LKR</span>
                        {paymentData?.commission?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>


        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};
