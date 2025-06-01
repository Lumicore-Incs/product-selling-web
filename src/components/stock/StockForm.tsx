import React from 'react';
import { useForm } from 'react-hook-form';

interface StockItem {
  id?: number;
  type: string;
  date: string;
  quantity: number;
}

interface Props {
  onSubmit: (data: StockItem) => void;
  initialValues?: StockItem | null;
}

const types = ['Electronics', 'Groceries', 'Clothing', 'Furniture'];

const StockForm: React.FC<Props> = ({ onSubmit, initialValues }) => {
  const { register, handleSubmit, reset } = useForm<StockItem>({
    defaultValues: initialValues || {
      type: '',
      date: '',
      quantity: 0,
    },
  });

  const handleFormSubmit = (data: StockItem) => {
    onSubmit(data);
    if (!initialValues) {
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Type</label>
          <select {...register('type')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input type="date" {...register('date')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            {...register('quantity', { valueAsNumber: true })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
          />
        </div>
      </div>
      <div className="mt-4 flex space-x-2">
        {!initialValues && (
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
            Save
          </button>
        )}
        {initialValues && (
          <>
            <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">
              Update
            </button>
            <button type="button" onClick={() => reset()} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">
              Cancel
            </button>
          </>
        )}
      </div>
    </form>
  );
};

export default StockForm;