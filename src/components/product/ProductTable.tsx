import { Edit2Icon, TrashIcon } from 'lucide-react';
import { Product } from '../../models/product';
interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (productId: string | number) => void;
  loading?: boolean;
}
export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {products.length === 0 ? (
        <div className="p-6 sm:p-8 text-center text-gray-500 text-sm sm:text-base">
          No products found. Add a new product to get started.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Short Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serial Prefix
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.productId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.productId}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.name}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.shortName}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.serialPrefix}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Lkr {product.price.toFixed(2)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const status = (product.status || '').toString();
                        const lower = status.toLowerCase();
                        const label = status
                          ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
                          : '-';
                        const classes =
                          lower === 'active'
                            ? 'bg-green-100 text-green-800'
                            : lower === 'inactive'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800';

                        return (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classes}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onEdit(product)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          aria-label="Edit product"
                        >
                          <Edit2Icon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => onDelete(product.productId)}
                          className="text-red-600 hover:text-red-900 p-1"
                          aria-label="Delete product"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {products.map((product) => (
              <div key={product.productId} className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 uppercase font-semibold">ID</p>
                    <p className="text-sm font-medium text-gray-900">{product.productId}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => onEdit(product)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      aria-label="Edit product"
                    >
                      <Edit2Icon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(product.productId)}
                      className="text-red-600 hover:text-red-900 p-1"
                      aria-label="Delete product"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Name</p>
                    <p className="text-sm text-gray-900 truncate">{product.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Short Name</p>
                    <p className="text-sm text-gray-900 truncate">{product.shortName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Serial Prefix</p>
                    <p className="text-sm text-gray-900 truncate">{product.serialPrefix}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Price</p>
                    <p className="text-sm text-gray-900">Lkr {product.price.toFixed(2)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Status</p>
                  {(() => {
                    const status = (product.status || '').toString();
                    const lower = status.toLowerCase();
                    const label = status
                      ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
                      : '-';
                    const classes =
                      lower === 'active'
                        ? 'bg-green-100 text-green-800'
                        : lower === 'inactive'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800';

                    return (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${classes}`}>
                        {label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
