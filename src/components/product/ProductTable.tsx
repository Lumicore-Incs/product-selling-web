import { Edit2Icon, TrashIcon } from 'lucide-react';
import { Product } from '../../models/product';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string | number) => void;
  loading?: boolean;
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center text-gray-500">
        No products found.
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'transparent' }}>
          <div className="rounded-t-2xl overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full" style={{fontFamily:'inter'}}>
                {/* Header */}
                <thead>
                  <tr className="border-b border-white bg-white">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Id</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Short Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Serial Prefix</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Price</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {products.map((product, index) => {
                    return (
                      <tr
                        key={product.productId}
                        className={`border-b-2 border-white transition hover:bg-blue-100 ${
                          index % 2 === 0 ? 'bg-blue-50' : 'bg-blue-50'
                        } hover:bg-blue-100`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {product.productId}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {product.name}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {product.shortName}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {product.serialPrefix}
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          LKR {product.price.toFixed(2)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-3">
                            <button
                              onClick={() => onEdit(product)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 p-2 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2Icon className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() => onDelete(product.productId)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-100 p-2 rounded-lg transition"
                              title="Delete"
                            >
                              <TrashIcon className="w-5 h-5" />
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
          <div className="h-2" style={{ backgroundColor: '#E8EEF5' }} />
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.productId}
              className="rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition"
            >
              <div className="p-4">
                {/* Header Row */}
                <div className="flex items-start justify-between mb-3 font-family-inter">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        #{product.productId}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 break-words">
                      {product.name}
                    </h3>
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-2 mb-4" style={{fontFamily:'Inter'}}>
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-gray-600">Short Name:</span>
                    <span className="text-gray-900 font-medium text-right">{product.shortName}</span>
                  </div>
                  <div className="flex justify-between items-start text-sm">
                    <span className="text-gray-600">Serial Prefix:</span>
                    <span className="text-gray-900 font-medium text-right">{product.serialPrefix}</span>
                  </div>
                  <div className="flex justify-between items-start text-sm border-t pt-2">
                    <span className="text-gray-600">Price:</span>
                    <span className="text-lg font-bold text-green-600">LKR {product.price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => onEdit(product)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit2Icon className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(product.productId)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}