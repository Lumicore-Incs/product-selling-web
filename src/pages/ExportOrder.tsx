import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { Sale } from '../models/sales';
import { getAllProducts } from '../service/product';
import { getCurrentUser } from '../service/auth';
import { dashboardApiReturnData } from '../services/api';
import * as XLSX from 'xlsx';

interface ProductButton {
  id: string;
  name: string;
}

export const ExportOrder = () => {
  const [products, setProducts] = useState<ProductButton[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('all');
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ open: false, message: '', type: 'success' });

  const readValue = (row: Record<string, unknown>, keys: string[]) => {
    const rowEntries = Object.entries(row);
    for (const key of keys) {
      if (key in row) {
        return row[key];
      }

      const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
      const matchedEntry = rowEntries.find(([entryKey]) => {
        const normalizedEntryKey = entryKey.toLowerCase().replace(/\s+/g, '');
        return normalizedEntryKey === normalizedKey;
      });

      if (matchedEntry) {
        return matchedEntry[1];
      }
    }
    return '';
  };

  const parsePriceValue = (value: unknown): number => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    const cleaned = String(value ?? '')
      .replace(/,/g, '')
      .replace(/[^\d.-]/g, '')
      .trim();

    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const mapExportRowsToSales = (rows: Record<string, unknown>[]): Sale[] => {
    return rows.map((row, index) => {
      const idValue = readValue(row, ['ID', 'Id', 'id']);
      const nameValue = readValue(row, ['Name', 'Customer Name', 'customerName', 'name']);
      const addressValue = readValue(row, ['Address', 'address']);
      const descriptionValue = readValue(row, ['Description', 'description']);
      const whatsappValue = readValue(row, ['whatsapp No', 'Whatsapp No', 'Whatsapp', 'contact01']);
      const contact02Value = readValue(row, ['Contact02', 'contact02', 'Contact 02']);
      const priceValue = readValue(row, ['Price', 'price', 'Total Price', 'totalPrice']);
      const noteValue = readValue(row, ['Note', 'note']);

      const parsedPrice = parsePriceValue(priceValue);

      return {
        id: String(idValue || index + 1),
        name: String(nameValue || ''),
        customerName: String(nameValue || ''),
        address: String(addressValue || ''),
        contact01: String(whatsappValue || ''),
        contact02: String(contact02Value || ''),
        qty: 0,
        remark: String(noteValue || descriptionValue || ''),
        items: [],
        totalPrice: parsedPrice,
      };
    });
  };

  const extractRowsFromBlob = async (blob: Blob): Promise<Record<string, unknown>[]> => {
    try {
      const buffer = await blob.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames?.[0];
      if (!firstSheetName) {
        return [];
      }
      const firstSheet = workbook.Sheets[firstSheetName];
      const excelRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
        defval: '',
      });
      if (excelRows.length > 0) {
        return excelRows;
      }
    } catch {
    }

    try {
      const text = await blob.text();
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) {
        return parsed as Record<string, unknown>[];
      }
      if (parsed && typeof parsed === 'object') {
        const data = (parsed as { data?: unknown }).data;
        if (Array.isArray(data)) {
          return data as Record<string, unknown>[];
        }
      }
    } catch {
    }

    return [];
  };

  const loadOrdersFromExportApi = async (productName: string) => {
    setLoading(true);
    try {
      const blob = await dashboardApiReturnData.exportSalesExcel(productName);
      const rows = await extractRowsFromBlob(blob);
      const mappedSales = mapExportRowsToSales(rows);
      setOrders(mappedSales);
    } catch (err) {
      console.error('Failed to load export data:', err);
      setOrders([]);
      setSnackbar({ open: true, message: 'Failed to load export data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        setUserRole((user?.role || '').toUpperCase());
      } catch (err) {
        setUserRole('');
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await getAllProducts();
        const productList = Array.isArray(data) ? data : [];
        const items: ProductButton[] = productList.map((p: any) => ({
          id: String(p?.productId ?? ''),
          name: String(p?.name ?? 'Unnamed'),
        }));
        setProducts(items.filter((product) => product.id));
      } catch (err) {
        setProducts([]);
        setSnackbar({ open: true, message: 'Failed to load products', type: 'error' });
      }
    };

    loadProducts();
  }, []);

  const lastFetchedProductRef = useRef<string | null>(null);

  useEffect(() => {
    const selectedProductName =
      selectedProductId === 'all'
        ? 'all'
        : products.find((product) => product.id === selectedProductId)?.name || 'all';

    if (lastFetchedProductRef.current === selectedProductName) {
      return;
    }

    lastFetchedProductRef.current = selectedProductName;
    loadOrdersFromExportApi(selectedProductName);
  }, [selectedProductId, products]);

  const normalizedRole = userRole.replace(/\s+/g, '_');
  const isSuperUser =
    normalizedRole === 'SUPER_USER' ||
    normalizedRole === 'SUPERUSER' ||
    normalizedRole === 'SUPER USER';

  const filteredOrders = useMemo(() => orders, [orders]);

  const visibleIds = useMemo(
    () => filteredOrders.map((sale) => String(sale.id)),
    [filteredOrders]
  );

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExportExcel = async () => {
    const serialNumbers = Array.from(selectedIds);
    if (serialNumbers.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one row before exporting.',
        type: 'error',
      });
      return;
    }

    const selectedProductName =
      selectedProductId === 'all'
        ? 'all'
        : products.find((product) => product.id === selectedProductId)?.name || 'all';

    const selectedOrders = filteredOrders.filter((sale) => selectedIds.has(String(sale.id)));
    const excelRows = selectedOrders.map((sale) => ({
      ID: String(sale.id || ''),
      Name: String(sale.customerName || sale.name || ''),
      Address: String(sale.address || ''),
      Description: '',
      'Whatsapp No': String(sale.contact01 || ''),
      Contact02: String(sale.contact02 || ''),
      Price: Number.isFinite(sale.totalPrice) ? sale.totalPrice : 0,
      City: '',
      Note: String(sale.remark || ''),
    }));

    setIsExporting(true);
    try {
      const message = await dashboardApiReturnData.conformExport(serialNumbers);

      const workbook = XLSX.utils.book_new();
      const sheet = XLSX.utils.json_to_sheet(excelRows);
      XLSX.utils.book_append_sheet(workbook, sheet, 'SelectedOrders');
      const workbookArray = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([workbookArray], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const fileUrl = window.URL.createObjectURL(excelBlob);

      const downloadLink = document.createElement('a');
      downloadLink.href = fileUrl;
      downloadLink.download = `Selected_Sales_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setTimeout(() => {
        window.URL.revokeObjectURL(fileUrl);
      }, 60000);

      await loadOrdersFromExportApi(selectedProductName);
      setSelectedIds(new Set());

      setSnackbar({
        open: true,
        message: message || 'Export confirmation successful',
        type: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to confirm export',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!isSuperUser) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800">Export Orders</h2>
        <p className="text-sm text-gray-600 mt-2">Access restricted to super users only.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <AlertSnackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Export Orders</h2>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col gap-3">
          <div className="text-sm font-semibold text-gray-700">Products</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedProductId('all')}
              className={`px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                selectedProductId === 'all'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Products
            </button>
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => setSelectedProductId(product.id)}
                className={`px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${
                  selectedProductId === product.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {product.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>Selected: {selectedIds.size}</div>
          <div className="flex items-center gap-3">
            <span>{loading ? 'Loading...' : `${filteredOrders.length} orders`}</span>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 text-sm font-medium transition-colors"
            >
              {isExporting ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-[960px] w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th className="px-3 py-3 text-left">ID</th>
                <th className="px-3 py-3 text-left">Name</th>
                <th className="px-3 py-3 text-left">Address</th>
                <th className="px-3 py-3 text-left">Description</th>
                <th className="px-3 py-3 text-left">Whatsapp No</th>
                <th className="px-3 py-3 text-left">Contact02</th>
                <th className="px-3 py-3 text-left">Price</th>
                <th className="px-3 py-3 text-left">City</th>
                <th className="px-3 py-3 text-left">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td className="px-3 py-4 text-center text-gray-500" colSpan={10}>
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-center text-gray-500" colSpan={10}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((sale) => {
                  const id = String(sale.id);
                  const name = sale.customerName || sale.name || '';
                  const address = sale.address || '';
                  const description = '';
                  const whatsapp = sale.contact01 || '';
                  const contact02 = sale.contact02 || '';
                  const price = Number.isFinite(sale.totalPrice)
                    ? sale.totalPrice.toFixed(2)
                    : '0.00';
                  const city = '';
                  const note = sale.remark || '';

                  return (
                    <tr key={id} className="hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(id)}
                          onChange={() => toggleSelectOne(id)}
                          aria-label={`Select ${name || id}`}
                        />
                      </td>
                      <td className="px-3 py-3 text-gray-800">{id}</td>
                      <td className="px-3 py-3 text-gray-800">{name}</td>
                      <td className="px-3 py-3 text-gray-800">{address}</td>
                      <td className="px-3 py-3 text-gray-800">{description}</td>
                      <td className="px-3 py-3 text-gray-800">{whatsapp}</td>
                      <td className="px-3 py-3 text-gray-800">{contact02}</td>
                      <td className="px-3 py-3 text-gray-800">{price}</td>
                      <td className="px-3 py-3 text-gray-800">{city}</td>
                      <td className="px-3 py-3 text-gray-800">{note}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
