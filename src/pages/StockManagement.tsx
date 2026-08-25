import { useEffect, useState } from 'react';
import { BackgroundIcons } from '../components/BackgroundIcons';
import Filters from '../components/stock/Filters';
import StockForm, { StockItem } from '../components/stock/StockForm';
import StockTable from '../components/stock/StockTable';
import { getAllStock, addStock, updateStock, deleteStock, getStockQty } from '../services/stock/stockService';

import Spinner from '../components/Spinner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AlertSnackbar } from '../components/AlertSnackbar';

export const StockManagement = () => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [apiProductSummaries, setApiProductSummaries] = useState<{name: string, total: number}[] | null>(null);
  const [filters, setFilters] = useState({ type: 'All', month: '', date: '', status: 'All' });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });
  const [formMode, setFormMode] = useState<'add' | 'damage'>('add');

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const stockData = await getAllStock();
      setItems(stockData as StockItem[]);
      
      try {
        const qtyData = await getStockQty();
        if (Array.isArray(qtyData)) {
          const mapped = qtyData.map((item: any) => ({
            name: item.type || item.name || item.stockType || Object.keys(item)[0],
            total: Number(item.quantity || item.totalQuantity || item.total || Object.values(item)[0] || 0)
          }));
          setApiProductSummaries(mapped);
        } else if (qtyData && typeof qtyData === 'object') {
          const mapped = Object.entries(qtyData).map(([name, total]) => ({
            name,
            total: Number(total)
          }));
          setApiProductSummaries(mapped);
        }
      } catch (qtyErr) {
        console.error("Could not fetch API stock quantities:", qtyErr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: StockItem) => {
    // If data has no fields set (empty form), it's a cancel operation
    if (Object.values(data).every(v => !v)) {
      setEditItem(null);
      return;
    }

    try {
      setIsLoading(true);
      if (editItem?.stock_id) {
        await updateStock(editItem.stock_id, data);
        // After successful update, refresh the list to ensure we have latest data
        await fetchStockData();
        // Clear form by resetting editItem
        setEditItem(null);
        setSnackbar({ open: true, message: 'Stock updated successfully', type: 'success' });
      } else {
        await addStock(data);
        // After adding new stock, refresh the entire list to ensure we have latest data
        await fetchStockData();
        setSnackbar({ open: true, message: 'Stock added successfully', type: 'success' });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save stock data';
      setError(msg);
      setSnackbar({ open: true, message: msg, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item: StockItem) => {
    setFormMode('add');
    setEditItem(item);
  };

  // Open confirm dialog (called by table) instead of deleting immediately
  const handleDeleteRequest = (id: number) => {
    setConfirmTarget(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (confirmTarget == null) return;
    setIsDeleting(true);
    setConfirmOpen(false);
    try {
      const resp = await deleteStock(confirmTarget);
      // If backend returns a message in resp.message or resp, show it
      const message = resp?.message ?? (typeof resp === 'string' ? resp : 'Deleted successfully');
      setSnackbar({ open: true, message, type: 'success' });
      setItems(items.filter((i) => i.stock_id !== confirmTarget));
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete stock item';
      setSnackbar({ open: true, message: msg, type: 'error' });
    } finally {
      setIsDeleting(false);
      setConfirmTarget(null);
    }
  };

  const handleFilterChange = ({ type, month, date, status }: { type: string; month: string; date: string; status: string }) => {
    setFilters({ type, month, date, status });
  };

  const damageItems = items.filter((item) => item.status === 'DAMAGE');
  const totalDamaged = damageItems.reduce((sum, item) => sum + Math.abs(item.quantity), 0);

  // Product summaries for top cards (Raw total including damage)
  const computedSummaries = Object.entries(
    items.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + Number(item.quantity);
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, total]) => ({ name, total }));

  const rawProductSummaries = apiProductSummaries && apiProductSummaries.length > 0 ? apiProductSummaries : computedSummaries;

  // Subtract damaged items from the total count for the top boxes
  const productSummaries = rawProductSummaries.map(summary => {
    const damagedQtyForProduct = items
      .filter(item => (item.type === summary.name || item.type?.toLowerCase() === summary.name?.toLowerCase()) && item.status === 'DAMAGE')
      .reduce((sum, item) => sum + Math.abs(Number(item.quantity)), 0);
    return { ...summary, total: summary.total - damagedQtyForProduct };
  });

  const summaryColors = [
    { text: 'text-[#540863]', num: 'text-[#540863]' },
    { text: 'text-[#D06027]', num: 'text-[#B23D03]' },
    { text: 'text-[#016D18]', num: 'text-[#016D18]' },
    { text: 'text-[#E0090C]', num: 'text-[#920002]' },
    { text: 'text-[#002094]', num: 'text-[#002094]' },
  ];

  return (
    <div className="space-y-6 mx-3 sm:mx-6 relative">
      <BackgroundIcons type="stock" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#0E626E] font-['Plus_Jakarta_Sans']">Stock Management</h1>
          {isLoading && <Spinner size={24} colorClass="text-[#0E626E]" />}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setFormMode('add');
              setEditItem(null);
            }}
            className="flex-1 sm:flex-none px-5 sm:px-[30px] py-[11px] rounded-[8px] font-semibold text-[16px] sm:text-[18px] text-white bg-[#296BDF] transition hover:bg-[#2055b5] flex items-center justify-center h-[44px]"
          >
            Add Stock
          </button>
          <button
            onClick={() => {
              setFormMode('damage');
              setEditItem(null);
            }}
            className="flex-1 sm:flex-none px-5 sm:px-[30px] py-[11px] rounded-[8px] font-semibold text-[16px] sm:text-[18px] text-white bg-[#C94741] transition hover:bg-[#a63934] flex items-center justify-center h-[44px]"
          >
            Log Damage
          </button>
        </div>
      </div>

      {/* Top Product Summary Cards */}
      {productSummaries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:overflow-x-auto pb-4 gap-4 scrollbar-hide">
          {productSummaries.map((summary, index) => {
            const colors = summaryColors[index % summaryColors.length];
            return (
              <div key={summary.name} className="md:flex-none md:w-[210px] min-h-[105px] bg-white/35 rounded-[21px] p-[15px] pb-[50px] relative">
                <div className={`font-bold text-[13px] leading-[17px] break-words ${colors.text}`}>
                  {summary.name}
                </div>
                <div className={`absolute bottom-[10px] font-bold text-[40px] leading-[48px] ${colors.num}`}>
                  {summary.total}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formMode === 'damage' && (
        <div className="flex justify-end mb-4">
          <span className="px-4 py-2 rounded-full bg-red-50 text-red-600 border border-red-100 text-sm">
            Logging damaged inventory will set the status to Damage and capture the reason.
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <StockForm onSubmit={handleSave} initialValues={editItem} mode={formMode} />
      <Filters onFilterChange={handleFilterChange} existingItems={items} />
      {damageItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Left Damage Summary Card */}
          <div className="bg-[#FDF2F4] rounded-[8px] p-6 relative min-h-[129px]">
            <div className="flex items-start gap-4">
              <div className="w-[75px] h-[75px] bg-[#FCDDDF] rounded-full flex items-center justify-center shrink-0">
                <svg width="45" height="45" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L1 21H23L12 2Z" fill="#CB4050" fillOpacity="0.1" stroke="#CB4050" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M12 10V14M12 17H12.01" stroke="#CB4050" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className="text-[20px] font-medium text-[#242424] leading-[24px]">Total damaged records</h3>
                <div className="text-[34px] font-semibold text-[#E0090C] leading-[41px] mt-1">{damageItems.length}</div>
                <p className="text-[14px] font-medium text-[#6A6A6A] mt-1">Quantity affected: {totalDamaged}</p>
              </div>
              <div className="w-[1.5px] h-[100px] bg-[rgba(224,9,12,0.29)] mx-4 self-center hidden sm:block"></div>
              <div className="flex-1 hidden sm:block">
                <h4 className="text-[18px] font-medium text-[#E44A5E] uppercase mb-2">PRODUCT DETAILS</h4>
                <div className="max-h-[80px] overflow-y-auto space-y-1 scrollbar-hide">
                  {damageItems.map((item, idx) => (
                    <div key={item.stock_id || idx} className="flex justify-between items-center">
                      <span className="text-[14px] font-medium text-[#414141] truncate mr-2">{item.type}</span>
                      <span className="text-[14px] text-[#757B87]">Qty : {Math.abs(item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Info Card */}
          <div className="bg-[#E9E4FF] rounded-[8px] p-6 flex items-center gap-4 min-h-[129px]">
            <div className="w-[75px] h-[75px] bg-[#D4CEFF] rounded-full flex items-center justify-center shrink-0">
              <svg width="45" height="45" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM11 7H13V9H11V7ZM11 11H13V17H11V11Z" fill="#8382F0"/>
              </svg>
            </div>
            <p className="text-[15px] text-[#000000] leading-[18px]">
              Every damage entry keeps stock history clean and can be filtered via status selector below.
            </p>
          </div>
        </div>
      )}
      <StockTable
        items={items}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        filterType={filters.type}
        filterMonth={filters.month}
        filterDate={filters.date}
        filterStatus={filters.status}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Delete stock"
        message="Are you sure you want to delete this stock item? This action cannot be undone."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      <AlertSnackbar
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        autoHideDuration={3000}
      />
    </div>
  );
};
