import React, { useState, useEffect } from 'react';
import { Save, DollarSign, Wallet, RefreshCw, Calendar, Layers, Receipt, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { paymentService, PaymentRequest, PaymentDetailRequest } from '../../services/payments/paymentService';

interface PaymentFormProps {
  userId: number;
  onSuccess: () => void;
  mode?: 'create' | 'edit';
  initialData?: {
    commission: number;
    basicSalary: number;
  };
  paymentId?: number;
  isParentLoading?: boolean;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ 
  userId, 
  onSuccess, 
  mode = 'create', 
  initialData,
  paymentId: initialPaymentId,
  isParentLoading = false
}) => {
  // Main Payment Settings State
  const [commission, setCommission] = useState<string>('');
  const [basicSalary, setBasicSalary] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Payment Details Input State (New Section)
  const [paymentId, setPaymentId] = useState<number | null>(initialPaymentId || null);
  const [detailDate, setDetailDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [detailMonthlyQty, setDetailMonthlyQty] = useState<string>('');
  const [detailTotalCommission, setDetailTotalCommission] = useState<string>('');
  const [detailTotalAmount, setDetailTotalAmount] = useState<string>('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<boolean>(false);

  // Sync internal paymentId with prop updates from parent
  useEffect(() => {
    if (initialPaymentId) {
      console.log('Syncing paymentId from props:', initialPaymentId);
      setPaymentId(initialPaymentId);
    }
  }, [initialPaymentId]);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setCommission(initialData.commission.toString());
      setBasicSalary(initialData.basicSalary.toString());
    } else {
      setCommission('');
      setBasicSalary('');
    }
  }, [mode, initialData]);

  const handleSubmitSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const commValue = parseFloat(commission);
    const salaryValue = parseFloat(basicSalary);

    if (isNaN(commValue) || commValue < 0) {
      setError('Please enter a valid commission amount.');
      return;
    }

    if (isNaN(salaryValue) || salaryValue < 0) {
      setError('Please enter a valid basic salary.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload: PaymentRequest = {
        commission: commValue,
        basicSalary: salaryValue,
        userId: userId
      };

      if (mode === 'edit' && paymentId) {
        await paymentService.updatePayment(paymentId, payload);
      } else {
        const response = await paymentService.addPayment(payload);
        if (response.success && response.data) {
          setPaymentId(response.data.id);
        }
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${mode === 'edit' ? 'update' : 'save'} settings.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debugging point
    console.log('Submitting settlement. Current paymentId:', paymentId);

    const qty = parseInt(detailMonthlyQty);
    const comm = parseFloat(detailTotalCommission);
    const amount = parseFloat(detailTotalAmount);

    if (!paymentId) {
      setErrorDetails('Reference ID missing. You must have an active payment strategy first.');
      return;
    }

    if (!detailDate) {
      setErrorDetails('Date is required.');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setErrorDetails('Monthly quantity must be a positive number.');
      return;
    }
    if (isNaN(comm) || comm <= 0) {
      setErrorDetails('Total commission must be a positive amount.');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setErrorDetails('Total amount must be a positive amount.');
      return;
    }

    setLoadingDetails(true);
    setErrorDetails(null);
    setSuccessDetails(false);

    try {
      const payload: PaymentDetailRequest = {
        date: detailDate,
        monthlyQty: qty,
        totalCommission: comm,
        totalAmount: amount,
        status: "PAID",
        paymentId: paymentId
      };

      // Debugging payload before API call
      console.log('API Request Payload (POST /payments/details):', payload);

      await paymentService.addPaymentDetails(payload);
      
      // Clear fields
      setDetailMonthlyQty('');
      setDetailTotalCommission('');
      setDetailTotalAmount('');
      setSuccessDetails(true);
      
      // Refresh list
      onSuccess();
      
      setTimeout(() => setSuccessDetails(false), 3000);
    } catch (err: any) {
      setErrorDetails(err.response?.data?.message || 'Failed to add settlement details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* SECTION 1: Payment Settings */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Payment Settings</h3>
        </div>

        <form onSubmit={handleSubmitSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Salary */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 ml-1 uppercase tracking-wider">Basic Salary (LKR)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Wallet className="w-5 h-5" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={basicSalary}
                  onChange={(e) => setBasicSalary(e.target.value)}
                  placeholder="e.g. 45000"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Commission */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 ml-1 uppercase tracking-wider">Commission Rate (LKR)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <DollarSign className="w-5 h-5" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-6 rounded-2xl font-bold text-white shadow-lg shadow-blue-200 flex items-center justify-center gap-3 transition-all ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : mode === 'edit'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:scale-[1.01]'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:scale-[1.01] active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'edit' ? <RefreshCw className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {mode === 'edit' ? 'Update Settings' : 'Initialize Strategy'}
              </>
            )}
          </button>
        </form>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent" />

      {/* SECTION 2: Payment Details (New Settlements) */}
      <div className="space-y-6 relative">
        {/* Loading Overlay for fetching paymentId */}
        {isParentLoading && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-3xl">
            <div className="flex flex-col items-center gap-2 bg-white p-4 rounded-2xl shadow-xl border border-gray-100">
               <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Fetching Payment ID...</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800">Settlement Details</h3>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Record monthly milestones</p>
              {paymentId && (
                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md font-bold">
                  Target: #{paymentId}
                </span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmitDetails} className="space-y-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Pickers */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 ml-1 uppercase tracking-wider">Settlement Date</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                  <Calendar className="w-5 h-5" />
                </div>
                <input
                  type="date"
                  required
                  value={detailDate}
                  onChange={(e) => setDetailDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Monthly Qty */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 ml-1 uppercase tracking-wider">Monthly Quantity</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                  <Layers className="w-5 h-5" />
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  value={detailMonthlyQty}
                  onChange={(e) => setDetailMonthlyQty(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Total Commission */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 ml-1 uppercase tracking-wider">Total Commission (LKR)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                  <DollarSign className="w-5 h-5" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={detailTotalCommission}
                  onChange={(e) => setDetailTotalCommission(e.target.value)}
                  placeholder="e.g. 500.00"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Total Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 ml-1 uppercase tracking-wider">Total Amount (LKR)</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none">
                  <Wallet className="w-5 h-5" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0"
                  value={detailTotalAmount}
                  onChange={(e) => setDetailTotalAmount(e.target.value)}
                  placeholder="e.g. 5000.00"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-300"
                />
              </div>
            </div>
          </div>

          {!paymentId && !isParentLoading && (
            <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Settlement submission is disabled until payment settings are saved.
            </div>
          )}

          {errorDetails && (
            <div className="text-sm text-red-500 bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errorDetails}
            </div>
          )}

          {successDetails && (
            <div className="text-sm text-emerald-600 bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-2 animate-in fade-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4" />
              Settlement details added successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={loadingDetails || !paymentId || isParentLoading}
            className={`w-full py-4 px-6 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${
              (loadingDetails || !paymentId || isParentLoading)
                ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-100'
            }`}
          >
            {loadingDetails ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Submit Settlement</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
