import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { Sale } from '../models/sales';
import { getAllProducts } from '../service/product';
import { getCurrentUser } from '../service/auth';
import { dashboardApiReturnData, ProductQtyDto } from '../services/api';
import * as XLSX from 'xlsx';

interface ProductButton {
  id: string;
  name: string;
}

interface ProductSummary {
  productName: string;
  totalQty: number;
  shortName: string;
}

const PRODUCT_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-600', text: 'text-blue-700', qty: 'text-blue-900' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-600', text: 'text-emerald-700', qty: 'text-emerald-900' },
  { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-600', text: 'text-violet-700', qty: 'text-violet-900' },
  { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500', text: 'text-amber-700', qty: 'text-amber-900' },
  { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-600', text: 'text-rose-700', qty: 'text-rose-900' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', badge: 'bg-cyan-600', text: 'text-cyan-700', qty: 'text-cyan-900' },
  { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-500', text: 'text-orange-700', qty: 'text-orange-900' },
  { bg: 'bg-pink-50', border: 'border-pink-200', badge: 'bg-pink-600', text: 'text-pink-700', qty: 'text-pink-900' },
];

export const ExportOrder = () => {
  const [products, setProducts] = useState<ProductButton[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('all');
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dashboard summary state
  const [productSummaries, setProductSummaries] = useState<ProductSummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [totalPendingOrders, setTotalPendingOrders] = useState(0);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ open: false, message: '', type: 'success' });

  // ─── Fetch pending orders for dashboard summary ───────────────────────────
  const fetchPendingSummary = async () => {
    setSummaryLoading(true);
    try {
      const productQtyData: ProductQtyDto[] = await dashboardApiReturnData.getOrderQtySummary();

      setTotalPendingOrders(productQtyData.length);

      // Transform and sort the data
      const summaries: ProductSummary[] = productQtyData
        .map((item) => ({
          productName: item.productName,
          shortName: item.productName.substring(0, 4).toUpperCase(), // Use first 4 chars as short name
          totalQty: item.totalQty,
        }))
        .sort((a, b) => b.totalQty - a.totalQty);

      setProductSummaries(summaries);
    } catch (err) {
      console.error('Failed to fetch pending summary:', err);
      setProductSummaries([]);
    } finally {
      setSummaryLoading(false);
    }
  };

  // ─── Existing helpers ─────────────────────────────────────────────────────
  const readValue = (row: Record<string, unknown>, keys: string[]) => {
    const rowEntries = Object.entries(row);
    for (const key of keys) {
      if (key in row) return row[key];
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '');
      const matchedEntry = rowEntries.find(([entryKey]) => {
        const normalizedEntryKey = entryKey.toLowerCase().replace(/\s+/g, '');
        return normalizedEntryKey === normalizedKey;
      });
      if (matchedEntry) return matchedEntry[1];
    }
    return '';
  };

  const parsePriceValue = (value: unknown): number => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const cleaned = String(value ?? '')
      .replace(/,/g, '')
      .replace(/[^\d.-]/g, '')
      .trim();
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const mapExportRowsToSales = (rows: Record<string, unknown>[]): Sale[] =>
    rows.map((row, index) => {
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

  const extractRowsFromBlob = async (blob: Blob): Promise<Record<string, unknown>[]> => {
    try {
      const buffer = await blob.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames?.[0];
      if (!firstSheetName) return [];
      const firstSheet = workbook.Sheets[firstSheetName];
      const excelRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: '' });
      if (excelRows.length > 0) return excelRows;
    } catch {}
    try {
      const text = await blob.text();
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
      if (parsed && typeof parsed === 'object') {
        const data = (parsed as { data?: unknown }).data;
        if (Array.isArray(data)) return data as Record<string, unknown>[];
      }
    } catch {}
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

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchPendingSummary();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        setUserRole((user?.role || '').toUpperCase());
      } catch {
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
      } catch {
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
    if (lastFetchedProductRef.current === selectedProductName) return;
    lastFetchedProductRef.current = selectedProductName;
    loadOrdersFromExportApi(selectedProductName);
  }, [selectedProductId, products]);

  // ─── Derived state ────────────────────────────────────────────────────────
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
      setTimeout(() => window.URL.revokeObjectURL(fileUrl), 60000);

      await loadOrdersFromExportApi(selectedProductName);
      // Refresh summary after export
      fetchPendingSummary();
      setSelectedIds(new Set());
      setSnackbar({
        open: true,
        message: message || 'Export confirmation successful',
        type: 'success',
      });
    } catch {
      setSnackbar({ open: true, message: 'Failed to confirm export', type: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  // ─── Access guard ─────────────────────────────────────────────────────────
  if (!isSuperUser) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800">Export Orders</h2>
        <p className="text-sm text-gray-600 mt-2">Access restricted to super users only.</p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* ── Dashboard Summary Section ── */}
      <div className=" rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 flex items-center justify-between bg-transparent text-[#0E626E]" style={{fontFamily:'Plus Jakarta Sans', fontWeight: 'bold'}}>
          <div>
            <h2 className="text-lg sm:text-xl font-bold  tracking-tight">
              Pending Orders Summary
            </h2>
            <p className="text-slate-300 text-xs mt-0.5">Live stock of unprocessed orders</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Total orders badge */}
            <div className="bg-[#0E626E]/50 rounded-lg px-3 py-2 text-center">
              <div className="text-white font-bold text-lg leading-tight">
                {summaryLoading ? '—' : totalPendingOrders}
              </div>
              <div className="text-slate-300 text-xs">Total Orders</div>
            </div>
            {/* Refresh button */}
            <button
              type="button"
              onClick={fetchPendingSummary}
              disabled={summaryLoading}
              className="p-2 rounded-lg bg-[#0E626E] text-white transition-colors disabled:opacity-50"
              title="Refresh summary"
            >
              <svg
                className={`w-4 h-4 ${summaryLoading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Product Summary Cards */}
        <div className="p-4 sm:p-6">
          {summaryLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-lg bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : productSummaries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <svg className="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <span className="text-sm">No pending orders found</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {productSummaries.map((summary, index) => {
                const color = PRODUCT_COLORS[index % PRODUCT_COLORS.length];
                return (
                  <div
                    key={summary.productName}
                    className={`relative rounded-xl border-2 ${color.bg} ${color.border} p-3 sm:p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow`}
                  >
                    {/* Product name badge */}
                    <div className={`inline-flex items-center self-start px-2 py-0.5 rounded-full text-xs font-semibold text-white ${color.badge}`}>
                      {summary.shortName}
                    </div>
                    {/* Full product name */}
                    <div className={`text-xs font-medium ${color.text} leading-tight line-clamp-2`}>
                      {summary.productName}
                    </div>
                    {/* Qty */}
                    <div className="mt-auto flex items-end justify-between">
                      <div>
                        <div className={`text-2xl sm:text-3xl font-extrabold ${color.qty} leading-none`}>
                          {summary.totalQty}
                        </div>
                        <div className={`text-xs ${color.text} opacity-70 mt-0.5`}>units pending</div>
                      </div>
                      {/* Mini bar indicator */}
                      <div className="flex flex-col gap-0.5 items-end">
                        {[...Array(Math.min(5, Math.ceil(summary.totalQty / 5)))].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 rounded-full ${color.badge} opacity-70`}
                            style={{ width: `${16 - i * 2}px` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Export Orders Section ── */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <AlertSnackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        />

        <div className="p-4 sm:p-6" style={{background: 'linear-gradient(135deg, rgb(13, 148, 136), rgb(10, 127, 138))'}}>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Export Orders</h2>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          {/* Product filter buttons */}
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

          {/* Stats row */}
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

          {/* Table */}
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
                    const whatsapp = sale.contact01 || '';
                    const contact02 = sale.contact02 || '';
                    const price = Number.isFinite(sale.totalPrice)
                      ? sale.totalPrice.toFixed(2)
                      : '0.00';
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
                        <td className="px-3 py-3 text-gray-800"></td>
                        <td className="px-3 py-3 text-gray-800">{whatsapp}</td>
                        <td className="px-3 py-3 text-gray-800">{contact02}</td>
                        <td className="px-3 py-3 text-gray-800">{price}</td>
                        <td className="px-3 py-3 text-gray-800"></td>
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
    </div>
  );
};