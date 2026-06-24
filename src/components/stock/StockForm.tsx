import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AlertSnackbar } from '../AlertSnackbar';
import Spinner from '../Spinner';
import { getAllProducts } from '../../service/product';
import { Product } from '../../models/product';

export interface StockItem {
  stock_id?: number;
  type: string;
  date: string;
  quantity: number;
  totalQuantity?: number;
  status: 'NEW' | 'RETURN' | 'DAMAGE';
  damageReason?: string;
}

interface Props {
  onSubmit: (data: StockItem) => void;
  initialValues?: StockItem | null;
  mode?: 'add' | 'damage';
}


const StockForm: React.FC<Props> = ({ onSubmit, initialValues, mode = 'add' }) => {
  const defaultStatus = mode === 'damage' ? 'DAMAGE' : 'NEW';
  const { register, handleSubmit, reset, watch, setValue } = useForm<StockItem>({
    defaultValues: initialValues || {
      type: '',
      date: '',
      quantity: 0,
      status: defaultStatus,
      damageReason: '',
    },
  });

  // Set form values when initialValues changes (edit mode)
  React.useEffect(() => {
    if (initialValues) {
      Object.entries(initialValues).forEach(([key, value]) => {
        setValue(key as keyof StockItem, value);
      });
    } else {
      reset({
        type: '',
        date: '',
        quantity: 0,
        status: defaultStatus,
        damageReason: '',
      });
    }
  }, [initialValues, setValue, defaultStatus, reset]);


  // Product list for dropdown
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getAllProducts();
        setProducts(data as Product[]);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchProducts();
  }, []);

  const selectedType = watch('type');
  const [newType, setNewType] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });

  const handleFormSubmit = async (data: StockItem) => {
    const submitData = {
      ...data,
      type: data.type === 'Other' ? newType : data.type,
      // Always set totalQuantity equal to quantity for both add and update
      totalQuantity: data.quantity
    };
    try {
      setIsSubmitting(true);
      await onSubmit(submitData);
      setSnackbar({ open: true, message: initialValues ? 'Stock updated successfully' : 'Stock saved successfully', type: 'success' });
      // Clear form after both add and update success
      reset({
        type: '',
        date: '',
        quantity: 0,
        status: 'NEW'
      });
      setNewType('');
    } catch (err: any) {
      const msg = err?.message || 'Failed to save stock';
      setSnackbar({ open: true, message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="bg-[rgba(255,255,255,0.49)] rounded-[8px] p-[28px] mb-6 shadow-sm border border-white/40 backdrop-blur-md"
      >
        <div className="flex flex-col xl:flex-row xl:items-end gap-[30px] xl:gap-[25px]">
          <div className="flex-1 max-w-[201px]">
            <label className="block text-[18px] font-semibold text-[#414141] mb-[5px]">Product</label>
            <div className="relative">
              <select
                {...register('type')}
                disabled={isSubmitting}
                className="w-full h-[32px] border border-[#BCC1CB] rounded-[8px] bg-transparent pl-3 pr-8 text-[12px] text-[#949494] appearance-none outline-none"
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.productId} value={product.name}>
                    {product.name}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>
              <div className="absolute right-[10px] top-[8px] pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 9L12 15L18 9" stroke="#949494" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            {selectedType === 'Other' && (
              <input
                type="text"
                className="mt-2 w-full h-[32px] border border-[#BCC1CB] rounded-[8px] bg-transparent px-3 text-[12px] outline-none"
                placeholder="Enter new product/type"
                value={newType}
                onChange={e => setNewType(e.target.value)}
                required
              />
            )}
          </div>

          <div className="flex-1 max-w-[201px]">
            <label className="block text-[18px] font-semibold text-[#414141] mb-[5px]">Date</label>
            <div className="relative">
              <input
                type="date"
                {...register('date')}
                disabled={isSubmitting}
                className="w-full h-[32px] border border-[#BCC1CB] rounded-[8px] bg-transparent pl-3 pr-8 text-[12px] text-[#949494] outline-none [color-scheme:light]"
              />
            </div>
          </div>

          <div className="flex-1 max-w-[201px]">
            <label className="block text-[18px] font-semibold text-[#414141] mb-[5px]">Quantity</label>
            <div className="relative">
              <input
                type="number"
                {...register('quantity', { valueAsNumber: true })}
                disabled={isSubmitting}
                className="w-full h-[32px] border border-[#BCC1CB] rounded-[8px] bg-transparent pl-3 pr-8 text-[12px] text-[#949494] outline-none"
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end">
            <label className="block text-[18px] font-semibold text-[#414141] mb-[5px]">Status</label>
            <div className="flex items-center gap-[10px]">
              <div className="flex items-center w-[213px] h-[35px] bg-[#FBFCFC] rounded-[8px] p-1 shadow-sm">
                {(['NEW', 'DAMAGE', 'RETURN'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={isSubmitting || mode === 'damage'}
                    onClick={() => setValue('status', s)}
                    className={`flex-1 h-full rounded-[18px] text-[11px] font-medium transition-colors ${
                      watch('status') === s
                        ? 'bg-[rgba(11,129,141,0.2)] text-[#5C626E]'
                        : 'text-[#5C626E] hover:bg-gray-100'
                    }`}
                  >
                    {s === 'NEW' ? 'New' : s === 'DAMAGE' ? 'Damage' : 'Return'}
                  </button>
                ))}
              </div>

              {!initialValues ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-[118px] h-[37px] bg-[#0B818D] rounded-[8px] text-white font-semibold text-[16px] flex items-center justify-center hover:bg-[#096a74] transition"
                >
                  {isSubmitting ? <Spinner size={18} colorClass="text-white" /> : 'Save'}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-[100px] h-[37px] bg-yellow-500 rounded-[8px] text-white font-semibold text-[14px] flex items-center justify-center hover:bg-yellow-600 transition"
                  >
                    {isSubmitting ? <Spinner size={18} colorClass="text-white" /> : 'Update'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      onSubmit({ type: '', date: '', quantity: 0, status: 'NEW' });
                    }}
                    disabled={isSubmitting}
                    className="w-[80px] h-[37px] bg-red-500 rounded-[8px] text-white font-semibold text-[14px] flex items-center justify-center hover:bg-red-600 transition"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {mode === 'damage' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Damage reason</label>
          <textarea
            {...register('damageReason')}
            rows={2}
            disabled={isSubmitting}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            placeholder="Optional: describe what caused the damage"
          />
        </div>
      )}
      </form>
      <AlertSnackbar
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        autoHideDuration={3000}
      />
    </>
  );
};

export default StockForm;
