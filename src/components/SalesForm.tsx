import React, { useEffect, useState } from 'react';
import { SaveIcon, RefreshCwIcon, Trash2Icon, XIcon, PlusIcon, MinusIcon } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Sale {
  id: string;
  customerName: string;
  address: string;
  contact1: string;
  contact2: string;
  status: string;
  quantity: string;
  items: SaleItem[];
}

interface SalesFormProps {
  onSave: (sale: Omit<Sale, 'id'>) => void;
  onUpdate: (sale: Sale) => void;
  currentSale: Sale | null;
  isEditing: boolean;
  onCancelEdit: () => void;
}

// Sample products data
const sampleProducts: Product[] = [
  { id: '1', name: 'Laptop', price: 999.99 },
  { id: '2', name: 'Smartphone', price: 599.99 },
  { id: '3', name: 'Tablet', price: 399.99 },
  { id: '4', name: 'Headphones', price: 199.99 },
  { id: '5', name: 'Mouse', price: 29.99 },
  { id: '6', name: 'Keyboard', price: 79.99 },
  { id: '7', name: 'Monitor', price: 299.99 },
  { id: '8', name: 'Webcam', price: 89.99 },
];

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
    quantity: '',
    items: [] as SaleItem[]
  });

  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductQuantity, setSelectedProductQuantity] = useState(1);

  useEffect(() => {
    if (currentSale && isEditing) {
      setFormData({
        customerName: currentSale.customerName,
        address: currentSale.address,
        contact1: currentSale.contact1,
        contact2: currentSale.contact2,
        status: currentSale.status,
        quantity: currentSale.quantity,
        items: currentSale.items || []
      });
    }
  }, [currentSale, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddProduct = () => {
    if (selectedProductId && selectedProductQuantity > 0) {
      const product = sampleProducts.find(p => p.id === selectedProductId);
      if (product) {
        const newItem: SaleItem = {
          productId: product.id,
          productName: product.name,
          quantity: selectedProductQuantity,
          price: product.price
        };

        // Check if product already exists, update quantity if it does
        const existingItemIndex = formData.items.findIndex(item => item.productId === product.id);
        if (existingItemIndex >= 0) {
          const updatedItems = [...formData.items];
          updatedItems[existingItemIndex].quantity += selectedProductQuantity;
          setFormData({
            ...formData,
            items: updatedItems
          });
        } else {
          setFormData({
            ...formData,
            items: [...formData.items, newItem]
          });
        }

        // Reset selection
        setSelectedProductId('');
        setSelectedProductQuantity(1);
        setShowProductSelector(false);
      }
    }
  };

  const handleRemoveProduct = (productId: string) => {
    const updatedItems = formData.items.filter(item => item.productId !== productId);
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const handleUpdateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveProduct(productId);
      return;
    }

    const updatedItems = formData.items.map(item => 
      item.productId === productId 
        ? { ...item, quantity: newQuantity }
        : item
    );
    
    setFormData({
      ...formData,
      items: updatedItems
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
      quantity: '',
      items: []
    });
    setShowProductSelector(false);
    setSelectedProductId('');
    setSelectedProductQuantity(1);
  };

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        {isEditing ? 'Edit Sale Entry' : 'Add New Sale'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left side */}
            <div className="space-y-4">
              <div>
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input 
                  id="customerName" 
                  name="customerName" 
                  type="text" 
                  required 
                  value={formData.customerName} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input 
                  id="address" 
                  name="address" 
                  type="text" 
                  required 
                  value={formData.address} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <div className="flex items-center space-x-2">
                  <input 
                    id="quantity" 
                    name="quantity" 
                    type="text" 
                    required 
                    value={formData.quantity} 
                    onChange={handleChange} 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowProductSelector(!showProductSelector)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="space-y-4">
              <div>
                <label htmlFor="contact1" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact 1
                </label>
                <input 
                  id="contact1" 
                  name="contact1" 
                  type="text" 
                  required 
                  value={formData.contact1} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label htmlFor="contact2" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact 2
                </label>
                <input 
                  id="contact2" 
                  name="contact2" 
                  type="text" 
                  value={formData.contact2} 
                  onChange={handleChange} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
          </div>

          {/* Product Selector */}
          {showProductSelector && (
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Add Product</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Select Product
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a product...</option>
                    {sampleProducts.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - ${product.price}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={selectedProductQuantity}
                    onChange={(e) => setSelectedProductQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    disabled={!selectedProductId}
                    className={`px-4 py-2 rounded-md text-white ${
                      selectedProductId 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-400 cursor-not-allowed'
                    } transition-colors`}
                  >
                    Add Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProductSelector(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Selected Products List */}
          {formData.items.length > 0 && (
            <div className="border border-gray-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Selected Products</h3>
              <div className="space-y-2">
                {formData.items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{item.productName}</div>
                      <div className="text-sm text-gray-600">${item.price} each</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(item.productId)}
                        className="p-1 text-red-600 hover:text-red-800"
                      >
                        <MinusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-bold text-green-600">${getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {isEditing ? (
            <>
              <button type="submit" className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Update
              </button>
              <button type="button" onClick={onCancelEdit} className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors">
                <XIcon className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </>
          ) : (
            <button type="submit" className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              <SaveIcon className="w-4 h-4 mr-2" />
              Save
            </button>
          )}
          <button type="button" onClick={resetForm} className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
            <Trash2Icon className="w-4 h-4 mr-2" />
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};