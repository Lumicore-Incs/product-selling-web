import { useEffect, useState, useMemo } from 'react';
import {
  PieChart,
  Calendar,
  TrendingUp,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BackgroundIcons } from '../components/BackgroundIcons';
import dailyReportService from '../services/dailyReport/dailyReportService';
import { DailyCountWithProduct, PaginationResponse } from '../models/dailyCount';

export const DailyReport = () => {
  const [paginatedData, setPaginatedData] = useState<PaginationResponse<DailyCountWithProduct>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false,
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Group data by date
  const groupedByDate = useMemo(() => {
    const groups: Record<string, DailyCountWithProduct[]> = {};
    
    paginatedData.content.forEach((item) => {
      if (!groups[item.date]) {
        groups[item.date] = [];
      }
      groups[item.date].push(item);
    });

    // Convert to array and sort by date descending
    return Object.entries(groups)
      .map(([date, items]) => ({
        date,
        items,
        productCount: items.length,
        totalQty: items.reduce((sum, item) => sum + item.totalQty, 0),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [paginatedData]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalQty = paginatedData.content.reduce((sum, item) => sum + item.totalQty, 0);
    const lastUpdated = paginatedData.content.length > 0 ? paginatedData.content[0].lastTime : null;
    
    return {
      totalQty,
      lastUpdated,
      uniqueDates: groupedByDate.length,
    };
  }, [paginatedData, groupedByDate]);

  // Fetch paginated dates
  useEffect(() => {
    fetchPaginatedData();
  }, [currentPage]);

  const fetchPaginatedData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dailyReportService.getDailyCountPaginated(
        currentPage,
        10
      );
      console.log('Paginated data:', data);
      setPaginatedData(data);
    } catch (err) {
      setError('Failed to load daily report data');
      console.error('Error fetching paginated data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPaginatedData();
  };

  const handleExport = () => {
    try {
      // Export current selected date details
      if (!selectedDate) {
        alert('Please select a date to export');
        return;
      }

      const selectedDateGroup = groupedByDate.find((g) => g.date === selectedDate);
      if (!selectedDateGroup) {
        alert('Date not found');
        return;
      }

      const headers = ['Product ID', 'Product Name', 'Short Name', 'Quantity', 'Last Updated'];
      const rows = selectedDateGroup.items.map((item) => [
        item.productId || 'N/A',
        item.productName || 'Unknown',
        item.productShortName || '-',
        item.totalQty,
        new Date(item.lastTime).toLocaleString(),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daily-report-${selectedDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <BackgroundIcons />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg shadow-lg">
              <PieChart size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Daily Report
              </h1>
              <p className="text-gray-600 mt-1">
                View all daily records - Click any date to see product details
              </p>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 backdrop-blur-sm bg-opacity-95">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
            {/* Title */}
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">
                All Daily Records
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Displaying {paginatedData.pageSize} records per page
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap sm:justify-end">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                disabled={!selectedDate}
                className="flex items-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <Download size={18} />
                Export
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Total Records
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">
                    {paginatedData.totalElements}
                  </p>
                </div>
                <Calendar
                  size={32}
                  className="text-blue-400 opacity-50"
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    This Page Total
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">
                    {summary.totalQty}
                  </p>
                </div>
                <TrendingUp
                  size={32}
                  className="text-green-400 opacity-50"
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Unique Dates
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-purple-600 mt-2">
                    {summary.uniqueDates} dates found
                  </p>
                </div>
                <PieChart
                  size={32}
                  className="text-purple-400 opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Date List Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden backdrop-blur-sm bg-opacity-95 mb-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-16">
              <div className="flex justify-center items-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Loading dates...</p>
            </div>
          ) : paginatedData.content.length === 0 ? (
            <div className="text-center py-12">
              <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg font-medium">
                No data available
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {groupedByDate.map((dateGroup) => (
                <div key={dateGroup.date}>
                  {/* Date Summary Row */}
                  <button
                    onClick={() =>
                      setSelectedDate(selectedDate === dateGroup.date ? null : dateGroup.date)
                    }
                    className="w-full px-6 py-4 hover:bg-blue-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Calendar size={20} className="text-blue-500" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900">
                          {new Date(dateGroup.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {dateGroup.productCount} products • Total Qty: {dateGroup.totalQty}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                        {dateGroup.totalQty}
                      </span>
                      {selectedDate === dateGroup.date ? (
                        <ChevronUp size={20} className="text-blue-600" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Product List */}
                  {selectedDate === dateGroup.date && (
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-l-4 border-blue-500">
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-700 mb-3">
                          Product Breakdown:
                        </p>
                        {dateGroup.items.map((product) => (
                          <div
                            key={product.id}
                            className="bg-white rounded-lg p-3 flex items-center justify-between hover:shadow-md transition-shadow"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                #{product.productId} - {product.productName}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {product.productShortName && `Short: ${product.productShortName}`}
                                {product.category && ` • Category: ${product.category}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 min-w-12">
                                {product.totalQty}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {paginatedData.totalPages > 1 && (
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={!paginatedData.hasPrevious}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold">
              Page {paginatedData.currentPage + 1} of {paginatedData.totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!paginatedData.hasNext}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Showing {groupedByDate.length} unique dates •{' '}
            <strong>{paginatedData.content.length} total records on this page</strong>
          </p>
        </div>
      </div>
    </div>
  );
};
