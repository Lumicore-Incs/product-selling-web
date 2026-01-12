

import React, { useState } from 'react';
import { AlertSnackbar } from '../components/AlertSnackbar';
import { parseTrackingExcel, TrackingRow } from '../utils/excelUtils';
import { uploadTracking } from '../services/orders/orderService';

// Responsive breakpoint for mobile (Tailwind: md = 768px)
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}



export const TrackingId: React.FC = () => {
  const [rows, setRows] = useState<TrackingRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ open: boolean; message: string; type: 'success' | 'error' }>({ open: false, message: '', type: 'error' });
  const isMobile = useIsMobile();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      '.xlsx',
      '.xls',
    ];
    if (!allowedTypes.some(type => file.type === type || file.name.endsWith(type))) {
      setAlert({ open: true, message: 'Please upload a valid Excel file (.xlsx or .xls)', type: 'error' });
      return;
    }
    setIsLoading(true);
    try {
      const data = await parseTrackingExcel(file);
      setRows(data);
      setAlert({ open: true, message: 'Excel uploaded successfully!', type: 'success' });
    } catch (err) {
      setAlert({ open: true, message: 'Failed to parse Excel file', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setRows([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (rows.length === 0) {
      setAlert({ open: true, message: 'No data to submit', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      const trackingData = rows.map(row => ({
        wayBillNo: row.waybillId,
        orderId: row.orderId,
        customerName: row.customerName,
        contact: row.phoneNumber
      }));

      await uploadTracking(trackingData);
      setAlert({ open: true, message: 'Data uploaded successfully!', type: 'success' });
      handleClear();
    } catch (error) {
      setAlert({ open: true, message: 'Failed to upload tracking data', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" w-full mx-auto p-6 rounded-lg relative">
      <AlertSnackbar
        message={alert.message}
        type={alert.type}
        open={alert.open}
        onClose={() => setAlert(a => ({ ...a, open: false }))}
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tracking ID</h1>
        <div className="flex items-center gap-2">
          <label className="inline-block">
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleExcelUpload}
              ref={fileInputRef}
              disabled={isLoading}
            />
            <span className={`px-4 py-2 ${!rows.length ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'} text-white rounded-md cursor-pointer transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              Upload Excel
            </span>
          </label>
          {rows.length > 0 && (
            <>
              <button
                type="button"
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                className={`px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleClear}
                disabled={isLoading}
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>
      {/* Responsive Table/Card View */}
      {!isMobile ? (
        <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-200">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Waybill Id</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Customer Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone Number</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">No data. Please upload an Excel file.</td>
                </tr>
              )}
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{row.orderDate}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{row.waybillId}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{row.orderId}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{row.customerName}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{row.phoneNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && <div className="py-8 text-center text-blue-600">Loading...</div>}
        </div>
      ) : (
        // Mobile: Card view
        <div className="flex flex-col gap-4">
          {rows.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-400 bg-white rounded shadow">No data. Please upload an Excel file.</div>
          )}
          {rows.map((row, idx) => (
            <div key={idx} className="bg-white rounded shadow p-4 border border-gray-200">
              <div className="flex justify-between py-1 border-b last:border-b-0">
                <span className="font-semibold text-gray-700">Order Date</span>
                <span className="text-gray-900 ml-4">{row.orderDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b last:border-b-0">
                <span className="font-semibold text-gray-700">Waybill Id</span>
                <span className="text-gray-900 ml-4">{row.waybillId}</span>
              </div>
              <div className="flex justify-between py-1 border-b last:border-b-0">
                <span className="font-semibold text-gray-700">Order ID</span>
                <span className="text-gray-900 ml-4">{row.orderId}</span>
              </div>
              <div className="flex justify-between py-1 border-b last:border-b-0">
                <span className="font-semibold text-gray-700">Customer Name</span>
                <span className="text-gray-900 ml-4">{row.customerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b last:border-b-0">
                <span className="font-semibold text-gray-700">Phone Number</span>
                <span className="text-gray-900 ml-4">{row.phoneNumber}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-gray-700">Status</span>
                <span className="text-gray-900 ml-4">{row.status}</span>
              </div>
            </div>
          ))}
          {isLoading && <div className="py-8 text-center text-blue-600">Loading...</div>}
        </div>
      )}
    </div>
  );
};
