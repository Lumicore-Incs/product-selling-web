import { EditIcon, Trash2Icon } from 'lucide-react';
import { Product } from '../../models/product';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string | number) => void;
  loading?: boolean;
  totalCount?: number;
  currentPage?: number;
  totalPages?: number;
  onPrev?: () => void;
  onNext?: () => void;
}

const cellStyle: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontWeight: 500,
  fontSize: '14px',
  lineHeight: '18px',
  color: '#374151',
  padding: '20px 24px',
};

const headerCellStyle: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  fontWeight: 500,
  fontSize: '14px',
  lineHeight: '18px',
  color: '#757B87',
  padding: '20px 24px',
  textAlign: 'left' as const,
  background: 'transparent',
};

export function ProductTable({
  products,
  onEdit,
  onDelete,
  loading,
  totalCount,
  currentPage = 1,
  totalPages = 1,
  onPrev,
  onNext,
}: ProductTableProps) {
  if (!loading && products.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 rounded-[18px]"
        style={{ background: 'rgba(255, 255, 255, 0.49)' }}
      >
        <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', color: '#5C626E' }}>
          No products found.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <div
          className="overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.49)',
            borderRadius: '18px',
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Header Row */}
              <thead>
                <tr
                  style={{
                    background: 'rgba(255, 255, 255, 0.42)',
                    borderBottom: '1px solid #FFFFFF',
                  }}
                >
                  <th style={headerCellStyle}>Id</th>
                  <th style={headerCellStyle}>Name</th>
                  <th style={headerCellStyle}>Short Name</th>
                  <th style={headerCellStyle}>Serial Prefix</th>
                  <th style={headerCellStyle}>Price</th>
                  <th style={headerCellStyle}>Status</th>
                  <th style={{ ...headerCellStyle, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr
                    key={product.productId}
                    className="hover:bg-white/30 transition-colors"
                    style={{ borderBottom: '1px solid #FFFFFF' }}
                  >
                    <td style={cellStyle}>{product.productId}</td>
                    <td style={cellStyle}>{product.name}</td>
                    <td style={cellStyle}>{product.shortName}</td>
                    <td style={cellStyle}>{product.serialPrefix}</td>
                    <td style={cellStyle}>LKR {Number(product.price).toFixed(2)}</td>

                    {/* Status Badge */}
                    <td style={{ ...cellStyle }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '2px 8px',
                          borderRadius: '17px',
                          background:
                            product.status === 'inactive'
                              ? 'rgba(255, 100, 100, 0.25)'
                              : 'rgba(137, 250, 154, 0.46)',
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          fontWeight: 500,
                          fontSize: '12px',
                          lineHeight: '15px',
                          color: product.status === 'inactive' ? '#9B0000' : '#016D18',
                        }}
                      >
                        {product.status === 'inactive' ? 'Inactive' : 'Active'}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td style={{ ...cellStyle, textAlign: 'center' }}>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => onEdit(product)}
                          title="Edit"
                          className="hover:opacity-70 transition-opacity"
                        >
                          <EditIcon
                            style={{ width: '20px', height: '20px', color: '#2348CD' }}
                          />
                        </button>
                        <button
                          onClick={() => onDelete(product.productId)}
                          title="Delete"
                          className="hover:opacity-70 transition-opacity"
                        >
                          <Trash2Icon
                            style={{ width: '22px', height: '22px', color: '#E0090C' }}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between px-6 py-4">
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 400,
                fontSize: '12px',
                lineHeight: '15px',
                color: '#5C626E',
              }}
            >
              Showing {products.length} of {totalCount ?? products.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onPrev}
                disabled={currentPage <= 1}
                className="w-[15px] h-[15px] flex items-center justify-center rounded-sm disabled:opacity-30 hover:opacity-70 transition"
                style={{ background: 'rgba(255,255,255,0.75)' }}
              >
                <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
                  <path d="M6 1L2 5L6 9" stroke="#757B87" strokeWidth="1.5" />
                </svg>
              </button>
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 300,
                  fontSize: '15px',
                  lineHeight: '18px',
                  color: '#5C626E',
                  minWidth: '20px',
                  textAlign: 'center',
                }}
              >
                {currentPage}
              </span>
              <button
                onClick={onNext}
                disabled={currentPage >= totalPages}
                className="w-[15px] h-[15px] flex items-center justify-center rounded-sm disabled:opacity-30 hover:opacity-70 transition"
                style={{ background: 'rgba(255,255,255,0.75)' }}
              >
                <svg width="8" height="10" viewBox="0 0 8 10" fill="none">
                  <path d="M2 1L6 5L2 9" stroke="#757B87" strokeWidth="1.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {products.map((product) => (
          <div
            key={product.productId}
            className="rounded-2xl p-4"
            style={{ background: 'rgba(255, 255, 255, 0.6)' }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '12px', color: '#5C626E' }}>
                  #{product.productId}
                </p>
                <h3
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: '14px',
                    color: '#414141',
                  }}
                >
                  {product.name}
                </h3>
              </div>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '17px',
                  background:
                    product.status === 'inactive'
                      ? 'rgba(255, 100, 100, 0.25)'
                      : 'rgba(137, 250, 154, 0.46)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 500,
                  fontSize: '12px',
                  color: product.status === 'inactive' ? '#9B0000' : '#016D18',
                }}
              >
                {product.status === 'inactive' ? 'Inactive' : 'Active'}
              </span>
            </div>
            <div className="space-y-1 mb-3">
              {[
                ['Short Name', product.shortName],
                ['Serial Prefix', product.serialPrefix],
                ['Price', `LKR ${Number(product.price).toFixed(2)}`],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', color: '#5C626E' }}
                  >
                    {label}:
                  </span>
                  <span
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#414141',
                    }}
                  >
                    {val}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2 border-t border-white/50">
              <button
                onClick={() => onEdit(product)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-blue-50 transition"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', color: '#2348CD' }}
              >
                <EditIcon className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => onDelete(product.productId)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-red-50 transition"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', color: '#E0090C' }}
              >
                <Trash2Icon className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}