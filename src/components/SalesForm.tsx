import { MinusIcon, PlusIcon, RefreshCwIcon, SaveIcon, Trash2Icon, XIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Sale, SaleItem } from '../models/sales';
import { customerApi, CustomerRequestDTO, productApi, ProductDto, CustomerDtoGet } from '../services/api';
import { AlertSnackbar } from './AlertSnackbar';

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
  onCancelEdit,
}) => {
  const [formData, setFormData] = useState({
    customerName: '',
    name: '',
    customerId: '',
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
  const [selectedProductQuantity, setSelectedProductQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ open: false, message: '', type: 'success' });
  const [defaultProduct, setDefaultProduct] = useState<ProductDto | null>(null);
  const [allCustomers, setAllCustomers] = useState<CustomerDtoGet[] | null>(null);
  const [isLookingUpCustomer, setIsLookingUpCustomer] = useState(false);
  const [customerInfoText, setCustomerInfoText] = useState('');
  const [manualTotalAmount, setManualTotalAmount] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<CustomerDtoGet[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [priceWarnings, setPriceWarnings] = useState<Set<string>>(new Set());

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
        customerName: currentSale.customerName,
        customerId: currentSale.customerId ?? '',
        address: currentSale.address,
        contact01: currentSale.contact01 ? 0 + currentSale.contact01 : '',
        contact02: currentSale.contact02 ? 0 + currentSale.contact02 : '',
        status: currentSale.status ?? 'pending',
        qty: String(currentSale.qty ?? ''),
        remark: currentSale.remark ?? '',
        items: currentSale.items || [],
      });
      
      // Load the saved total price as manual total amount
      if (currentSale.totalPrice) {
        setManualTotalAmount(currentSale.totalPrice.toFixed(2));
      } else {
        setManualTotalAmount('');
      }
    }
  }, [currentSale, isEditing]);

  // Parse customer info from text area and fill the form
  const parseCustomerInfoText = () => {
    if (!customerInfoText.trim()) return;

    const lines = customerInfoText.split('\n');

    let name = '';
    let address = '';
    let contact01 = '';
    let contact02 = '';
    let totalAmount = '';
    type ParsedQuickItem = { shortName: string; quantity: number };
    const parsedItems: ParsedQuickItem[] = [];

    let isItemsSection = false;

    lines.forEach((line) => {
      const l = line.trim();

      // Check if we're entering items section
      if (/^items\s*[-:]/i.test(l)) {
        isItemsSection = true;
        return;
      }

      // Parse items (numbered list like "1. Fc - 2", "2. Bl - 3")
      if (isItemsSection) {
        const cleaned = l.replace(/^\d+\.\s*/, '').trim();
        if (!cleaned) return;

        const qtyMatch = cleaned.match(/^(.*?)[\s\-:]+(\d+)$/);
        const shortName = (qtyMatch ? qtyMatch[1] : cleaned).trim();
        const quantityValue = qtyMatch ? Number(qtyMatch[2]) : 1;
        const quantity =
          Number.isFinite(quantityValue) && quantityValue > 0 ? Math.trunc(quantityValue) : 1;

        if (shortName) {
          parsedItems.push({ shortName, quantity });
        }
        return;
      }

      if (/^name\s*[-:]/i.test(l)) {
        name = l.split(/[-:]/).slice(1).join('-').trim();
      }

      if (/^address\s*[-:]/i.test(l)) {
        address = l.split(/[-:]/).slice(1).join('-').trim();
      }

      // Phone no 1 / WhatsApp
      if (/phone\s*no\s*1/i.test(l) || /whatsapp/i.test(l)) {
        const num = l.match(/\d{10}/); // 👈 EXACT 10 digits only
        if (num) {
          contact01 = num[0];
        }
      }

      // Phone no 2 / Contact
      if (/phone\s*no\s*2/i.test(l) || /contact/i.test(l)) {
        const num = l.match(/\d{10}/); // 👈 EXACT 10 digits only
        if (num) {
          contact02 = num[0];
        }
      }

      // Total amount
      if (/^total\s*amount\s*[-:]/i.test(l)) {
        const amountMatch = l.match(/[-:]\s*(\d+(?:\.\d+)?)/);
        if (amountMatch) {
          totalAmount = amountMatch[1];
        }
      }
    });

    // Match item short names with products
    const matchedItems: SaleItem[] = [];
    let matchedEntries = 0;

    parsedItems.forEach(({ shortName, quantity }) => {
      const product = products.find(
        (p) => p.shortName?.toLowerCase() === shortName.toLowerCase()
      );

      if (product) {
        const pid = product.productId == null ? '' : String(product.productId);
        const qtyToAdd = Math.max(Math.trunc(quantity) || 0, 1);
        const existingItem = matchedItems.find((item) => item.productId === pid);

        if (existingItem) {
          existingItem.qty += qtyToAdd;
          existingItem.total = existingItem.qty * existingItem.price;
        } else {
          matchedItems.push({
            productId: pid,
            productName: product.name,
            qty: qtyToAdd,
            price: product.price,
            total: qtyToAdd * product.price,
          });
        }
        matchedEntries += 1;
      }
    });

    setFormData((prev) => ({
      ...prev, // keep everything else SAME
      name: name || prev.name,
      customerName: name || prev.customerName,
      address: address || prev.address,
      contact01: contact01 || prev.contact01,
      contact02: contact02 || prev.contact02,
      items: matchedItems.length > 0 ? matchedItems : prev.items,
    }));

    let message = 'Customer details parsed successfully!';
    if (matchedEntries > 0) {
      message += ` ${matchedEntries} item${matchedEntries === 1 ? '' : 's'} matched.`;
    }
    const unmatched = parsedItems.length - matchedEntries;
    if (unmatched > 0) {
      message += ` ${unmatched} item${unmatched === 1 ? '' : 's'} could not be identified.`;
    }

    setSnackbar({
      open: true,
      message: message,
      type: 'success',
    });
  };

  // Search customers by name or contact number
  const handleSearchCustomer = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const customers = await ensureCustomersLoaded();
      const lowerQuery = query.toLowerCase();
      
      const results = customers.filter(
        (c) =>
          (c.customerName && c.customerName.toLowerCase().includes(lowerQuery)) ||
          (c.contact01 && c.contact01.includes(query)) ||
          (c.contact02 && c.contact02.includes(query))
      );
      
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (e) {
      console.error('Error searching customers:', e);
      setSearchResults([]);
    }
  };

  // Load selected customer into form
  const handleSelectCustomerFromSearch = (customer: CustomerDtoGet) => {
    const selectedCustomerName = customer.customerName || customer.name || '';

    setFormData((prev) => ({
      ...prev,
      name: selectedCustomerName || prev.name,
      customerName: selectedCustomerName || prev.customerName,
      address: customer.address || prev.address,
      contact01: ensureLeadingZero(customer.contact01) || prev.contact01,
      contact02: ensureLeadingZero(customer.contact02) || prev.contact02,
      customerId: String(customer.customerId ?? '') || prev.customerId,
    }));
    
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    
    setSnackbar({
      open: true,
      message: `Customer "${selectedCustomerName}" loaded successfully!`,
      type: 'success',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // If the quantity field changed and there's a default product, sync it with items
    if (name === 'qty') {
      syncDefaultProductWithQty(value);
      return;
    }

    // Auto-search when typing in name, contact01, or contact02 fields
    if (name === 'name' || name === 'contact01' || name === 'contact02') {
      handleSearchCustomer(value);
    }

    // Keep name and customerName in sync
    if (name === 'name') {
      setFormData((prev) => ({
        ...prev,
        name: value,
        customerName: value,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Normalize phone comparison by removing an optional leading 0 from user input
  const normalizePhoneForCompare = (phone: string) => {
    if (!phone) return '';
    return phone.startsWith('0') ? phone.slice(1) : phone;
  };

  const ensureLeadingZero = (phone?: string) => {
    if (!phone) return '';
    return phone.startsWith('0') ? phone : `0${phone}`;
  };

  // Lazy-load all customers once for lookup
  const ensureCustomersLoaded = async () => {
    if (allCustomers !== null) return allCustomers;
    const customers = await customerApi.getAllCustomers();
    setAllCustomers(customers);
    return customers;
  };

  // Try to lookup an existing customer by name or contact and prefill form
  // const lookupAndPrefillCustomer = async () => {
  //   try {
  //     setIsLookingUpCustomer(true);
  //     const customers = await ensureCustomersLoaded();
  //     const nameTrimmed = (formData.customerName || '').trim().toLowerCase();
  //     const c1 = normalizePhoneForCompare(formData.contact01 || '');
  //     const c2 = normalizePhoneForCompare(formData.contact02 || '');

  //     let matched: CustomerDtoGet | undefined;

  //     // Priority: contact match, otherwise exact name match
  //     if (c1 || c2) {
  //       matched = customers.find(
  //         (c) =>
  //           (c.contact01 && c.contact01 === c1) ||
  //           (c.contact02 && c.contact02 === c1) ||
  //           (c.contact01 && c.contact01 === c2) ||
  //           (c.contact02 && c.contact02 === c2)
  //       );
  //     }
  //     if (!matched && nameTrimmed) {
  //       matched = customers.find((c) => (c.name || '').trim().toLowerCase() === nameTrimmed);
  //     }

  //     if (matched) {
  //       setFormData((prev) => ({
  //         ...prev,
  //         name: matched.name || prev.name,
  //         customerName: matched.name || prev.customerName,
  //         address: matched.address || prev.address,
  //         contact01: ensureLeadingZero(matched.contact01) || prev.contact01,
  //         contact02: ensureLeadingZero(matched.contact02) || prev.contact02,
  //         customerId: String(matched.customerId ?? '') || prev.customerId,
  //       }));
  //       setSnackbar({
  //         open: true,
  //         message: 'Existing customer found. Details filled.',
  //         type: 'success',
  //       });
  //     }
  //   } catch (e) {
  //     // Silent fail; no blocking if lookup fails
  //   } finally {
  //     setIsLookingUpCustomer(false);
  //   }
  // };

  // Helper: sync the default product in items with the qty input value
  const syncDefaultProductWithQty = (qtyValue: string) => {
    const defaultPid = defaultProduct
      ? defaultProduct.productId == null
        ? ''
        : String(defaultProduct.productId)
      : null;

    let updatedItems = [...formData.items];

    if (defaultPid) {
      const existingIndex = updatedItems.findIndex((it) => it.productId === defaultPid);
      const parsed = parseInt(qtyValue || '0');

      if (!qtyValue || isNaN(parsed) || parsed <= 0) {
        // remove default product from items if present
        if (existingIndex >= 0) {
          updatedItems = updatedItems.filter((it) => it.productId !== defaultPid);
        }
      } else {
        // add or update default product entry
        const def = defaultProduct as ProductDto;
        const price = def.price;
        const name = def.name;
        if (existingIndex >= 0) {
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            qty: parsed,
            total: parsed * price,
          };
        } else {
          updatedItems.push({
            productId: defaultPid,
            productName: name,
            qty: parsed,
            price: price,
            total: parsed * price,
          });
        }
      }
    }

    setFormData({
      ...formData,
      qty: qtyValue,
      items: updatedItems,
    });
  };

  const handleAddProduct = () => {
    const quantity = parseInt(selectedProductQuantity, 10);

    if (selectedProductId && Number.isFinite(quantity) && quantity > 0) {
      const product = products.find(
        (p) => (p.productId == null ? '' : String(p.productId)) === selectedProductId
      );
      if (product) {
        const pid = product.productId == null ? '' : String(product.productId);
        const newItem: SaleItem = {
          productId: pid,
          productName: product.name,
          qty: quantity,
          price: product.price,
          total: quantity * product.price,
        };

        // Check if product already exists, update quantity if it does
        const existingItemIndex = formData.items.findIndex((item) => item.productId === pid);
        if (existingItemIndex >= 0) {
          const updatedItems = [...formData.items];
          updatedItems[existingItemIndex].qty += quantity;
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
        setSelectedProductQuantity('');
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
      item.productId === productId ? { ...item, qty: newQuantity, total: newQuantity * item.price } : item
    );

    // If the updated item is the default product, also update the default qty field
    const defaultPid = defaultProduct
      ? defaultProduct.productId == null
        ? ''
        : String(defaultProduct.productId)
      : null;
    if (defaultPid && productId === defaultPid) {
      // find the updated qty for the default product
      const updatedDefaultItem = updatedItems.find((it) => it.productId === defaultPid);
      setFormData({
        ...formData,
        items: updatedItems,
        qty: updatedDefaultItem ? String(updatedDefaultItem.qty) : formData.qty,
      });
    } else {
      setFormData({
        ...formData,
        items: updatedItems,
      });
    }
  };

  const handleUpdateItemPrice = (productId: string, newPrice: number) => {
    if (newPrice < 0) return;

    // Find the product to check if price exceeds original
    const product = products.find((p) => String(p.productId) === productId);
    const newWarnings = new Set(priceWarnings);
    
    if (product && newPrice > product.price) {
      newWarnings.add(productId);
    } else if (product) {
      newWarnings.delete(productId);
    }
    
    setPriceWarnings(newWarnings);

    const updatedItems = formData.items.map((item) =>
      item.productId === productId ? { ...item, price: newPrice, total: item.qty * newPrice } : item
    );

    setFormData({
      ...formData,
      items: updatedItems,
    });
  };

  const getTotalAmount = () => {
    if (manualTotalAmount !== '') {
      const manual = parseFloat(manualTotalAmount);
      return isNaN(manual) ? 0 : manual;
    }
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

    // Prepare items array
    const finalItems: SaleItem[] = [...formData.items];

    // Validate at least one product
    if (!(finalItems?.length > 0)) {
      setSnackbar({
        open: true,
        message: 'At least one product must be added.',
        type: 'error',
      });
      setIsLoading(false);
      return;
    }

    try {
      // Use getTotalAmount() to respect manual override
      const totalAmount = getTotalAmount();

      // If editing, use the existing logic
      if (isEditing && currentSale) {
        onUpdate({
          ...formData,
          id: currentSale.id,
          items: finalItems,
          totalPrice: totalAmount,
          qty: parseInt(formData.qty),
        });
        resetForm();
        return;
      }

      // Remove leading 0 before sending to API (convert 10 digits to 9 digits)
      const contact01ForBackend = formData.contact01.startsWith('0')
        ? formData.contact01.substring(1)
        : formData.contact01;
      const contact02ForBackend = formData.contact02.startsWith('0')
        ? formData.contact02.substring(1)
        : formData.contact02;

      // Append product short names with quantities to customer name
      const productShortNames = finalItems
        .map((item) => {
          const product = products.find((p) => String(p.productId) === item.productId);
          return product?.shortName ? `${product.shortName}${item.qty}` : '';
        })
        .filter((shortName) => shortName !== '')
        .join(' ');

        const customerNameForBackend = formData.name;
      
      const customerNameWithProducts = productShortNames 
        ? `${formData.name}(${productShortNames})`
        : formData.name;

      const customerData: CustomerRequestDTO = {
        customerName:customerNameForBackend,
        name: customerNameWithProducts,
        address: formData.address,
        contact01: contact01ForBackend,
        contact02: contact02ForBackend,
        qty: formData.qty,
        remark: formData.remark,
        totalPrice: totalAmount,
        items: finalItems.map((item) => ({
          productId: Number(item.productId) || 0,
          productName: item.productName,
          qty: item.qty,
          price: item.price,
          total: item.total ?? item.qty * item.price,
          orderDetailsId: Number(item.orderDetailsId) || 0,
          orderId: Number(item.orderId) || 0,
        })),
      };

      tempCustomer = customerData;

      await customerApi.createCustomer(customerData);

      // Also call the original onSave for backward compatibility
      onSave({
        ...formData,
        items: finalItems,
        totalPrice: totalAmount,
        qty: parseInt(formData.qty),
      });

      resetForm();
      setSnackbar({
        open: true,
        message: 'Customer and order created successfully!',
        type: 'success',
      });
    } catch (errUnknown) {
      console.error('Error saving customer:', errUnknown);
      const e = errUnknown as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message ?? 'Failed to save customer. Please try again.');
      if (e.message === 'DUPLICATE_CUSTOMER') {
        const duplicateCustomer = tempCustomer as (CustomerRequestDTO | null | undefined) | null;
        console.log('Duplicate customer data:', tempCustomer);
        setSnackbar({
          open: true,
          message: duplicateCustomer
            ? `Customer already exists! Name: ${duplicateCustomer.name}, Contact: ${
                duplicateCustomer.contact01 || duplicateCustomer.contact02
              }`
            : 'Customer already exists!',
          type: 'error',
        });
      } else {
        setSnackbar({ open: true, message: 'Error creating customer!', type: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      customerName: '',
      customerId: '',
      address: '',
      contact01: '',
      contact02: '',
      status: 'pending',
      qty: '',
      remark: '',
      items: [] as SaleItem[],
    });
    setCustomerInfoText('');
    setShowProductSelector(false);
    setSelectedProductId('');
    setSelectedProductQuantity('');
    setError(null);
    setManualTotalAmount('');
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setPriceWarnings(new Set());
  };

  // Fill the form with sample data for faster testing
  const fillSampleData = () => {
    const sampleProduct = defaultProduct ?? products[0] ?? null;
    const sampleItems: SaleItem[] = sampleProduct
      ? [
          {
            productId: sampleProduct.productId == null ? '' : String(sampleProduct.productId),
            productName: sampleProduct.name,
            qty: 2,
            price: sampleProduct.price,
            total: 2 * sampleProduct.price,
          },
        ]
      : [];

    setFormData({
      name: 'John Doe',
      customerName: 'John Doe',
      customerId: '',
      address: '123 Sample Street',
      contact01: '0771234563',
      contact02: '0771234566',
      status: 'pending',
      qty: sampleProduct ? '2' : '',
      remark: 'Sample order',
      items: sampleItems,
    });
    setSnackbar({ open: true, message: 'Sample data loaded', type: 'success' });
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

      {/* Customer Search Bar */}
      <div className="bg-blue-50 border-b border-blue-100 p-4 sm:p-6">
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🔍 Search Existing Customer
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchCustomer(e.target.value)}
                placeholder="Enter customer name or contact number..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                  {searchResults.map((customer, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectCustomerFromSearch(customer)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                    >
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-sm text-gray-500">
                        {customer.contact01 && <span>📱 {customer.contact01}</span>}
                        {customer.contact02 && <span> • {customer.contact02}</span>}
                      </div>
                      {customer.address && (
                        <div className="text-xs text-gray-400 mt-1">📍 {customer.address}</div>
                      )}
                    </button>
                  ))}</div>
              )}
              
              {showSearchResults && searchResults.length === 0 && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500 text-sm">
                  No customers found matching your search
                </div>
              )}
            </div>
            
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowSearchResults(false);
                }}
                className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium whitespace-nowrap"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
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

            {/* Quick Customer Info Input - Text Area */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Customer Info (Copy & Paste)
              </label>
              <div className="flex flex-col gap-2">
                <textarea
                  value={customerInfoText}
                  onChange={(e) => setCustomerInfoText(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base min-h-[120px] resize-vertical"
                  rows={4}
                  placeholder="Example:&#10;Name - John Doe&#10;Address - 123 Main St&#10;Phone no 1 - 0771234567&#10;Phone no 2 - 0112345678&#10;Total amount - 5000&#10;Items -&#10;1. vac - 2&#10;2. Se - 3"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={parseCustomerInfoText}
                    disabled={!customerInfoText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-all duration-200 font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
                  >
                    Parse & Fill Information
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerInfoText('')}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
                  >
                    Clear
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  Tip: Copy customer details from anywhere and paste above; include "- qty" after each item (e.g., "vac - 2") so quantities are captured.
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Customer Name */}
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <div className="relative">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={handleChange}
                    // onBlur={lookupAndPrefillCustomer}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
                    placeholder="Enter customer name"
                  />
                  {/* Search results dropdown for name */}
                  {showSearchResults && searchResults.length > 0 && searchQuery.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {searchResults.map((customer, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectCustomerFromSearch(customer)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150 text-sm"
                        >
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">
                            {customer.contact01 && <span>📱 {customer.contact01}</span>}
                            {customer.contact02 && <span> • {customer.contact02}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                <div className="relative">
                  <input
                    id="contact01"
                    name="contact01"
                    type="text"
                    value={formData.contact01}
                    onChange={handleChange}
                    // onBlur={lookupAndPrefillCustomer}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base ${
                      formData.contact01 && !isContact01Valid
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="10 digits with 0 (e.g., 0771234567)"
                    maxLength={10}
                  />
                  {/* Search results dropdown for contact01 */}
                  {showSearchResults && searchResults.length > 0 && searchQuery.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {searchResults.map((customer, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectCustomerFromSearch(customer)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150 text-sm"
                        >
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">
                            {customer.contact01 && <span>📱 {customer.contact01}</span>}
                            {customer.contact02 && <span> • {customer.contact02}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
                <div className="relative">
                  <input
                    id="contact02"
                    name="contact02"
                    type="text"
                    value={formData.contact02}
                    onChange={handleChange}
                    // onBlur={lookupAndPrefillCustomer}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base ${
                      formData.contact02 && !isContact02Valid
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-300'
                    }`}
                    placeholder="10 digits with 0 (e.g., 0112345678)"
                    maxLength={10}
                  />
                  {/* Search results dropdown for contact02 */}
                  {showSearchResults && searchResults.length > 0 && searchQuery.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {searchResults.map((customer, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectCustomerFromSearch(customer)}
                          className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150 text-sm"
                        >
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">
                            {customer.contact01 && <span>📱 {customer.contact01}</span>}
                            {customer.contact02 && <span> • {customer.contact02}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowProductSelector(!showProductSelector)}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 font-medium"
                >Add Product
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
                        // Ensure the key is always a primitive (string/number).
                        // product.productId may sometimes be undefined or an object in upstream data,
                        // so stringify to guarantee a unique primitive key.
                        <option key={String(product.productId)} value={product.productId}>
                          {product.name} - ${product.price}
                          {defaultProduct?.productId === product.productId
                            ? '  -  default product'
                            : ' '}
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
                      onChange={(e) => setSelectedProductQuantity(e.target.value)}
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
                  {formData.items.map((item, index) => (
                    // Use composite key with index to ensure uniqueness even when productId
                    // could be non-unique or unexpectedly an object. Index is acceptable here
                    // because items order is stable within the form and items are editable.
                    <div
                      key={`${String(item.productId)}-${index}`}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex-1">
                            <div className="font-medium text-gray-800 text-base">
                              {item.productName}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(item.productId)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                            >
                              <MinusIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="flex flex-col">
                            <label className="text-xs text-gray-600 mb-1">
                              Price ($)
                              {priceWarnings.has(item.productId) && (
                                <span className="ml-1 text-amber-600 font-semibold">⚠️</span>
                              )}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) =>
                                handleUpdateItemPrice(
                                  item.productId,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className={`px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                priceWarnings.has(item.productId)
                                  ? 'border-amber-400 bg-amber-50'
                                  : 'border-gray-300'
                              }`}
                            />
                            {priceWarnings.has(item.productId) && (
                              <div className="text-xs text-amber-700 mt-1">
                                ⚠️ Price is above original (${products.find((p) => String(p.productId) === item.productId)?.price.toFixed(2)})
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs text-gray-600 mb-1">Quantity</label>
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
                              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-xs text-gray-600 mb-1">Subtotal</label>
                            <div className="px-3 py-2 bg-green-50 border border-green-200 rounded text-sm font-semibold text-green-700">
                              ${(item.qty * item.price).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total Amount */}
                  <div className="pt-4 border-t border-gray-300">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <span className="font-semibold text-gray-800 text-sm">Calculated Total:</span>
                        <span className="font-medium text-gray-600 break-all text-right">
                          ${formData.items.reduce((sum, item) => sum + item.qty * item.price, 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="font-semibold text-gray-800 text-base sm:text-lg whitespace-nowrap">Total Amount:</label>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0 w-full">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={manualTotalAmount !== '' ? manualTotalAmount : formData.items.reduce((sum, item) => sum + item.qty * item.price, 0).toFixed(2)}
                            onChange={(e) => setManualTotalAmount(e.target.value)}
                            className="w-full min-w-0 sm:flex-1 py-2 border-2 border-green-300 rounded-lg text-base sm:text-xl font-bold text-green-700 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            placeholder="Enter total amount"
                          />
                          {manualTotalAmount !== '' && (
                            <button
                              type="button"
                              onClick={() => setManualTotalAmount('')}
                              className="w-full sm:w-auto px-3 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-all duration-200"
                              title="Reset to calculated total"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
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
            <button
              type="button"
              onClick={fillSampleData}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-400 transition-all duration-200 font-medium"
            >
              <RefreshCwIcon className="w-5 h-5" />
              Fill Sample
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};