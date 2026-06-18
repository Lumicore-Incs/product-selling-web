import React, { useEffect, useState } from 'react';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { SalesForm } from '../components/SalesForm';
import { SalesTable } from '../components/SalesTable';
import { Sale as TableSale } from '../models/sales';
import { getCurrentUser } from '../service/auth';
import { dashboardApi } from '../services/api';
import { orderService } from '../services/orders/orderService';
import { DownloadIcon } from 'lucide-react';
import * as XLSX from 'xlsx';

type Sale = TableSale;

export const DuplicateSales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [user, setUser] = useState<{ role: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ open: false, message: '', type: 'error' });

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const response = await orderService.getAllDuplicateOrders();
      setSales(response as Sale[]);
    } catch (err: any) {
      const msg = err?.message || 'Failed to load orders';
      setSnackbar({ open: true, message: msg, type: 'error' });
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDuplicateSale = async (updatedSale: Sale) => {
    setIsLoading(true);
    try {
      await orderService.updateDuplicateOrder(updatedSale.id, updatedSale as any);
      await loadOrders();
      setCurrentSale(null);
      setIsEditing(false);
      setSnackbar({ open: true, message: 'Order updated successfully', type: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Update failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSale = async (id: string) => {
    setIsLoading(true);
    try {
      await orderService.deleteOrder(id);
      await loadOrders();
      setSnackbar({ open: true, message: 'Order deleted successfully', type: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Delete failed', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const editSale = (sale: Sale) => {
    setCurrentSale(sale);
    setIsEditing(true);
  };

  // ✅ EXPORT ALL SALES
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const blob = await dashboardApi.exportSalesExcel('all');

      const buffer = await blob.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });


      const fileName = `All_Sales_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setSnackbar({
        open: true,
        message: 'All sales exported successfully',
        type: 'success',
      });
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: err.message || 'Export failed',
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
  className="
    w-full
    max-w-full
    sm:max-w-full
    md:max-w-7xl
    lg:max-w-screen-2xl
    mx-auto
    px-3
    sm:px-4
    md:px-6
    relative
    overflow-x-hidden
  "
>       <BackgroundIcons />

      <AlertSnackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />

      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Resolve Duplicate Orders</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Add, edit, and manage your sales entries</p>
          </div>

          <button
            onClick={loadOrders}
            disabled={isLoading}
            className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 text-sm sm:text-base transition-colors"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Export Button Only */}
        {user?.role === 'SUPER USER' && (
          <div className="mt-4 flex justify-end w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 text-sm sm:text-base transition-colors w-full sm:w-auto"
            >
              <DownloadIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>
          </div>
        )}
      </header>

      <SalesTable
        sales={sales}
        onEdit={editSale}
        onDelete={deleteSale}
        isLoading={isLoading}
        userRole={user?.role}
        onRefresh={loadOrders}
        onStatusChange={async (saleId, status) => {
          const sale = sales.find((s) => s.id === saleId);
          if (!sale) return;
          await updateDuplicateSale({ ...sale, status });
        }}
        
      />

      {isEditing && (
        <SalesForm
          currentSale={currentSale}
          isEditing={isEditing}
          onSave={loadOrders}
          onUpdate={updateDuplicateSale}
          onCancelEdit={() => {
            setCurrentSale(null);
            setIsEditing(false);
          }}
        />
      )}
    </div>
  );
};
