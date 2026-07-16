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

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizeDateValue = (value?: string | null) => {
  if (!value) return getTodayDateString();

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return getTodayDateString();
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const day = String(parsedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatDateTimeForBackend = (value?: string | null) => {
  const normalizedDate = normalizeDateValue(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    return `${normalizedDate}T00:00:00`;
  }

  return normalizedDate;
};

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
    nic: '',
    deliveryDate: getTodayDateString(),
    items: [] as SaleItem[],
  });

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductQuantity, setSelectedProductQuantity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ open: false, message: '', type: 'success' });
  const [defaultProduct, setDefaultProduct] = useState<ProductDto | null>(null);
  const [allCustomers, setAllCustomers] = useState<CustomerDtoGet[] | null>(null);

  const [customerInfoText, setCustomerInfoText] = useState('');
  const [manualTotalAmount, setManualTotalAmount] = useState<string>('');
  const [grandTotalOverride, setGrandTotalOverride] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [_searchResults, setSearchResults] = useState<CustomerDtoGet[]>([]);
  const [_showSearchResults, setShowSearchResults] = useState(false);
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
        nic: '',
        deliveryDate: normalizeDateValue((currentSale as Sale & { deliveryDate?: string }).deliveryDate),
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
    const unclassifiedLines: string[] = [];

    let isItemsSection = false;

    lines.forEach((line) => {
      const l = line.trim();
      if (!l) return;

      // Explicit section headers
      if (/^items\s*[-:]/i.test(l) || /^items$/i.test(l)) {
        isItemsSection = true;
        return;
      }

      // 1. Explicit Key-Value Matches (Old format)
      if (/^name\s*[-:]/i.test(l)) {
        name = l.split(/[-:]/).slice(1).join('-').trim();
        return;
      }
      if (/^address\s*[-:]/i.test(l)) {
        address = l.split(/[-:]/).slice(1).join('-').trim();
        return;
      }
      if (/phone\s*no\s*1/i.test(l) || /whatsapp/i.test(l)) {
        const num = l.match(/\d{10}/);
        if (num) contact01 = num[0];
        return;
      }
      if (/phone\s*no\s*2/i.test(l) || /contact/i.test(l)) {
        const num = l.match(/\d{10}/);
        if (num) contact02 = num[0];
        return;
      }
      if (/^total\s*amount\s*[-:]/i.test(l)) {
        const amountMatch = l.match(/[-:]\s*(\d+(?:\.\d+)?)/);
        if (amountMatch) {
          totalAmount = amountMatch[1];
        }
        return;
      }

      // Clean line from bullet points (e.g., "1. vac-2" -> "vac-2")
      const cleanedLine = l.replace(/^\d+\.\s*/, '').trim();
      if (!cleanedLine) return;

      // 2. Raw Phone Match (10 digits)
      const phoneOnlyMatch = cleanedLine.replace(/[\s-]/g, '').match(/^0\d{9}$/);
      if (phoneOnlyMatch) {
        if (!contact01) contact01 = phoneOnlyMatch[0];
        else if (!contact02) contact02 = phoneOnlyMatch[0];
        return;
      }

      // 3. Raw Item Match
      // Look for a known product or a format like "vac - 2" or "Se-2"
      const qtyMatch = cleanedLine.match(/^(.*?)[\s\-:]+(\d+)$/);
      if (qtyMatch || isItemsSection) {
        let shortName = '';
        let quantity = 1;

        if (qtyMatch) {
          shortName = qtyMatch[1].trim();
          quantity = Number(qtyMatch[2]);
        } else if (isItemsSection) {
          shortName = cleanedLine;
        }

        if (shortName) {
          // Verify if it's an item by checking products list or strict hyphen format
          const isKnownProduct = products.some(p => p.shortName?.toLowerCase() === shortName.toLowerCase() || p.name?.toLowerCase() === shortName.toLowerCase());
          const isStrictFormat = /^[a-zA-Z0-9_]+\s*[-:]\s*\d+$/.test(cleanedLine);

          if (isItemsSection || isKnownProduct || isStrictFormat) {
            parsedItems.push({ shortName, quantity: quantity > 0 ? quantity : 1 });
            return;
          }
        }
      }

      // 4. Raw Total Amount Match (purely numeric, not caught as phone)
      if (/^\d+(?:\.\d+)?$/.test(cleanedLine)) {
        if (!totalAmount) {
          totalAmount = cleanedLine;
          return;
        }
      }

      // 5. Unclassified Lines (Name or Address)
      unclassifiedLines.push(cleanedLine);
    });

    // Assign unclassified lines
    if (unclassifiedLines.length > 0) {
      if (!name && !address) {
        // Try to intelligently distinguish name and address based on address keywords
        const addressKeywords = /\b(street|st\.?|road|rd\.?|avenue|ave\.?|lane|mawatha|mw\.?|no\.?|colombo)\b/i;
        const startsWithNumber = /^\d+[\/\-a-zA-Z]*\s+[a-zA-Z]/;

        let addressIndex = -1;
        for (let i = 0; i < unclassifiedLines.length; i++) {
          if (addressKeywords.test(unclassifiedLines[i]) || startsWithNumber.test(unclassifiedLines[i])) {
            addressIndex = i;
            break;
          }
        }

        if (addressIndex !== -1) {
          // We found a line that looks like an address
          address = unclassifiedLines[addressIndex];
          unclassifiedLines.splice(addressIndex, 1);
          name = unclassifiedLines[0] || '';

          // If there are more unclassified lines, append them to the address
          if (unclassifiedLines.length > 1) {
            address += ', ' + unclassifiedLines.slice(1).join(', ');
          }
        } else {
          // Fallback: first line is name, rest is address
          name = unclassifiedLines[0];
          if (unclassifiedLines.length > 1) {
            address = unclassifiedLines.slice(1).join(', ');
          }
        }
      } else if (!address) {
        address = unclassifiedLines.join(', ');
      } else if (!name) {
        name = unclassifiedLines.join(' ');
      }
    }

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

    if (totalAmount) {
      setManualTotalAmount(totalAmount);
    }

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
    } catch (_e) {
      console.error('Error searching customers:', _e);
      setSearchResults([]);
    }
  };

  // Load selected customer into form
  /*  */

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
  //   } catch (_e) {
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

    setFormData((prev) => {
      let updatedItems = [...prev.items];

      if (defaultPid) {
        const existingIndex = updatedItems.findIndex((it) => it.productId === defaultPid);
        const parsed = parseInt(qtyValue || '0');

        if (!qtyValue || isNaN(parsed) || parsed <= 0) {
          if (existingIndex >= 0) {
            updatedItems = updatedItems.filter((it) => it.productId !== defaultPid);
          }
        } else {
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

      return {
        ...prev,
        qty: qtyValue,
        items: updatedItems,
      };
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

        setFormData((prev) => {
          const existingItemIndex = prev.items.findIndex((item) => item.productId === pid);
          if (existingItemIndex >= 0) {
            const updatedItems = [...prev.items];
            updatedItems[existingItemIndex] = {
              ...updatedItems[existingItemIndex],
              qty: updatedItems[existingItemIndex].qty + quantity,
              total: (updatedItems[existingItemIndex].qty + quantity) * updatedItems[existingItemIndex].price,
            };
            return { ...prev, items: updatedItems };
          }

          return { ...prev, items: [...prev.items, newItem] };
        });

        setSelectedProductId('');
        setSelectedProductQuantity('');
        setShowProductSelector(false);
      }
    }
  };

  const handleRemoveProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.productId !== productId),
    }));
  };

  const handleUpdateItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveProduct(productId);
      return;
    }

    setFormData((prev) => {
      const updatedItems = prev.items.map((item) =>
        item.productId === productId ? { ...item, qty: newQuantity, total: newQuantity * item.price } : item
      );

      const defaultPid = defaultProduct
        ? defaultProduct.productId == null
          ? ''
          : String(defaultProduct.productId)
        : null;

      if (defaultPid && productId === defaultPid) {
        const updatedDefaultItem = updatedItems.find((it) => it.productId === defaultPid);
        return {
          ...prev,
          items: updatedItems,
          qty: updatedDefaultItem ? String(updatedDefaultItem.qty) : prev.qty,
        };
      }

      return {
        ...prev,
        items: updatedItems,
      };
    });
  };

  const handleUpdateItemPrice = (productId: string, newPrice: number) => {
    if (newPrice < 0) return;

    const product = products.find((p) => String(p.productId) === productId);
    const newWarnings = new Set(priceWarnings);

    if (product && newPrice > product.price) {
      newWarnings.add(productId);
    } else if (product) {
      newWarnings.delete(productId);
    }

    setPriceWarnings(newWarnings);

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId ? { ...item, price: newPrice, total: item.qty * newPrice } : item
      ),
    }));
  };

  const calculateItemTotal = (item: SaleItem) => (item.qty || 0) * (item.price || 0);

  const getTotalAmount = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

    if (grandTotalOverride !== '') {
      const override = parseFloat(grandTotalOverride);
      return isNaN(override) ? itemsTotal : override;
    }

    if (manualTotalAmount !== '' && formData.items.length === 0) {
      const manual = parseFloat(manualTotalAmount);
      return isNaN(manual) ? 0 : manual;
    }

    return itemsTotal;
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
      const deliveryDateForBackend = formatDateTimeForBackend(formData.deliveryDate);

      // If editing, use the existing logic
      if (isEditing && currentSale) {
        onUpdate({
          ...formData,
          date: deliveryDateForBackend,
          deliveryDate: deliveryDateForBackend,
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
        customerName: customerNameForBackend,
        name: customerNameWithProducts,
        address: formData.address,
        contact01: contact01ForBackend,
        contact02: contact02ForBackend,
        qty: formData.qty,
        remark: formData.remark,
        date: deliveryDateForBackend,
        deliveryDate: deliveryDateForBackend,
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
        date: deliveryDateForBackend,
        deliveryDate: deliveryDateForBackend,
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
            ? `Customer already exists! Name: ${duplicateCustomer.name}, Contact: ${duplicateCustomer.contact01 || duplicateCustomer.contact02
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
      nic: '',
      deliveryDate: getTodayDateString(),
      items: [] as SaleItem[],
    });
    setCustomerInfoText('');
    setShowProductSelector(false);
    setSelectedProductId('');
    setSelectedProductQuantity('');
    setError(null);
    setManualTotalAmount('');
    setGrandTotalOverride('');
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
      nic: '',
      deliveryDate: getTodayDateString(),
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
    <div className="w-full h-full bg-transparent font-['Inter',sans-serif]">
      <AlertSnackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />

      <form onSubmit={handleSubmit} className="flex flex-col xl:flex-row gap-6 items-start">

        {/* Main Left Section */}
        <div className="flex-1 flex flex-col gap-5 w-full">

          {/* Search Bar & New Customer Button */}
          <div className="flex flex-col sm:flex-row gap-4 w-full bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
            <div className="relative flex-1 bg-white border border-[#BFF0EC] rounded-full h-[46px] flex items-center px-4">
              <svg className="w-4 h-4 text-[#0B818D] mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchCustomer(e.target.value)}
                className="p-2 w-full bg-transparent focus:outline-none text-[13px] text-gray-700 placeholder-gray-400 font-medium"
                placeholder="Search existing customer by name, phone or WhatsApp..."
              />
            </div>
            <button
              type="button"
              className="bg-[#0B818D]/70 text-white px-6 rounded-full text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-[#096B75] transition-colors h-[46px] min-w-[150px]"
            >
              <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24"><path d="M16 21l-1.42-3.15L11.43 16.4l3.15-1.42L16 11.83l1.42 3.15 3.15 1.42-3.15 1.42zM7.5 15.5l-2.27-5.07L0 8.16l5.23-2.27L7.5 .82l2.27 5.07L15 8.16l-5.23 2.27z" /></svg>
              Generate Customer
            </button>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col gap-5">
            <h3 className="text-[#134E4A] font-semibold text-[15px] flex items-center gap-3">
              <div className="w-[34px] h-[34px] bg-[#F0FDFA] rounded-full flex items-center justify-center text-[#0D9488]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              Customer Information
            </h3>

            <div className="flex flex-col gap-2 mb-2">
              <label className="text-[12px] sm:text-[13px] font-semibold text-slate-700">Quick Customer Info (Copy & Paste)</label>
              <textarea
                value={customerInfoText}
                onChange={(e) => setCustomerInfoText(e.target.value)}
                className="w-full min-h-[100px] p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-slate-50/50"
                placeholder="John Doe
123 Main St, Colombo
0771234567
0112345678
5000
vac-2
Se-2"
              />
              <div className="flex items-center gap-3 mt-1">
                <button
                  type="button"
                  onClick={parseCustomerInfoText}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors"
                >
                  Parse & Fill Information
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerInfoText('')}
                  className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white text-xs font-medium rounded-md transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#0F766E]">
                  Customer Name <span className="text-[#F43F5E]">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={handleChange}
                  className="w-full h-[44px] px-4 bg-white border border-[#BFF0EC] rounded-2xl text-[13px] text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0B818D]"
                  placeholder="Enter customer name"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#0F766E]">
                  Contact Number <span className="text-[#F43F5E]">*</span>
                </label>
                <input
                  name="contact01"
                  type="text"
                  value={formData.contact01}
                  onChange={handleChange}
                  className="w-full h-[44px] px-4 bg-white border border-[#BFF0EC] rounded-2xl text-[13px] text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0B818D]"
                  placeholder="Enter contact number"
                  maxLength={10}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#0F766E]">
                  WhatsApp Number
                </label>
                <input
                  name="contact02"
                  type="text"
                  value={formData.contact02}
                  onChange={handleChange}
                  className="w-full h-[44px] px-4 bg-white border border-[#BFF0EC] rounded-2xl text-[13px] text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0B818D]"
                  placeholder="Enter WhatsApp number"
                  maxLength={10}
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[11px] font-semibold text-[#0F766E]">
                  Address <span className="text-[#F43F5E]">*</span>
                </label>
                <textarea
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-[#BFF0EC] rounded-2xl text-[13px] text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0B818D] min-h-[90px] resize-none"
                  placeholder="Enter customer address"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-[11px] text-[#2DD4BF] font-medium">0 / 250</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#0F766E]">
                  Delivery Date
                </label>
                <input
                  name="deliveryDate"
                  type="date"
                  value={formData.deliveryDate || getTodayDateString()}
                  onChange={handleChange}
                  className="w-full h-[44px] px-4 bg-white border border-[#BFF0EC] rounded-2xl text-[13px] text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0B818D]"
                />
              </div>
              {/* Remark Section */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[11px] font-semibold text-[#0F766E]">Remark</label>
                <input
                  name="remark"
                  type="text"
                  value={formData.remark}
                  onChange={handleChange}
                  className="w-full h-[44px] px-4 bg-white border border-[#BFF0EC] rounded-2xl text-[13px] text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-[#0B818D]"
                  placeholder="Optional remark"
                />
              </div>
            </div>

          </div>

          {/* Products */}
          {/* ================= PRODUCTS SECTION (Responsive) ================= */}
          <div className="bg-white rounded-[24px] p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
            {/* ---------- Header ---------- */}
            <div className="flex items-center justify-between gap-3 mb-2 sm:mb-4">
              <h3 className="text-[#0B818D] font-semibold text-[15px] flex items-center gap-3">
                <div className="w-[34px] h-[34px] shrink-0 bg-[#F0FDFA] rounded-full flex items-center justify-center text-[#0B818D]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                  </svg>
                </div>
                Products
              </h3>
              <button
                type="button"
                onClick={() => setShowProductSelector(true)}
                className="bg-[#0B818D] text-white px-4 sm:px-5 h-[38px] shrink-0 rounded-full text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#096B75] transition-colors"
              >
                <span className="text-lg leading-none mb-0.5">+</span> Add Product
              </button>
            </div>

            <div className="w-full md:overflow-x-auto pb-4">
              {/* block on mobile -> real table from md up */}
              <table className="w-full text-left border-collapse block md:table md:min-w-[650px]">
                {/* Head is hidden on mobile — labels are rendered inside each cell instead */}
                <thead className="hidden md:table-header-group">
                  <tr className="border-b-0">
                    <th className="pb-3 px-2 text-[11px] font-bold text-[#14B8A6] w-[30px]">#</th>
                    <th className="pb-3 px-2 text-[11px] font-bold text-[#14B8A6] min-w-[200px]">Product</th>
                    <th className="pb-3 px-2 text-[11px] font-bold text-[#14B8A6] w-[110px]">Quantity</th>
                    <th className="pb-3 px-2 text-[11px] font-bold text-[#14B8A6] w-[100px]">Unit Price <br />(Rs.)</th>
                    <th className="pb-3 px-2 text-[11px] font-bold text-[#14B8A6] w-[90px]">Discount <br />(Rs.)</th>
                    <th className="pb-3 px-2 text-[11px] font-bold text-[#14B8A6] w-[80px]">Total <br />(Rs.)</th>
                    <th className="pb-3 px-2 text-[11px] font-bold text-[#14B8A6] w-[50px] text-center">Action</th>
                  </tr>
                </thead>

                <tbody className="block md:table-row-group">
                  {formData.items.map((item, index) => (
                    <tr
                      key={`${item.productId}-${index}`}
                      className="block md:table-row mb-3 md:mb-0 rounded-[18px] md:rounded-none border border-[#D90000] md:border-0 bg-[#0D9488]/10 md:bg-transparent p-3 md:p-0"
                    >
                      {/* # */}
                      <td className="block md:table-cell py-0 md:py-3 px-0 md:px-2 text-[13px] text-[#14B8A6] font-semibold">
                        <span className="md:hidden text-[11px] font-bold uppercase tracking-wide">Item {index + 1}</span>
                        <span className="hidden md:inline">{index + 1}</span>
                      </td>

                      {/* Product */}
                      <td className="flex items-center justify-between gap-3 md:table-cell py-2.5 md:py-3 px-0 md:px-2 border-t border-[#BFF0EC]/60 md:border-0 mt-2 md:mt-0 pt-3 md:pt-3">
                        <span className="md:hidden text-[11px] font-bold text-[#14B8A6] shrink-0">Product</span>
                        <div className="relative flex-1 min-w-0 max-w-[62%] md:max-w-none">
                          <select
                            value={item.productId}
                            onChange={(_e) => {
                              // Custom logic to update the product inline
                            }}
                            disabled
                            className="w-full h-[40px] px-3.5 border border-[#BFF0EC] rounded-[14px] text-[13px] text-[#0B818D] bg-white appearance-none pr-8 focus:outline-none truncate"
                          >
                            <option value={item.productId}>{item.productName}</option>
                          </select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#0B818D]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="flex items-center justify-between gap-3 md:table-cell py-2.5 md:py-3 px-0 md:px-2">
                        <span className="md:hidden text-[11px] font-bold text-[#14B8A6] shrink-0">Quantity</span>
                        <div className="flex items-center w-[96px] h-[40px] shrink-0 bg-white border border-[#BFF0EC] rounded-[14px] overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(item.productId, Math.max(1, item.qty - 1))}
                            className="w-8 h-full flex items-center justify-center text-[#14B8A6] hover:bg-teal-50"
                          >
                            <span className="text-xl leading-none -mt-1">-</span>
                          </button>
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleUpdateItemQuantity(item.productId, parseInt(e.target.value) || 1)}
                            className="flex-1 w-full h-full text-center text-[13px] text-[#0B818D] bg-transparent focus:outline-none border-x border-[#BFF0EC]/50"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQuantity(item.productId, item.qty + 1)}
                            className="w-8 h-full flex items-center justify-center text-[#14B8A6] hover:bg-teal-50"
                          >
                            <span className="text-lg leading-none -mt-0.5">+</span>
                          </button>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="flex items-center justify-between gap-3 md:table-cell py-2.5 md:py-3 px-0 md:px-2">
                        <span className="md:hidden text-[11px] font-bold text-[#14B8A6] shrink-0">Unit Price (Rs.)</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleUpdateItemPrice(item.productId, parseFloat(e.target.value) || 0)}
                          className="w-[96px] md:w-[85px] h-[40px] px-3 border border-[#BFF0EC] rounded-[14px] text-[13px] text-[#0B818D] bg-white focus:outline-none"
                        />
                      </td>

                      {/* Discount */}
                      <td className="flex items-center justify-between gap-3 md:table-cell py-2.5 md:py-3 px-0 md:px-2">
                        <span className="md:hidden text-[11px] font-bold text-[#14B8A6] shrink-0">Discount (Rs.)</span>
                        <input
                          type="number"
                          value="0"
                          readOnly
                          className="w-[96px] md:w-[75px] h-[40px] px-3 border border-[#BFF0EC] rounded-[14px] text-[13px] text-[#0B818D] bg-white focus:outline-none"
                        />
                      </td>

                      {/* Total */}
                      <td className="flex items-center justify-between gap-3 md:table-cell py-2.5 md:py-3 px-0 md:px-2">
                        <span className="md:hidden text-[11px] font-bold text-[#14B8A6] shrink-0">Total (Rs.)</span>
                        <span className="text-[13px] text-[#0B818D] font-bold">
                          {calculateItemTotal(item).toFixed(2)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="flex items-center justify-between gap-3 md:table-cell py-2.5 md:py-3 px-0 md:px-2 md:text-center">
                        <span className="md:hidden text-[11px] font-bold text-[#14B8A6] shrink-0">Action</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(item.productId)}
                          className="w-[34px] h-[34px] md:mx-auto flex items-center justify-center text-[#F43F5E] bg-[#FFF1F2] rounded-xl hover:bg-rose-100 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* ---------- Inline popup for adding new product ---------- */}
                  {showProductSelector && (
                    <tr className="block md:table-row mb-3 md:mb-0 rounded-[18px] md:rounded-none border border-dashed border-[#BFF0EC] md:border-0 bg-[#F0FDFA]/40 md:bg-transparent p-3 md:p-0">
                      <td className="block md:table-cell py-0 md:py-3 px-0 md:px-2 text-[13px] text-[#14B8A6] font-semibold">
                        <span className="md:hidden text-[11px] font-bold uppercase tracking-wide">New item {formData.items.length + 1}</span>
                        <span className="hidden md:inline">{formData.items.length + 1}</span>
                      </td>

                      <td className="flex items-center justify-between gap-3 md:table-cell py-2.5 md:py-3 px-0 md:px-2 border-t border-[#BFF0EC]/60 md:border-0 mt-2 md:mt-0 pt-3 md:pt-3">
                        <span className="md:hidden text-[11px] font-bold text-[#14B8A6] shrink-0">Product</span>
                        <div className="relative flex-1 min-w-0 max-w-[62%] md:max-w-none">
                          <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full h-[40px] px-3.5 border border-[#BFF0EC] rounded-[14px] text-[13px] text-[#0B818D] bg-white appearance-none pr-8 focus:outline-none"
                          >
                            <option value="">Select product</option>
                            {products.map((product) => (
                              <option key={String(product.productId)} value={product.productId}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-[#0B818D]">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </td>

                      <td className="flex items-center justify-between gap-3 md:table-cell py-2.5 md:py-3 px-0 md:px-2">
                        <span className="md:hidden text-[11px] font-bold text-[#14B8A6] shrink-0">Quantity</span>
                        <div className="flex items-center w-[96px] h-[40px] shrink-0 bg-white border border-[#BFF0EC] rounded-[14px] overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setSelectedProductQuantity(String(Math.max(1, (parseInt(selectedProductQuantity) || 1) - 1)))}
                            className="w-8 h-full flex items-center justify-center text-[#14B8A6] hover:bg-teal-50"
                          >
                            <span className="text-xl -mt-1">-</span>
                          </button>
                          <input
                            type="number"
                            value={selectedProductQuantity}
                            onChange={(e) => setSelectedProductQuantity(e.target.value)}
                            className="flex-1 w-full h-full text-center text-[13px] text-[#0B818D] border-x border-[#BFF0EC]/50 focus:outline-none bg-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setSelectedProductQuantity(String((parseInt(selectedProductQuantity) || 0) + 1))}
                            className="w-8 h-full flex items-center justify-center text-[#14B8A6] hover:bg-teal-50"
                          >
                            <span className="text-lg -mt-0.5">+</span>
                          </button>
                        </div>
                      </td>

                      {/* colSpan only matters from md up; on mobile this is a block */}
                      <td colSpan={4} className="block md:table-cell py-2.5 md:py-3 px-0 md:px-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleAddProduct}
                            disabled={!selectedProductId}
                            className="flex-1 md:flex-none h-[40px] px-4 bg-[#0B818D] text-white rounded-[14px] text-[12px] font-semibold disabled:opacity-50"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowProductSelector(false)}
                            className="flex-1 md:flex-none h-[40px] px-4 bg-gray-100 text-gray-600 rounded-[14px] text-[12px] font-semibold"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="mt-2">
                <button
                  type="button"
                  className="text-[#0B818D] text-[13px] font-semibold flex items-center gap-1.5 hover:opacity-80"
                  onClick={() => setShowProductSelector(true)}
                >
                  <span className="text-lg leading-none mb-0.5">+</span> Add another product
                </button>
              </div>

              {/* ---------- Action Buttons ---------- */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isLoading || isSaveDisabled}
                  className="p-2 flex-1 h-[38px] bg-[#4ade80] text-white rounded-[10px] font-medium text-[13px] flex items-center justify-center gap-1.5 hover:bg-[#3bc06c] transition-colors "
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></polyline><polyline points="7 3 7 8 15 8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></polyline></svg>
                  {isLoading ? 'Saving...' : (isEditing ? 'Update Sale' : 'Save Sale')}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="p-2 flex-1 h-[38px] bg-[#ef4444] text-white rounded-[10px] font-medium text-[13px] flex items-center justify-center gap-1.5 hover:bg-[#dc2626] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Clear Form
                </button>
              </div>
            </div>
          </div>


        </div>

        {/* Right Summary Section */}
        <div className="w-full xl:w-[320px] shrink-0">
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 flex flex-col gap-5 sticky top-6">

            <h3 className="text-[#134E4A] font-semibold text-[15px] flex items-center gap-3">
              <div className="w-[34px] h-[34px] bg-[#F0FDFA] rounded-full flex items-center justify-center text-[#0D9488]">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              Order Summary
            </h3>

            <div className="flex flex-col gap-4 mt-2">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#0D9488] flex items-center gap-2.5 font-medium">
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M3 15h18"></path><path d="M9 3v18"></path><path d="M15 3v18"></path></svg>
                  Total Items
                </span>
                <span className="font-bold text-gray-900">{formData.items.length}</span>
              </div>

              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#0D9488] flex items-center gap-2.5 font-medium">
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  Subtotal
                </span>
                <span className="font-bold text-gray-900">Rs. {getTotalAmount().toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#0D9488] flex items-center gap-2.5 font-medium">
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path>
                    <path d="m15 9-6 6"></path>
                    <path d="M9 9h.01"></path>
                    <path d="M15 15h.01"></path>
                  </svg>
                  Discount
                  <svg className="w-[14px] h-[14px] text-[#2DD4BF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </span>
                <input
                  type="number"
                  value="0"
                  readOnly
                  className="w-[70px] h-[30px] px-2 border border-[#BFF0EC] bg-white rounded-[10px] text-center text-sm text-gray-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-between items-center font-bold mt-2 gap-3">
                <span className="text-[#134E4A] text-[14px]">Grand Total</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#0B818D] text-[13px]">Rs.</span>
                  <input
                    type="number"
                    value={grandTotalOverride}
                    onChange={(e) => setGrandTotalOverride(e.target.value)}
                    placeholder={getTotalAmount().toFixed(2)}
                    className="w-[110px] h-[36px] px-2 border border-[#BFF0EC] bg-white rounded-[10px] text-center text-sm text-gray-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 mt-4 bg-[#F0FDFA] p-4 rounded-[14px]">
              <span className="text-[#0D9488] shrink-0 mt-[1px]">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </span>
              <p className="text-[12px] sm:text-[13px] text-[#0D9488] leading-relaxed font-medium">
                You can save the order and continue to process payment later.
              </p>
            </div>

          </div>
        </div>
      </form>
    </div>
  );
};
