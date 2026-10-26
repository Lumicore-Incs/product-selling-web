import { FormEvent, useState } from 'react';
import { CalendarRange, Download, FileBarChart2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import orderExportService, { OrderExport } from '../services/orders/orderExportService';

const getDatesInRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const rangeStart = new Date(`${startDate}T00:00:00Z`).getTime();
  const rangeEnd = new Date(`${endDate}T00:00:00Z`).getTime();
  for (let timestamp = rangeStart; timestamp <= rangeEnd; timestamp += 86400000) {
    dates.push(new Date(timestamp).toISOString().slice(0, 10));
  }
  return dates;
};

export const ExportReport = () => {
  const [dateMode, setDateMode] = useState<'single' | 'range'>('range');
  const [selectedDate, setSelectedDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orders, setOrders] = useState<OrderExport[]>([]);
  const [exportDates, setExportDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (dateMode === 'single' ? !selectedDate : !startDate || !endDate || startDate > endDate) return;

    setLoading(true);
    setError('');
    setHasSubmitted(true);
    setExportDates([]);
    try {
      const dateFilter = dateMode === 'single'
        ? { date: selectedDate }
        : { startDate, endDate };
      const data = await orderExportService.exportOrders(dateFilter);
      setOrders(data);
      setExportDates(dateMode === 'single' ? [selectedDate] : getDatesInRange(startDate, endDate));
    } catch (requestError) {
      console.error('Failed to load export report:', requestError);
      setOrders([]);
      setExportDates([]);
      setError('Failed to load export report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelDownload = () => {
    const headers = [
      'Customer Id',
      'Name',
      'Address',
      'Contact 01',
      'Contact 02',
      'Date',
      'Waybill Id',
      'Price',
      'Status',
    ];

    exportDates.forEach((date) => {
      const dailyOrders = orders.filter((order) => order.date?.slice(0, 10) === date);
      const worksheet = XLSX.utils.json_to_sheet(
        dailyOrders.map((order) => ({
          'Customer Id': order.customerId,
          Name: order.name,
          Address: order.address,
          'Contact 01': order.contact01,
          'Contact 02': order.contact02,
          Date: order.date,
          'Waybill Id': order.waybillId,
          Price: order.price,
          Status: order.status,
        })),
        { header: headers },
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Export Report');
      XLSX.writeFile(workbook, `export-report-${date}.xlsx`);
    });
  };

  return (
    <div className="min-h-screen relative" style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-[53px] h-[53px] flex items-center justify-center rounded-lg shrink-0"
            style={{ background: 'linear-gradient(243.27deg, #122467 16.75%, #0B818D 124.51%)' }}
          >
            <FileBarChart2 size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold leading-[35px] text-[#0E626E]">Export Report</h1>
            <p className="text-xs font-medium text-[#414141] mt-0.5">
              View order details for a selected date range.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-white/70 bg-white/70 p-5 sm:p-6 shadow-sm mb-6"
        >
          <div className="flex items-center gap-2 mb-4 text-[#0E626E]">
            <CalendarRange size={20} />
            <h2 className="font-semibold">Select date or date range</h2>
          </div>
          <div className="flex flex-wrap gap-5 mb-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="dateMode"
                value="range"
                checked={dateMode === 'range'}
                onChange={() => setDateMode('range')}
                className="accent-[#0B818D]"
              />
              Date range
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="dateMode"
                value="single"
                checked={dateMode === 'single'}
                onChange={() => setDateMode('single')}
                className="accent-[#0B818D]"
              />
              Single date
            </label>
          </div>
          <div className={`grid grid-cols-1 ${dateMode === 'range' ? 'sm:grid-cols-[1fr_1fr_auto]' : 'sm:grid-cols-[1fr_auto]'} gap-4 items-end`}>
            {dateMode === 'single' ? (
              <label className="block text-sm font-medium text-gray-700">
                Date
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-800 shadow-sm focus:border-[#0B818D] focus:outline-none focus:ring-2 focus:ring-[#0B818D]/20"
                />
              </label>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700">
                  Start date
                  <input
                    type="date"
                    value={startDate}
                    max={endDate || undefined}
                    onChange={(event) => setStartDate(event.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-800 shadow-sm focus:border-[#0B818D] focus:outline-none focus:ring-2 focus:ring-[#0B818D]/20"
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  End date
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || undefined}
                    onChange={(event) => setEndDate(event.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-800 shadow-sm focus:border-[#0B818D] focus:outline-none focus:ring-2 focus:ring-[#0B818D]/20"
                  />
                </label>
              </>
            )}
            <button
              type="submit"
              disabled={loading || (dateMode === 'single'
                ? !selectedDate
                : !startDate || !endDate || startDate > endDate)}
              className="rounded-lg bg-[#0B818D] px-6 py-2.5 font-semibold text-white shadow-sm transition hover:bg-[#096d77] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Submit'}
            </button>
          </div>
          {dateMode === 'range' && startDate && endDate && startDate > endDate && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              Start date must not be after end date.
            </p>
          )}
        </form>

        <section className="overflow-hidden rounded-xl border border-white/70 bg-white/70 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-800">Order details</h2>
            <div className="flex items-center gap-4">
              {hasSubmitted && !loading && !error && (
                <span className="text-sm text-gray-500">{orders.length} records</span>
              )}
              <button
                type="button"
                onClick={handleExcelDownload}
                disabled={loading || exportDates.length === 0 || Boolean(error)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#0B818D] px-3 py-2 text-sm font-semibold text-[#0B818D] transition hover:bg-[#0B818D]/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={16} />
                Export Excel
                {exportDates.length > 0 && !loading && !error && (
                  <span>({exportDates.length} files)</span>
                )}
              </button>
            </div>
          </div>
          {error ? (
            <p className="px-5 py-8 text-center text-sm text-red-600" role="alert">{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                  <tr>
                    {[
                      'Customer Id',
                      'Name',
                      'Address',
                      'Contact 01',
                      'Contact 02',
                      'Date',
                      'Waybill Id',
                      'Price',
                      'Status',
                    ].map((heading) => (
                      <th key={heading} scope="col" className="px-4 py-3 font-semibold">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                        Loading report…
                      </td>
                    </tr>
                  ) : orders.length > 0 ? (
                    orders.map((order, index) => (
                      <tr key={`${order.customerId}-${order.waybillId}-${index}`} className="hover:bg-white/70">
                        <td className="whitespace-nowrap px-4 py-3">{order.customerId ?? '-'}</td>
                        <td className="px-4 py-3">{order.name || '-'}</td>
                        <td className="max-w-xs px-4 py-3">{order.address || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{order.contact01 || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{order.contact02 || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{order.date || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{order.waybillId || '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{order.price ?? '-'}</td>
                        <td className="whitespace-nowrap px-4 py-3">{order.status || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                        {hasSubmitted ? 'No orders found for this date range.' : 'Select a date range and submit to view orders.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
