import React, { useEffect, useState } from 'react';
import { SaveIcon, RefreshCwIcon, Trash2Icon, XIcon, PlusIcon, MinusIcon } from 'lucide-react';
import { productApi, customerApi, ProductDto, CustomerRequestDTO, OrderItem } from '../services/api';

interface SaleItem {
  productId: string;
  productName: string;
  qty: number;
  price: number;
}

interface Sale {
  id: string;
  name: string;
  address: string;
  contact01: string;
  contact02: string;
  status: string;
  qty: string;
  remark: string;
  items: SaleItem[];
  totalAmount?: number; // Add total amount to the Sale interface
}

interface SalesFormProps {
  onSave: (sale: Omit<Sale, 'id'>) => void;
  onUpdate: (sale: Sale) => void;
  currentSale: Sale | null;
  isEditing: boolean;
  onCancelEdit: () => void;
  onCustomerCreated?: (customer: any) => void;
}

export const SalesForm: React.FC<SalesFormProps> = ({
                                                      onSave,
                                                      onUpdate,
                                                      currentSale,
                                                      isEditing,
                                                      onCancelEdit,
                                                      onCustomerCreated
                                                    }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact01: '',
    contact02: '',
    status: 'pending',
    qty: '',
    remark: '',
    items: [] as SaleItem[]
  });

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductQuantity, setSelectedProductQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [defaultProduct, setDefaultProduct] = useState<ProductDto | null>(null);

  // Add this useEffect after the existing loadProducts useEffect
  useEffect(() => {
    const loadDefaultProduct = async () => {
      const productId = localStorage.getItem('productId');
      if (productId && products.length > 0) {
        const product = products.find(p => p.productId?.toString() === productId);
        if (product) {
          setDefaultProduct(product);
        }
      }
    };

    loadDefaultProduct();
  }, [products]);

  // Load products from backend
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const fetchedProducts = await productApi.getAllProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Failed to load products:', error);
        setError('Failed to load products. Please try again.');
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    if (currentSale && isEditing) {
      setFormData({
        name: currentSale.name,
        address: currentSale.address,
        contact01: currentSale.contact01,
        contact02: currentSale.contact02,
        status: currentSale.status,
        qty: currentSale.qty,
        remark: currentSale.remark,
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
      const product = products.find(p => p.productId?.toString() === selectedProductId);
      if (product) {
        const newItem: SaleItem = {
          productId: product.productId!.toString(),
          productName: product.name,
          qty: selectedProductQuantity,
          price: product.price
        };

        // Check if product already exists, update quantity if it does
        const existingItemIndex = formData.items.findIndex(item => item.productId === product.productId!.toString());
        if (existingItemIndex >= 0) {
          const updatedItems = [...formData.items];
          updatedItems[existingItemIndex].qty += selectedProductQuantity;
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
            ? { ...item, qty: newQuantity }
            : item
    );

    setFormData({
      ...formData,
      items: updatedItems
    });
  };

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Prepare items array based on the logic you described
      let finalItems: SaleItem[] = [...formData.items]; // Items added via plus icon

      // Check if user entered quantity in form and has default product
      if (formData.qty && formData.qty.trim() !== '' && defaultProduct) {
        const qtyNumber = parseInt(formData.qty);
        if (qtyNumber > 0) {
          // Check if default product is already in the items (added via plus icon)
          const existingDefaultItemIndex = finalItems.findIndex(
              item => item.productId === defaultProduct.productId!.toString()
          );

          if (existingDefaultItemIndex >= 0) {
            // Add the form quantity to existing default product
            finalItems[existingDefaultItemIndex].qty += qtyNumber;
          } else {
            // Add default product with form quantity
            const defaultItem: SaleItem = {
              productId: defaultProduct.productId!.toString(),
              productName: defaultProduct.name,
              qty: qtyNumber,
              price: defaultProduct.price
            };
            finalItems.push(defaultItem);
          }
        }
      }

      // Calculate total amount
      const totalAmount = finalItems.reduce((sum, item) => sum + (item.qty * item.price), 0);

      // If editing, use the existing logic
      if (isEditing && currentSale) {
        onUpdate({
          ...formData,
          id: currentSale.id,
          items: finalItems,
          totalAmount: totalAmount
        });
        resetForm();
        return;
      }

      // For new customers, save to backend
      const customerData: CustomerRequestDTO = {
        name: formData.name,
        address: formData.address,
        contact01: formData.contact01,
        contact02: formData.contact02,
        qty: formData.qty,
        remark: formData.remark,
        totalPrice: totalAmount,
        items: finalItems.map(item => ({
          productId: parseInt(item.productId),
          productName: item.productName,
          qty: item.qty,
          price: item.price,
          total: item.qty * item.price
        }))
      };

      console.log('Customer data with items:', customerData);

      const savedCustomer = await customerApi.createCustomer(customerData);

      // Notify parent component about the new customer
      if (onCustomerCreated) {
        onCustomerCreated(savedCustomer);
      }

      // Also call the original onSave for backward compatibility
      onSave({
        ...formData,
        items: finalItems,
        totalAmount: totalAmount
      });

      resetForm();
      alert('Customer and order created successfully!');
    } catch (error: any) {
      console.error('Error saving customer:', error);
      setError(error.response?.data?.message || 'Failed to save customer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      contact01: '',
      contact02: '',
      status: 'pending',
      qty: '',
      remark:'',
      items: []
    });
    setShowProductSelector(false);
    setSelectedProductId('');
    setSelectedProductQuantity(1);
    setError(null);
  };

  return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {isEditing ? 'Edit Sale Entry' : 'Add New Sale'}
        </h2>

        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left side */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
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
                  <label htmlFor="qty" className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                        id="qty"
                        name="qty"
                        type="text"
                        value={formData.qty}
                        onChange={handleChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {defaultProduct && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500">
                            Default Product: {defaultProduct.name} (${defaultProduct.price})
                          </div>
                        </div>
                    )}
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
                    Whatsapp Number
                  </label>
                  <input
                      id="contact01"
                      name="contact01"
                      type="text"
                      required
                      value={formData.contact01}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="contact2" className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                      id="contact02"
                      name="contact02"
                      type="text"
                      value={formData.contact02}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="remark" className="block text-sm font-medium text-gray-700 mb-1">
                    Remark
                  </label>
                  <input
                      id="remark"
                      name="remark"
                      type="text"
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
                        {products.map(product => (
                            <option key={product.productId} value={product.productId}>
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
                          <div className="flex items-center space-x-3">
                            <div className="text-sm text-gray-600">
                              Subtotal: ${(item.qty * item.price).toFixed(2)}
                            </div>
                            <input
                                type="number"
                                min="1"
                                value={item.qty}
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
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold">Total Amount:</span>
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
                  <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                  >
                    <RefreshCwIcon className="w-4 h-4 mr-2" />
                    {isLoading ? 'Updating...' : 'Update'}
                  </button>
                  <button type="button" onClick={onCancelEdit} className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors">
                    <XIcon className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </>
            ) : (
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-400"
                >
                  <SaveIcon className="w-4 h-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save'}
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