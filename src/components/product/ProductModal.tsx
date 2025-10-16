import { XIcon } from 'lucide-react';
import { Product } from '../../models/product';
import { ProductForm } from './ProductForm';
interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAdd: (name: string, price: number, serialPrefix: string) => void;
  onUpdate: (product: Product) => void;
  loading?: boolean;
}
export function ProductModal({
  isOpen,
  onClose,
  product,
  onAdd,
  onUpdate,
  loading,
}: ProductModalProps) {
  if (!isOpen) return null;
  const isEditing = !!product;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4">
          <ProductForm product={product} onAdd={onAdd} onUpdate={onUpdate} loading={loading} />
        </div>
      </div>
    </div>
  );
}
