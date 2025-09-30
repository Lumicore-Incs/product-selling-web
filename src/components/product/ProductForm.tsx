import React, { useEffect, useState } from 'react';
import { Product } from '../../models/product';
interface ProductFormProps {
  product: Product | null;
  onAdd: (name: string, price: number) => void;
  onUpdate: (product: Product) => void;
  loading?: boolean;
}
export function ProductForm({ product, onAdd, onUpdate, loading }: Readonly<ProductFormProps>) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'remove'>('active');
  const [errors, setErrors] = useState({
    name: '',
    price: '',
  });
  // Initialize form when editing a product
  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price.toString());
      setStatus((product.status as 'active' | 'inactive' | 'remove') ?? 'active');
    } else {
      // Reset form for new product
      setName('');
      setPrice('');
      setStatus('active');
    }
    setErrors({
      name: '',
      price: '',
    });
  }, [product]);
  const validate = () => {
    const newErrors = {
      name: '',
      price: '',
    };
    let isValid = true;
    if (!name.trim()) {
      newErrors.name = 'Product name is required';
      isValid = false;
    }
    const priceValue = parseFloat(price);
    if (!price || isNaN(priceValue) || priceValue <= 0) {
      newErrors.price = 'Valid price is required';
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const priceValue = parseFloat(price);
    if (product) {
      // Update existing product
      onUpdate({
        ...product,
        name,
        price: priceValue,
        status,
      });
    } else {
      // Add new product
      onAdd(name, priceValue);
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price ($)
          </label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            step="0.01"
            min="0"
            className={`mt-1 block w-full px-3 py-2 border ${
              errors.price ? 'border-red-500' : 'border-gray-300'
            } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
          />
          {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
        </div>
        {product && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {loading
              ? product
                ? 'Updating...'
                : 'Adding...'
              : product
              ? 'Update Product'
              : 'Add Product'}
          </button>
        </div>
      </div>
    </form>
  );
}
