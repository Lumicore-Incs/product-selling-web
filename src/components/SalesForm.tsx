import { MinusIcon, PlusIcon, RefreshCwIcon, SaveIcon, Trash2Icon, XIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { customerApi, CustomerRequestDTO, productApi, ProductDto } from '../services/api';
import { AlertSnackbar } from './AlertSnackbar';

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
  totalAmount?: number;
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
  onCustomerCreated,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact01: '',
    contact02: '',
    status: 'pending',
    qty: '',
    remark: '',
    items: [] as SaleItem[],
  });

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductQuantity, setSelectedProductQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ open: false, message: '', type: 'success' });
  const [defaultProduct, setDefaultProduct] = useState<ProductDto | null>(null);

  // Add this useEffect after the existing loadProducts useEffect
  useEffect(() => {
    const loadDefaultProduct = async () => {
      const productId = localStorage.getItem('productId');
      if (productId && products.length > 0) {
        const product = products.find((p) => p.productId?.toString() === productId);
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
        const activeProducts = fetchedProducts.filter(
          (p) => (p.status ?? '').toString().toLowerCase() === 'active'
        );
        setProducts(activeProducts);
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
        contact01: 0 + currentSale.contact01,
        contact02: 0 + currentSale.contact02,
        status: currentSale.status,
        qty: currentSale.qty,
        remark: currentSale.remark,
        items: currentSale.items || [],
      });
    }
  }, [currentSale, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddProduct = () => {
    if (selectedProductId && selectedProductQuantity > 0) {
      const product = products.find((p) => p.productId?.toString() === selectedProductId);
      if (product) {
        const newItem: SaleItem = {
          productId: product.productId!.toString(),
          productName: product.name,
          qty: selectedProductQuantity,
          price: product.price,
        };

        // Check if product already exists, update quantity if it does
        const existingItemIndex = formData.items.findIndex(
          (item) => item.productId === product.productId!.toString()
        );
        if (existingItemIndex >= 0) {
          const updatedItems = [...formData.items];
          updatedItems[existingItemIndex].qty += selectedProductQuantity;
          setFormData({
            ...formData,
            items: updatedItems,
          });
        } else {
          setFormData({
            ...formData,
            items: [...formData.items, newItem],
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
    const updatedItems = formData.items.filter((item) => item.productId !== productId);

    setFormData({
      ...formData,
      items: updatedItems,
    });
  };

  const handleUpdateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveProduct(productId);
      return;
    }

    const updatedItems = formData.items.map((item) =>
      item.productId === productId ? { ...item, qty: newQuantity } : item
    );

    setFormData({
      ...formData,
      items: updatedItems,
    });
  };

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  };

  // Helper: validate contact numbers (now accepts 10 digits with leading 0)
  const isContact01Valid = formData.contact01 === '' || /^0\d{9}$/.test(formData.contact01);
  const isContact02Valid = formData.contact02 === '' || /^0\d{9}$/.test(formData.contact02);
  const hasAtLeastOneContact = formData.contact01 !== '' || formData.contact02 !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate contact numbers
    if (!isContact01Valid) {
      setSnackbar({
        open: true,
        message: 'Whatsapp number must be exactly 10 digits starting with 0 if provided.',
        type: 'error',
      });
      setIsLoading(false);
      return;
    }

    if (!isContact02Valid) {
      setSnackbar({
        open: true,
        message: 'Contact number must be exactly 10 digits starting with 0 if provided.',
        type: 'error',
      });
      setIsLoading(false);
      return;
    }

    if (!hasAtLeastOneContact) {
      setSnackbar({
        open: true,
        message: 'At least one contact number (Whatsapp or Contact) is required.',
        type: 'error',
      });
      setIsLoading(false);
      return;
    }
    let tempCustomer = null;

    try {
      // Prepare items array based on the logic you described
      const finalItems: SaleItem[] = [...formData.items]; // Items added via plus icon

      // Check if user entered quantity in form and has default product
      if (formData.qty && formData.qty.trim() !== '' && defaultProduct) {
        const qtyNumber = parseInt(formData.qty);
        if (qtyNumber > 0) {
          // Check if default product is already in the items (added via plus icon)
          const existingDefaultItemIndex = finalItems.findIndex(
            (item) => item.productId === defaultProduct.productId!.toString()
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
              price: defaultProduct.price,
            };
            finalItems.push(defaultItem);
          }
        }
      }

      // Calculate total amount
      const totalAmount = finalItems.reduce((sum, item) => sum + item.qty * item.price, 0);

      // If editing, use the existing logic
      if (isEditing && currentSale) {
        onUpdate({
          ...formData,
          id: currentSale.id,
          items: finalItems,
          totalAmount: totalAmount,
        });
        resetForm();
        return;
      }

      // For new customers, save to backend
      // Remove leading 0 before sending to API (convert 10 digits to 9 digits)
      const contact01ForBackend = formData.contact01.startsWith('0')
        ? formData.contact01.substring(1)
        : formData.contact01;
      const contact02ForBackend = formData.contact02.startsWith('0')
        ? formData.contact02.substring(1)
        : formData.contact02;

      const customerData: CustomerRequestDTO = {
        name: formData.name,
        address: formData.address,
        contact01: contact01ForBackend,
        contact02: contact02ForBackend,
        qty: formData.qty,
        remark: formData.remark,
        totalPrice: totalAmount,
        items: finalItems.map((item) => ({
          productId: parseInt(item.productId),
          productName: item.productName,
          qty: item.qty,
          price: item.price,
          total: item.qty * item.price,
        })),
      };

      tempCustomer = customerData;

      const savedCustomer = await customerApi.createCustomer(customerData);

      // Notify parent component about the new customer
      if (onCustomerCreated) {
        onCustomerCreated(savedCustomer);
      }

      // Also call the original onSave for backward compatibility
      onSave({
        ...formData,
        items: finalItems,
        totalAmount: totalAmount,
      });

      resetForm();
      setSnackbar({
        open: true,
        message: 'Customer and order created successfully!',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Error saving customer:', error);
      setError(error.response?.data?.message || 'Failed to save customer. Please try again.');
      if (error.message === 'DUPLICATE_CUSTOMER') {
        const duplicateCustomer = tempCustomer;
        console.log('Duplicate customer data:', tempCustomer);
        setSnackbar({
          open: true,
          message: `Customer already exists! Name: ${duplicateCustomer.name}, Contact: ${
            duplicateCustomer.contact01 || duplicateCustomer.contact02
          }`,
          type: 'error',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Error creating customer!',
          type: 'error',
        });
      }
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
      remark: '',
      items: [],
    });
    setShowProductSelector(false);
    setSelectedProductId('');
    setSelectedProductQuantity(1);
    setError(null);
  };

  // Disable save if required fields are empty
  const isSaveDisabled =
    !formData.name.trim() ||
    !formData.address.trim() ||
    !hasAtLeastOneContact ||
    !isContact01Valid ||
    !isContact02Valid;

  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar((s) => ({ ...s, open: false }));
      }, 3000); // 3 seconds
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <AlertSnackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          {isEditing ? 'Edit Sale Entry' : 'Add New Sale'}
        </h2>
      </div>

      <div className="p-4 sm:p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information Section */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              Customer Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Customer Name */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter customer name"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter customer address"
                />
              </div>

              {/* Contact Numbers */}
              <div>
                <label htmlFor="contact01" className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number
                </label>
                <input
                  id="contact01"
                  name="contact01"
                  type="text"
                  value={formData.contact01}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base ${
                    formData.contact01 && !isContact01Valid
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="10 digits with 0 (e.g., 0771234567)"
                  maxLength={10}
                />
                {formData.contact01 && !isContact01Valid && (
                  <div className="text-xs text-red-600 mt-1">
                    WhatsApp number must be exactly 10 digits starting with 0.
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="contact02" className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  id="contact02"
                  name="contact02"
                  type="text"
                  value={formData.contact02}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base ${
                    formData.contact02 && !isContact02Valid
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  placeholder="10 digits with 0 (e.g., 0112345678)"
                  maxLength={10}
                />
                {formData.contact02 && !isContact02Valid && (
                  <div className="text-xs text-red-600 mt-1">
                    Contact number must be exactly 10 digits starting with 0.
                  </div>
                )}
                {!hasAtLeastOneContact && (
                  <div className="text-xs text-red-600 mt-1">
                    At least one contact number is required.
                  </div>
                )}
              </div>

              {/* Remark */}
              <div className="md:col-span-2">
                <label htmlFor="remark" className="block text-sm font-medium text-gray-700 mb-2">
                  Remark
                </label>
                <input
                  id="remark"
                  name="remark"
                  type="text"
                  value={formData.remark}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Optional remark"
                />
              </div>
            </div>
          </div>

          {/* Product Information Section */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Information</h3>

            {/* Default Product Quantity */}
            <div className="mb-4">
              <label htmlFor="qty" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  id="qty"
                  name="qty"
                  type="text"
                  value={formData.qty}
                  onChange={handleChange}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                  placeholder="Enter quantity"
                />
                <button
                  type="button"
                  onClick={() => setShowProductSelector(!showProductSelector)}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                >
                  <PlusIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Add Product</span>
                </button>
              </div>

              {defaultProduct && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-700">
                    Default Product: <span className="font-medium">{defaultProduct.name}</span>
                    <span className="ml-2 text-blue-600">(${defaultProduct.price})</span>
                  </div>
                </div>
              )}
            </div>

            {/* Product Selector */}
            {showProductSelector && (
              <div className="border border-gray-300 rounded-lg p-4 bg-white mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-medium text-gray-800">Add Product</h4>
                  <button
                    type="button"
                    onClick={() => setShowProductSelector(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Product
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    >
                      <option value="">Choose a product...</option>
                      {products.map((product) => (
                        <option key={product.productId} value={product.productId}>
                          {product.name} - ${product.price}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedProductQuantity}
                      onChange={(e) => setSelectedProductQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      disabled={!selectedProductId}
                      className={`flex-1 px-4 py-3 rounded-lg text-white font-medium transition-all duration-200 ${
                        selectedProductId
                          ? 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Add Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProductSelector(false)}
                      className="flex-1 sm:flex-initial px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Products List */}
            {formData.items.length > 0 && (
              <div className="border border-gray-300 rounded-lg p-4 bg-white">
                <h4 className="text-base font-medium text-gray-800 mb-4">Selected Products</h4>
                <div className="space-y-3">
                  {formData.items.map((item) => (
                    <div
                      key={item.productId}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800 text-base">
                            {item.productName}
                          </div>
                          <div className="text-sm text-gray-600">${item.price} each</div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-600 whitespace-nowrap">
                            Subtotal:{' '}
                            <span className="font-medium">
                              ${(item.qty * item.price).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) =>
                                handleUpdateItemQuantity(
                                  item.productId,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-16 px-2 py-2 border border-gray-300 rounded text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(item.productId)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                            >
                              <MinusIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total Amount */}
                  <div className="pt-4 border-t border-gray-300">
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-semibold text-gray-800">Total Amount:</span>
                      <span className="font-bold text-green-600 text-xl">
                        ${getTotalAmount().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {isEditing ? (
              <>
                <button
                  type="submit"
                  disabled={isLoading || isSaveDisabled}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  <RefreshCwIcon className="w-5 h-5" />
                  {isLoading ? 'Updating...' : 'Update Sale'}
                </button>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 font-medium"
                >
                  <XIcon className="w-5 h-5" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="submit"
                disabled={isLoading || isSaveDisabled}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:bg-green-400 disabled:cursor-not-allowed"
              >
                <SaveIcon className="w-5 h-5" />
                {isLoading ? 'Saving...' : 'Save Sale'}
              </button>
            )}

            <button
              type="button"
              onClick={resetForm}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-medium"
            >
              <Trash2Icon className="w-5 h-5" />
              Clear Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
