export interface ProductSummary {
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

interface ExportOrderSummaryProps {
  productSummaries: ProductSummary[];
  totalPendingOrders: number;
  summaryLoading: boolean;
  onRefresh: () => void;
}

export const ExportOrderSummary = ({
  productSummaries,
  totalPendingOrders,
  summaryLoading,
  onRefresh,
}: ExportOrderSummaryProps) => {
  return (
    <div className="rounded-xl shadow-lg shadow-white/30 border border-white p-4 sm:p-6 overflow-hidden">
      <div
        className="px-4 sm:px-6 py-4 flex items-center justify-between bg-transparent text-[#0E626E]"
        style={{ fontFamily: 'revert', fontWeight: 'bold' }}
      >
        <div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Pending Orders Summary</h2>
          <p
            className="text-xs mt-0.5"
            style={{ fontFamily: 'Inter', fontWeight: 'bold', color: 'black' }}
          >
            Live stock of unprocessed orders
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[#0E626E]/50 rounded-lg px-3 py-2 text-center">
            <div className="text-white font-bold text-lg leading-tight">
              {summaryLoading ? '—' : totalPendingOrders}
            </div>
            <div className="text-white text-xs">Total Orders</div>
          </div>
          <button
            type="button"
            onClick={onRefresh}
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

      <div className="p-4 sm:p-6">
        {summaryLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : productSummaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <svg
              className="w-10 h-10 mb-2 opacity-40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <span className="text-sm">No pending orders found</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {productSummaries.map((summary, index) => {
              const color = PRODUCT_COLORS[index % PRODUCT_COLORS.length];
              return (
                <div
                  key={summary.productName}
                  className={`relative rounded-xl border-2 ${color.bg} ${color.border} p-3 sm:p-4 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div
                    className={`inline-flex items-center self-start px-2 py-0.5 rounded-full text-xs font-semibold text-white ${color.badge}`}
                  >
                    {summary.shortName}
                  </div>
                  <div className={`text-xs font-medium ${color.text} leading-tight line-clamp-2`}>
                    {summary.productName}
                  </div>
                  <div className="mt-auto flex items-end justify-between">
                    <div>
                      <div className={`text-2xl sm:text-3xl font-extrabold ${color.qty} leading-none`}>
                        {summary.totalQty}
                      </div>
                    </div>
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
  );
};
