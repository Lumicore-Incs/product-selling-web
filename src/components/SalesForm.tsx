import React, { useEffect, useState } from 'react';
import { SaveIcon, RefreshCwIcon, Trash2Icon, XIcon } from 'lucide-react';
interface Sale {
  id: string;
  customerName: string;
  address: string;
  contact1: string;
  contact2: string;
  status: string;
  quantity: string;
}
interface SalesFormProps {
  onSave: (sale: Omit<Sale, 'id'>) => void;
  onUpdate: (sale: Sale) => void;
  currentSale: Sale | null;
  isEditing: boolean;
  onCancelEdit: () => void;
}
export const SalesForm: React.FC<SalesFormProps> = ({
  onSave,
  onUpdate,
  currentSale,
  isEditing,
  onCancelEdit
}) => {
  const [formData, setFormData] = useState({
    customerName: '',
    address: '',
    contact1: '',
    contact2: '',
    status: 'pending',
    quantity: ''
  });
  useEffect(() => {
    if (currentSale && isEditing) {
      setFormData({
        customerName: currentSale.customerName,
        address: currentSale.address,
        
        contact1: currentSale.contact1,
        contact2: currentSale.contact2,
        status: currentSale.status,
        quantity: currentSale.quantity
      });
    }
  }, [currentSale, isEditing]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'quantity' ? parseInt(value) : value
    });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentSale) {
      onUpdate({
        ...formData,
        id: currentSale.id
      });
    } else {
      onSave(formData);
    }
    resetForm();
  };
  const resetForm = () => {
    setFormData({
      customerName: '',
      address: '',
      contact1: '',
      contact2: '',
      status: 'pending',
      quantity: ''
    });
  };
  return <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {isEditing ? 'Edit Sale Entry' : 'Add New Sale'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <input id="customerName" name="customerName" type="text" required value={formData.customerName} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input id="address" name="address" type="text" required value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="contact1" className="block text-sm font-medium text-gray-700 mb-1">
              Contact 1
            </label>
            <input id="contact1" name="contact1" type="text" required value={formData.contact1} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="contact2" className="block text-sm font-medium text-gray-700 mb-1">
              Contact 2
            </label>
            <input id="contact2" name="contact2" type="text" value={formData.contact2} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input id="quantity" name="quantity" type="text" required value={formData.quantity} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {isEditing ? <>
              <button type="submit" className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Update
              </button>
              <button type="button" onClick={onCancelEdit} className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors">
                <XIcon className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </> : <button type="submit" className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              <SaveIcon className="w-4 h-4 mr-2" />
              Save
            </button>}
          <button type="button" onClick={resetForm} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
            <Trash2Icon className="w-4 h-4 mr-2" />
            Clear
          </button>
        </div>
      </form>
    </div>;
};