import { useEffect, useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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

  const groupedByDate = useMemo(() => {
    const groups: Record<string, DailyCountWithProduct[]> = {};
    paginatedData.content.forEach((item) => {
      if (!groups[item.date]) groups[item.date] = [];
      groups[item.date].push(item);
    });
    return Object.entries(groups)
      .map(([date, items]) => ({
        date,
        items,
        productCount: items.length,
        totalQty: items.reduce((sum, item) => sum + item.totalQty, 0),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [paginatedData]);

  const summary = useMemo(() => {
    const totalQty = paginatedData.content.reduce((sum, item) => sum + item.totalQty, 0);
    return {
      totalQty,
      uniqueDates: groupedByDate.length,
    };
  }, [paginatedData, groupedByDate]);

  useEffect(() => {
    fetchPaginatedData();
  }, [currentPage]);

  const fetchPaginatedData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dailyReportService.getDailyCountPaginated(currentPage, 10);
      setPaginatedData(data);
    } catch (err) {
      setError('Failed to load daily report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!selectedDate) {
      alert('Please select a date to export');
      return;
    }
    const selectedDateGroup = groupedByDate.find((g) => g.date === selectedDate);
    if (!selectedDateGroup) return;

    const headers = ['Product ID', 'Product Name', 'Short Name', 'Quantity', 'Last Updated'];
    const rows = selectedDateGroup.items.map((item) => [
      item.productId || 'N/A',
      item.productName || 'Unknown',
      item.productShortName || '-',
      item.totalQty,
      new Date(item.lastTime).toLocaleString(),
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-report-${selectedDate}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div
      className="min-h-screen relative"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
    >
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        {/* Icon Box */}
        <div
          className="w-[53px] h-[53px] flex items-center justify-center rounded-[8px] shrink-0"
          style={{ background: 'linear-gradient(243.27deg, #122467 16.75%, #0B818D 124.51%)' }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 5H7C5.9 5 5 5.9 5 7V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V7C19 5.9 18.1 5 17 5H15M9 5C9 5.6 9.4 6 10 6H14C14.6 6 15 5.6 15 5M9 5C9 4.4 9.4 4 10 4H14C14.6 4 15 4.4 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0E626E', lineHeight: '35px' }}>
            Daily Report
          </h1>
          <p style={{ fontSize: '12px', fontWeight: 500, color: '#414141', marginTop: '2px' }}>
            View all daily records - Click any date to see product details
          </p>
        </div>
      </div>

      {/* Stats Card */}
      <div
        className="rounded-[10px] p-6 mb-6"
        style={{ background: 'rgba(255,255,255,0.66)' }}
      >
        {/* Card Header */}
        <div className="mb-4">
          <p style={{ fontSize: '17px', fontWeight: 600, color: '#414141' }}>All Daily Records</p>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#7C7C7C', marginTop: '4px' }}>
            View all daily records - Click any date to see product details
          </p>
        </div>

        {/* 3 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Records - Purple */}
          <div
            className="rounded-[12px] p-4 relative overflow-hidden flex items-center justify-between"
            style={{
              background: 'linear-gradient(0deg, #E3CDFE 34.52%, #F3E9FF 100%)',
              border: '1px solid #E3BFFE',
              minHeight: '80px',
            }}
          >
            <div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#540863' }}>Total Records</p>
              <p style={{ fontSize: '25px', fontWeight: 600, color: '#540863', marginTop: '4px' }}>
                {paginatedData.totalElements}
              </p>
            </div>
            <div
              className="w-[50px] h-[50px] rounded-[13px] flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(150.68deg, #E3BFFE -29.46%, #F3E4FF 93.53%)' }}
            >
              {/* Archive/Records box icon */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Back layer */}
                <rect x="6" y="4" width="16" height="12" rx="1.5" fill="#540863" opacity="0.25"/>
                {/* Middle layer */}
                <rect x="4" y="7" width="16" height="12" rx="1.5" fill="#540863" opacity="0.45"/>
                {/* Front box */}
                <rect x="3" y="10" width="18" height="13" rx="1.5" fill="#540863"/>
                {/* Box opening at top */}
                <path d="M3 14h18" stroke="white" strokeWidth="1.2"/>
                {/* Small rectangle drawer */}
                <rect x="8" y="16" width="6" height="3.5" rx="0.8" fill="white" opacity="0.7"/>
              </svg>
            </div>
          </div>

          {/* This Page Total - Green */}
          <div
            className="rounded-[12px] p-4 relative overflow-hidden flex items-center justify-between"
            style={{
              background: 'linear-gradient(0deg, rgba(120,235,137,0.46) 34.52%, #F3E9FF 100%)',
              border: '1px solid rgba(108,208,112,0.46)',
              minHeight: '80px',
            }}
          >
            <div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#129D30' }}>Total Records</p>
              <p style={{ fontSize: '25px', fontWeight: 600, color: '#129D30', marginTop: '4px' }}>
                {summary.totalQty}
              </p>
            </div>
            <div
              className="w-[50px] h-[50px] rounded-[13px] flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(150.68deg, rgba(149,229,161,0.46) -29.46%, #E4FFEB 93.53%)' }}
            >
              {/* Bar chart + upward arrow icon */}
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Bars */}
                <rect x="3" y="17" width="4.5" height="7" rx="1" stroke="#129D30" strokeWidth="1.8" fill="none"/>
                <rect x="10" y="12" width="4.5" height="12" rx="1" stroke="#129D30" strokeWidth="1.8" fill="none"/>
                <rect x="17" y="7" width="4.5" height="17" rx="1" stroke="#129D30" strokeWidth="1.8" fill="none"/>
                {/* Upward trend arrow */}
                <path d="M4 14L9 9L14 12L21 5" stroke="#129D30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 5h4v4" stroke="#129D30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Unique Dates - Blue */}
          <div
            className="rounded-[12px] p-4 relative overflow-hidden flex items-center justify-between"
            style={{
              background: 'linear-gradient(0deg, #CDCFFE 34.52%, #E9EBFF 100%)',
              border: '1px solid #BFCCFE',
              minHeight: '80px',
            }}
          >
            <div>
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#2348CD' }}>Total Records</p>
              <p style={{ fontSize: '25px', fontWeight: 600, color: '#2348CD', marginTop: '4px' }}>
                {summary.uniqueDates}
              </p>
            </div>
            <div
              className="w-[50px] h-[50px] rounded-[13px] flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(150.68deg, #BFCCFE -29.46%, #E4EAFF 93.53%)' }}
            >
              {/* Calendar with number 2 */}
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Calendar border */}
                <rect x="3" y="4" width="20" height="19" rx="2.5" stroke="#2348CD" strokeWidth="2" fill="#2348CD" fillOpacity="0.1"/>
                {/* Top bar */}
                <rect x="3" y="4" width="20" height="6" rx="2.5" fill="#2348CD"/>
                {/* Hook left */}
                <rect x="8" y="2" width="2.5" height="5" rx="1.2" fill="#2348CD"/>
                {/* Hook right */}
                <rect x="15.5" y="2" width="2.5" height="5" rx="1.2" fill="#2348CD"/>
                {/* Number 2 */}
                <text x="13" y="19.5" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="#2348CD" fontFamily="Inter, sans-serif">2</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Date List Section */}
      <div className="rounded-[10px] overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.66)' }}>
        {loading ? (
          <div className="flex flex-col justify-center items-center py-16">
            <div className="w-10 h-10 border-4 border-[#0B818D]/20 border-t-[#0B818D] rounded-full animate-spin" />
            <p className="mt-4 text-gray-500 text-sm font-medium">Loading...</p>
          </div>
        ) : paginatedData.content.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mb-4 opacity-40">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="#5C626E" strokeWidth="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="#5C626E" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p style={{ color: '#5C626E', fontSize: '15px', fontWeight: 500 }}>No data available</p>
          </div>
        ) : (
          <div>
            {groupedByDate.map((dateGroup, idx) => (
              <div key={dateGroup.date}>
                {/* Date Row */}
                <button
                  onClick={() => setSelectedDate(selectedDate === dateGroup.date ? null : dateGroup.date)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/40 transition-colors text-left"
                >
                  {/* Calendar Icon Box */}
                  <div
                    className="w-[50px] h-[50px] rounded-[5px] flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(11,129,141,0.2)' }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="18" rx="2" stroke="#006A74" strokeWidth="2"/>
                      <path d="M16 2v4M8 2v4M3 10h18" stroke="#006A74" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>

                  {/* Date + subtitle */}
                  <div className="flex-1">
                    <p style={{ fontSize: '18px', fontWeight: 600, color: '#414141' }}>
                      {new Date(dateGroup.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p style={{ fontSize: '16px', fontWeight: 600, color: '#949494', marginTop: '2px' }}>
                      {dateGroup.productCount} products • Total Qty
                    </p>
                  </div>

                  {/* Total Qty Badge */}
                  <div
                    className="flex items-center justify-center px-4 py-1 rounded-full shrink-0"
                    style={{ background: 'rgba(11,129,141,0.2)', minWidth: '55px' }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#0E626E' }}>
                      {dateGroup.totalQty}
                    </span>
                  </div>

                  {/* Expand icon */}
                  {selectedDate === dateGroup.date ? (
                    <ChevronUp size={24} className="text-gray-500 shrink-0" />
                  ) : (
                    <ChevronDown size={24} className="text-gray-500 shrink-0" />
                  )}
                </button>

                {/* Divider */}
                {idx < groupedByDate.length - 1 && (
                  <div className="mx-6" style={{ borderBottom: '1.2px solid #C6CCD8' }} />
                )}

                {/* Expanded Product List */}
                {selectedDate === dateGroup.date && (
                  <div className="px-6 py-4" style={{ background: 'rgba(11,129,141,0.04)', borderTop: '1px solid rgba(11,129,141,0.1)' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#0B818D', marginBottom: '12px' }}>
                      Product Breakdown
                    </p>
                    <div className="space-y-2">
                      {dateGroup.items.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between rounded-[8px] px-4 py-3"
                          style={{ background: 'rgba(255,255,255,0.8)' }}
                        >
                          <div>
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#414141' }}>
                              #{product.productId} - {product.productName}
                            </p>
                            {product.productShortName && (
                              <p style={{ fontSize: '12px', color: '#949494', marginTop: '2px' }}>
                                Short: {product.productShortName}
                              </p>
                            )}
                          </div>
                          <span
                            className="flex items-center justify-center rounded-full px-3 py-1"
                            style={{ background: 'rgba(11,129,141,0.15)', fontSize: '14px', fontWeight: 600, color: '#0E626E', minWidth: '44px' }}
                          >
                            {product.totalQty}
                          </span>
                        </div>
                      ))}
                    </div>
                    {/* Export for selected date */}
                    <button
                      onClick={handleExport}
                      className="mt-3 flex items-center gap-2 px-4 py-2 rounded-[8px] text-white text-sm font-semibold transition hover:opacity-90"
                      style={{ background: '#0B818D' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 16l-4-4h3V4h2v8h3l-4 4zM5 20h14v-2H5v2z" fill="white"/>
                      </svg>
                      Export CSV
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {paginatedData.totalPages > 1 && (
        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={!paginatedData.hasPrevious}
            className="px-5 py-2 rounded-[8px] text-white font-semibold text-sm transition disabled:opacity-40"
            style={{ background: '#0B818D' }}
          >
            Previous
          </button>
          <span
            className="px-4 py-2 rounded-[8px] font-semibold text-sm"
            style={{ background: 'rgba(255,255,255,0.6)', color: '#414141' }}
          >
            Page {paginatedData.currentPage + 1} of {paginatedData.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!paginatedData.hasNext}
            className="px-5 py-2 rounded-[8px] text-white font-semibold text-sm transition disabled:opacity-40"
            style={{ background: '#0B818D' }}
          >
            Next
          </button>
        </div>
      )}

      {/* Footer */}
      <p className="text-center text-sm" style={{ color: '#5C626E' }}>
        Showing {groupedByDate.length} unique dates •{' '}
        <strong>{paginatedData.content.length} total records on this page</strong>
      </p>
    </div>
  );
};
