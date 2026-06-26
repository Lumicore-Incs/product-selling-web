import { Edit, Trash2 } from 'lucide-react';
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
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              {/* Header */}
              <thead>
                <tr className="bg-white/60 text-gray-700">
                  <th className="px-6 py-5 text-left font-semibold">Id</th>
                  <th className="px-6 py-5 text-left font-semibold">Name</th>
                  <th className="px-6 py-5 text-left font-semibold">Short Name</th>
                  <th className="px-6 py-5 text-left font-semibold">Serial Prefix</th>
                  <th className="px-6 py-5 text-left font-semibold">Price</th>
                  <th className="px-6 py-5 text-left font-semibold">Status</th>
                  <th className="px-6 py-5 text-center font-semibold">Actions</th>
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {products.map((product, index) => {
                  return (
                    <tr
                      key={product.productId}
                      className={`border-b border-white/20 transition hover:bg-white/80 ${
                        index % 2 === 0 ? 'bg-white/50' : 'bg-transparent'
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {product.productId}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {product.name}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {product.shortName}
                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {product.serialPrefix}
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-900">
                        LKR {product.price.toFixed(2)}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          !product.status || product.status.toLowerCase() === 'active' ? 'bg-green-200 text-green-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {!product.status || product.status.toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-4">
                          <button
                            onClick={() => onEdit(product)}
                            className="text-blue-600 hover:text-blue-800 transition"
                            title="Edit"
                          >
                            <Edit className="w-5 h-5 stroke-[2]" />
                          </button>

                          <button
                            onClick={() => onDelete(product.productId)}
                            className="text-red-600 hover:text-red-800 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5 stroke-[2]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(product.productId)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2 border-t border-white/50">
              <button
                onClick={() => onEdit(product)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-blue-50 transition"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', color: '#2348CD' }}
              >
                <Edit2Icon className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => onDelete(product.productId)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-red-50 transition"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '14px', color: '#E0090C' }}
              >
                <TrashIcon className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}