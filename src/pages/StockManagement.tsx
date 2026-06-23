import { useEffect, useState } from 'react';
import { BackgroundIcons } from '../components/BackgroundIcons';
import Filters from '../components/stock/Filters';
import StockForm, { StockItem } from '../components/stock/StockForm';
import StockTable from '../components/stock/StockTable';
import { getAllStock, addStock, updateStock, deleteStock } from '../services/stock/stockService';
import Spinner from '../components/Spinner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { AlertSnackbar } from '../components/AlertSnackbar';

export const StockManagement = () => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [filters, setFilters] = useState({ type: 'All', date: '', status: 'All' });
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
      const data = await getAllStock();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data');
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

  const handleFilterChange = ({ type, date, status }: { type: string; date: string; status: string }) => {
    setFilters({ type, date, status });
  };

  const damageItems = items.filter((item) => item.status === 'DAMAGE');
  const totalDamaged = damageItems.reduce((sum, item) => sum + Math.abs(item.quantity), 0);

  return (
    <div className="space-y-6 mx-6 relative">
      <BackgroundIcons type="stock" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Stock Management</h1>
        {isLoading && <Spinner size={24} colorClass="text-blue-600" />}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => {
            setFormMode('add');
            setEditItem(null);
          }}
          className={`px-4 py-2 rounded-lg font-medium transition ${formMode === 'add'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-blue-600 hover:bg-gray-200'
          }`}
        >
          Add Stock
        </button>
        <button
          onClick={() => {
            setFormMode('damage');
            setEditItem(null);
          }}
          className={`px-4 py-2 rounded-lg font-medium transition ${formMode === 'damage'
            ? 'bg-red-600 text-white'
            : 'bg-gray-100 text-red-600 hover:bg-gray-200'
          }`}
        >
          Log Damage
        </button>
        {formMode === 'damage' && (
          <span className="px-3 py-2 rounded-full bg-red-50 text-red-600 border border-red-100 text-sm">
            Logging damaged inventory will set the status to Damage and capture the reason.
          </span>
        )}
      </div>

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
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
            <p className="text-sm text-red-500">Total damaged records</p>
            <p className="text-3xl font-semibold text-red-700">{damageItems.length}</p>
            <p className="text-sm text-red-600">Quantity affected: {totalDamaged}</p>
            
            {/* Detailed breakdown of damaged products */}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Product Details:</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {damageItems.map((item, index) => (
                  <div key={item.stock_id || index} className="flex justify-between items-center text-sm bg-white/50 rounded px-2 py-1">
                    <span className="font-medium text-gray-800 truncate mr-2">{item.type}</span>
                    <span className="text-red-600 font-semibold">Qty: {Math.abs(item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-white bg-opacity-80 border border-dashed border-red-200 rounded-xl p-4 text-sm text-gray-600">
            Every damage entry keeps stock history clean and can be filtered via the status selector below.
          </div>
        </div>
      )}
      <StockTable
        items={items}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        filterType={filters.type}
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
