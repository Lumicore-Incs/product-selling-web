import React, { useEffect, useState } from 'react';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { SalesForm } from '../components/SalesForm';
import { SalesTable } from '../components/SalesTable';
import { Sale as TableSale } from '../models/sales';
import { getCurrentUser } from '../service/auth';
import { dashboardApi, productApi, ProductDto } from '../services/api';
import { orderService } from '../services/orders/orderService';
import { DownloadIcon } from 'lucide-react';
import * as XLSX from 'xlsx';

// Use the table types so shapes match the SalesTable component
type Sale = TableSale;

export const DuplicateSales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error';
  }>({ open: false, message: '', type: 'error' });
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedExportProduct, setSelectedExportProduct] = useState<string>('');

  // Load existing orders from backend on component mount
  useEffect(() => {
    loadOrders();
  }, []);

  // Load products for export functionality
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
      }
    };

    loadProducts();
  }, []);

  // Load user data for role-based permissions
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load all orders from backend via service
      console.log('Calling orderService.getAllDuplicateOrders()...');
      const responseOrder = await orderService.getAllDuplicateOrders();

      // Check if response exists and is an array
      if (!responseOrder || !Array.isArray(responseOrder)) {
        console.error('Invalid response format:', responseOrder);
        throw new Error('Invalid data format received from server');
      }

      console.log('Number of orders received:', responseOrder.length);

      // orderService returns canonical `Sale[]` (mapping done in the service)
      const canonicalSales = responseOrder as Sale[];
      console.log('Setting sales state with', canonicalSales.length, 'items');
      setSales(canonicalSales);
    } catch (error: unknown) {
      console.error('Error loading orders:', error);

      const err = error as { message?: string; response?: { status?: number } };

      let errorMessage = 'Failed to load orders. ';

      if (err.response?.status === 404) {
        errorMessage +=
          'Endpoint not found. Please check if your backend server is running and the endpoint exists.';
      } else if (err.response?.status === 401) {
        errorMessage += 'Authentication failed. Please login again.';
      } else if (err.message) {
        errorMessage += err.message;
      } else {
        errorMessage += 'Please try again.';
      }

      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, type: 'error' });
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addSale = () => {
    loadOrders();
  };

  const updateDuplicateSale = async (updatedSale: Sale) => {
    // Wait for server response before updating local state
    setIsLoading(true);
    setError(null);
    try {
      const resp = await orderService.updateDuplicateOrder(updatedSale.id, updatedSale as unknown);
      // If backend returns the updated sale, replace local state; otherwise, use updatedSale
      const newSale = (resp as unknown) || updatedSale;
      setSales((s) => s.map((sale) => (sale.id === updatedSale.id ? (newSale as Sale) : sale)));
      await loadOrders();
      setCurrentSale(null);
      setIsEditing(false);
      setSnackbar({ open: true, message: 'Order updated successfully', type: 'success' });
    } catch (err: unknown) {
      const message = (err as Error)?.message || 'Failed to update order';
      setSnackbar({ open: true, message, type: 'error' });
      console.error('Update order failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSale = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Wait for server to delete the order before updating UI
      await orderService.deleteOrder(id);
      // Refresh the full list from server to keep data consistent
      await loadOrders();
      setSnackbar({ open: true, message: 'Order deleted successfully', type: 'success' });
    } catch (err: unknown) {
      const message = (err as Error)?.message || 'Failed to delete order';
      setSnackbar({ open: true, message, type: 'error' });
      console.error('Delete order failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const editSale = (sale: Sale) => {
    setCurrentSale(sale);
    setIsEditing(true);
  };

  const exportSales = async (exportType: string) => {
    setError(null);
    try {
      let endpoint = '';
      switch (exportType) {
        case 'sugar':
          endpoint = '/dashboard/excel/sug';
          break;
        case 'vac':
          endpoint = '/dashboard/excel/vac';
          break;
        case 'others':
          endpoint = '/dashboard/excel/others';
          break;
        default:
          endpoint = '/dashboard/excel/sug';
      }

      // Call the API with the specific endpoint
      const blob = await dashboardApi.exportSalesExcel(endpoint);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);

      setSnackbar({
        open: true,
        message: `Exported ${exportType} data successfully`,
        type: 'success',
      });
    } catch (error: unknown) {
      const err = error as { message?: string };
      const errorMessage = `Failed to export ${exportType} data. ${err?.message || ''}`;
      setError(errorMessage);
      setSnackbar({ open: true, message: errorMessage, type: 'error' });
    } finally {
      setShowExportPopup(false);
    }
  };

  const refreshData = () => {
    loadOrders();
  };

  // Export orders to Excel by product name and open in Excel-like viewer
  const handleExportExcel = async () => {
    if (!selectedExportProduct) {
      setSnackbar({
        open: true,
        message: 'Please select a product to export orders',
        type: 'error',
      });
      return;
    }

    // Find the product name from the selected product ID
    const product = products.find(
      (p) => (p.productId == null ? '' : String(p.productId)) === selectedExportProduct
    );

    if (!product) {
      setSnackbar({
        open: true,
        message: 'Selected product not found',
        type: 'error',
      });
      return;
    }

    const productName = product.name;

    setIsExporting(true);
    try {
      const blob = await dashboardApi.exportSalesExcel(productName);

      // Convert blob to ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();

      // Read workbook
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON with header option to get structured data
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];

      // Get range of the sheet
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

      // Convert blob to base64 for reliable cross-window access
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const fileName = `${productName}_Sales_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Create Excel-like viewer in new window
      const newWindow = window.open('', '_blank', 'width=1200,height=800');
      if (!newWindow) {
        setSnackbar({
          open: true,
          message: 'Please allow pop-ups to view the Excel file',
          type: 'error',
        });
        setIsExporting(false);
        return;
      }

      // Escape product name for HTML
      const escapedProductName = productName.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

      // Build Excel-like HTML with proper styling
      const excelHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedProductName} - Excel Viewer</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f3f3f3;
      overflow: hidden;
    }
    .excel-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: white;
    }
    .excel-header {
      background: linear-gradient(135deg, #217346 0%, #1e5f3a 100%);
      color: white;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .excel-header h1 {
      font-size: 18px;
      font-weight: 500;
    }
    .excel-toolbar {
      background: #f8f9fa;
      border-bottom: 1px solid #d0d0d0;
      padding: 8px 16px;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .toolbar-btn {
      padding: 6px 12px;
      background: white;
      border: 1px solid #d0d0d0;
      border-radius: 3px;
      cursor: pointer;
      font-size: 13px;
      color: #333;
      transition: all 0.2s;
    }
    .toolbar-btn:hover {
      background: #e8e8e8;
      border-color: #a0a0a0;
    }
    .excel-scroll-container {
      flex: 1;
      overflow: auto;
      background: #fafafa;
    }
    .excel-grid {
      display: inline-block;
      border: 1px solid #d0d0d0;
      background: white;
      margin: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .excel-row {
      display: flex;
      border-bottom: 1px solid #e0e0e0;
    }
    .excel-row:last-child {
      border-bottom: none;
    }
    .excel-cell {
      min-width: 120px;
      width: 120px;
      padding: 8px 12px;
      border-right: 1px solid #e0e0e0;
      font-size: 13px;
      color: #333;
      background: white;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .excel-row:first-child .excel-cell {
      background: #f8f9fa;
      font-weight: 600;
      color: #217346;
      border-bottom: 2px solid #217346;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .excel-cell:last-child {
      border-right: none;
    }
    .excel-cell-header {
      background: #f8f9fa !important;
      font-weight: 600;
      color: #217346;
    }
    .excel-row:nth-child(even):not(:first-child) {
      background: #fafafa;
    }
    .excel-row:hover:not(:first-child) {
      background: #f0f7ff;
    }
    .row-number {
      min-width: 50px;
      width: 50px;
      background: #f8f9fa;
      border-right: 2px solid #d0d0d0;
      text-align: center;
      color: #666;
      font-size: 12px;
      font-weight: 500;
      padding: 8px 4px;
      position: sticky;
      left: 0;
      z-index: 5;
    }
    .excel-row:first-child .row-number {
      background: #217346;
      color: white;
      border-right: 2px solid #1e5f3a;
    }
    .number-cell {
      text-align: right;
      font-family: 'Consolas', 'Monaco', monospace;
    }
  </style>
</head>
<body>
  <div class="excel-container">
    <div class="excel-header">
      <h1>📊 ${escapedProductName} - Sales Data</h1>
      <div style="font-size: 12px; opacity: 0.9;">Excel Viewer</div>
    </div>
    <div class="excel-toolbar">
      <button class="toolbar-btn" onclick="window.print()">🖨️ Print</button>
      <button class="toolbar-btn" onclick="downloadExcel()">💾 Download</button>
      <div style="flex: 1;"></div>
      <div style="font-size: 12px; color: #666;">
        Rows: ${range.e.r + 1} | Columns: ${range.e.c + 1}
      </div>
    </div>
    <div class="excel-scroll-container">
      <div class="excel-grid">
        ${jsonData.map((row: any[], rowIndex: number) => {
          return `
            <div class="excel-row">
              <div class="row-number">${rowIndex === 0 ? '' : rowIndex}</div>
              ${row.map((cell: any) => {
                const cellValue = cell !== null && cell !== undefined ? String(cell) : '';
                const escapedValue = cellValue.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                const isHeader = rowIndex === 0;
                const isNumber = !isHeader && !isNaN(Number(cell)) && cellValue !== '';
                const cellClass = isHeader 
                  ? 'excel-cell-header' 
                  : isNumber 
                    ? 'number-cell' 
                    : '';
                
                return `<div class="excel-cell ${cellClass}" title="${escapedValue}">${escapedValue}</div>`;
              }).join('')}
            </div>
          `;
        }).join('')}
      </div>
    </div>
  </div>
  <script>
    const excelData = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64String}';
    const fileName = '${fileName.replace(/'/g, "\\'")}';    
    function downloadExcel() {
      const link = document.createElement('a');
      link.href = excelData;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
    });
  </script>
</body>
</html>
      `;

      newWindow.document.write(excelHTML);
      newWindow.document.close();

      setSnackbar({
        open: true,
        message: `Excel file opened in new window for ${productName}`,
        type: 'success',
      });
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to open Excel file';
      setSnackbar({
        open: true,
        message: `Error: ${errorMessage}`,
        type: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && sales.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 relative overflow-hidden">
      <BackgroundIcons />
      <AlertSnackbar
        message={snackbar.message}
        type={snackbar.type}
        open={snackbar.open}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      />
      {showExportPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg relative">
            <button
              onClick={() => setShowExportPopup(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h3 className="text-lg font-semibold mb-4">Export Item</h3>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowExportPopup(false);
                  exportSales('sugar'); // Call your existing export function
                }}
                className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-green-700"
              >
                Sugar End
              </button>
              <button
                onClick={() => {
                  setShowExportPopup(false);
                  exportSales('vac'); // Call your existing export function
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-blue-700"
              >
                Vac
              </button>
              <button
                onClick={() => {
                  setShowExportPopup(false);
                  exportSales('others'); // Call your existing export function
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
              >
                Others
              </button>
            </div>
          </div>
        </div>
      )}
      <header className="mb-8">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Resolve Duplicate Orders</h1>
              <p className="text-gray-600 mt-2">Add, edit, and manage your sales entries</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={refreshData}
                disabled={isLoading}
                className={`px-4 py-2 rounded-md text-white ${
                  isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          {/* Export Section - Only visible for SUPER USER */}
          {user?.role === 'SUPER USER' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
              <select
                value={selectedExportProduct}
                onChange={(e) => setSelectedExportProduct(e.target.value)}
                className="flex-1 px-4 py-2 bg-white text-gray-800 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base min-w-[200px]"
                disabled={isExporting || products.length === 0}
              >
                <option value="">Select Product to Export</option>
                {products.map((product) => (
                  <option key={String(product.productId)} value={product.productId}>
                    {product.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={!selectedExportProduct || isExporting || products.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 transition-all duration-200 font-medium disabled:bg-purple-400 disabled:cursor-not-allowed text-sm sm:text-base whitespace-nowrap"
              >
                <DownloadIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                {isExporting ? 'Exporting...' : 'Export to Excel'}
              </button>
            </div>
          )}
        </div>
      </header>

      {error && <></>}

      <div className="space-y-8">
        <div>
          <SalesTable
            sales={sales}
            onEdit={editSale}
            onDelete={deleteSale}
            isLoading={isLoading}
            userRole={user?.role}
            onRefresh={refreshData}
            onStatusChange={async (saleId, newStatus) => {
              const sale = sales.find(s => s.id === saleId);
              if (!sale) return;
              const updatedSale = { ...sale, status: newStatus };
              await updateDuplicateSale(updatedSale);
            }}
            allowTemporaryStatusUpdate={true}
          />
        </div>

        <div>
          {/* Render the SalesForm only when editing. By default the form is hidden
              on this page and is shown when the user clicks the update/edit icon
              in the table which calls `editSale` and sets `isEditing`/`currentSale`. */}
          {isEditing && (
            <SalesForm
              onSave={addSale}
              onUpdate={updateDuplicateSale}
              currentSale={currentSale}
              isEditing={isEditing}
              onCancelEdit={() => {
                setCurrentSale(null);
                setIsEditing(false);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
