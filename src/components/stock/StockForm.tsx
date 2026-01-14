import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertSnackbar } from '../AlertSnackbar';
import Spinner from '../Spinner';

export interface StockItem {
  stock_id?: number;
  type: string;
  date: string;
  quantity: number;
  totalQuantity?: number;
  status: 'NEW' | 'RETURN';
}

interface Props {
  onSubmit: (data: StockItem) => void;
  initialValues?: StockItem | null;
  existingItems: StockItem[];
}


const StockForm: React.FC<Props> = ({ onSubmit, initialValues, existingItems }) => {
  const { register, handleSubmit, reset, watch, setValue } = useForm<StockItem>({
      defaultValues: initialValues || {
      type: '',
      date: '',
      quantity: 0,
      status: 'NEW',
    },
  });

  // Set form values when initialValues changes (edit mode)
  React.useEffect(() => {
    if (initialValues) {
      // Reset form with initial values
      Object.entries(initialValues).forEach(([key, value]) => {
        setValue(key as keyof StockItem, value);
      });
    }
  }, [initialValues, setValue]);

  // Get unique types from existing items
  const uniqueTypes = Array.from(new Set(existingItems.map(item => item.type)))
    .filter(type => type) // Remove empty types
    .sort();

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
        className="bg-white p-6 rounded-lg shadow-md mb-6"
      >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select
            {...register('type')}
            disabled={isSubmitting}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="">Select type</option>
            {uniqueTypes.map((type: string) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
          {selectedType === 'Other' && (
            <input
              type="text"
              className="mt-2 block w-full border-gray-300 rounded-md shadow-sm"
              placeholder="Enter new type"
              value={newType}
              onChange={e => setNewType(e.target.value)}
              required
            />
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              {...register('date')}
              disabled={isSubmitting}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            {...register('quantity', { valueAsNumber: true })}
            disabled={isSubmitting}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            {...register('status')}
            disabled={isSubmitting}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="NEW">New</option>
            <option value="RETURN">Return</option>
          </select>
        </div>
      </div>
      <div className="mt-4 flex space-x-2">
        {!initialValues && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            {isSubmitting ? <Spinner size={18} colorClass="text-white" /> : 'Save'}
          </button>
        )}
        {initialValues && (
          <>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              {isSubmitting ? <Spinner size={18} colorClass="text-white" /> : 'Update'}
            </button>
            <button
              type="button"
              onClick={() => {
                reset(); // Reset form to empty state
                // Tell parent to exit edit mode
                onSubmit({
                  type: '',
                  date: '',
                  quantity: 0,
                  status: 'NEW'
                });
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </>
        )}
      </div>
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
