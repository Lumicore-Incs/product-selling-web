import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { ExportOrderSummary, ProductSummary } from '../components/ExportOrderSummary';
import { ExportOrderTable } from '../components/ExportOrderTable';
import { Sale } from '../models/sales';
import { getAllProducts } from '../service/product';
import { getCurrentUser } from '../service/auth';
import { dashboardApiReturnData, ProductQtyDto } from '../services/api';
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
    } catch { }
    try {
      const text = await blob.text();
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) return parsed as Record<string, unknown>[];
      if (parsed && typeof parsed === 'object') {
        const data = (parsed as { data?: unknown }).data;
        if (Array.isArray(data)) return data as Record<string, unknown>[];
      }
    } catch { }
    return [];
  };

  const loadOrdersFromExportApi = async (productName: string, actionType: string = 'export') => {
    setLoading(true);
    try {
      const blob = await dashboardApiReturnData.exportSalesExcel(productName);
      const rows = await extractRowsFromBlob(blob);
      const mappedSales = mapExportRowsToSales(rows);
      setOrders(mappedSales);
    } catch (err) {
      console.error('Failed to load export data:', err);
      setOrders([]);
      setSnackbar({ open: true, message: `Failed to load ${actionType} data`, type: 'error' });
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

  const getSelectedProductName = (productId: string) =>
    productId === 'import'
      ? 'Import'
      : productId === 'all'
      ? 'all'
      : products.find((product) => product.id === productId)?.name || 'all';

  const handleFilterClick = async (productId: string, productName: string, actionType: string = 'export') => {
    setSelectedProductId(productId);
    lastFetchedProductRef.current = productName;
    await loadOrdersFromExportApi(productName, actionType);
  };

  useEffect(() => {
    const selectedProductName = getSelectedProductName(selectedProductId);
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
      <ExportOrderSummary
        productSummaries={productSummaries}
        totalPendingOrders={totalPendingOrders}
        summaryLoading={summaryLoading}
        onRefresh={fetchPendingSummary}
      />

      {/* ── Export Orders Section ── */}
      <div className="rounded-xl  overflow-hidden">
        <AlertSnackbar
          message={snackbar.message}
          type={snackbar.type}
          open={snackbar.open}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        />

        <div className="p-4 sm:p-6" style={{ paddingBottom: '0' }}>
          <h2 className="text-xl sm:text-2xl font-bold  text-[#0E626E]">Export Orders</h2>
        </div>

        <div className="p-4 sm:p-6 space-y-2">
          {/* Product filter buttons */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleFilterClick('all', 'all')}
                className={`px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${selectedProductId === 'all'
                    ? 'bg-[#0B818D] text-white border-blue-600'
                    : 'bg-[#FFFFFF7D] text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                All Products
              </button>
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleFilterClick(product.id, product.name)}
                  className={`px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${selectedProductId === product.id
                      ? 'bg-[#0B818D]/80 text-white border-[#0B818D]'
                      : 'bg-[#FFFFFF7D] text-black border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {product.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleFilterClick('import', 'Import', 'import')}
                className={`px-3 py-2 rounded-full text-sm font-medium border transition-all duration-200 ${selectedProductId === 'import'
                    ? 'bg-[#16a34a] text-white border-emerald-600'
                    : 'bg-[#d1fae5] text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                  }`}
              >
                Import
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between text-sm text-black">
            <div>Selected: {selectedIds.size}</div>
            <div className="flex items-center gap-3">
              <span>{loading ? 'Loading...' : `${filteredOrders.length} orders`}</span>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={isExporting}
                className="px-4 py-2 bg-[#0B818D] text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 text-sm font-medium transition-colors"
              >
                {isExporting ? 'Exporting...' : 'Export Excel'}
              </button>
            </div>
          </div>

          <ExportOrderTable
            orders={filteredOrders}
            selectedProductId={selectedProductId}
            selectedIds={selectedIds}
            loading={loading}
            onToggleSelectAll={toggleSelectAll}
            onToggleSelectOne={toggleSelectOne}
          />
        </div>
      </div>
    </div>
  );
};