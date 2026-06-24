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
        <div className="rounded-[21px] overflow-hidden bg-[rgba(255,255,255,0.49)] shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full font-plus-jakarta-sans">
              {/* Header */}
              <thead>
                <tr className="bg-[rgba(255,255,255,0.42)]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#414141]">Id</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#414141]">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#414141]">Short Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#414141]">Serial Prefix</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#414141]">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#414141]">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#414141]">Actions</th>
                </tr>
              </thead>

                {/* Body */}
                <tbody>
                  {products.map((product) => {
                    return (
                      <tr
                        key={product.productId}
                        className="transition even:bg-[rgba(255,255,255,0.2)] hover:bg-white/30"
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

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {product.status?.toLowerCase() === 'active' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#89FA9A]/46 text-[#016D18]">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                              {product.status || 'Inactive'}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-left">
                          <div className="flex justify-start items-center gap-3">
                            <button
                              onClick={() => onEdit(product)}
                              className="p-1 rounded-lg transition hover:bg-white/50"
                              title="Edit"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>

                            <button
                              onClick={() => onDelete(product.productId)}
                              className="p-1 rounded-lg transition hover:bg-white/50"
                              title="Delete"
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 6H5H21" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M10 11V17" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M14 11V17" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
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