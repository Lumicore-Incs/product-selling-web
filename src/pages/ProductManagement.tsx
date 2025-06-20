import { useEffect, useState } from 'react';
import { Header } from '../components/product/Header';
import { ProductTable } from '../components/product/ProductTable';
import { ProductModal } from '../components/product/ProductModal';
import { productApi, ProductDto, authUtils } from '../services/api';

// Updated Product type to match backend
export type Product = {
  productId: number;
  name: string;
  price: number;
  status: 'active' | 'inactive';
};

export const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      // For local filtering
      const results = products.filter(product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.productId.toString().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(results);
    }
  }, [searchTerm, products]);

  // Load all products from backend
  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const backendProducts = await productApi.getAllProducts();

      // Transform backend data to match frontend Product type
      const transformedProducts: Product[] = backendProducts.map(product => ({
        productId: product.productId || 0,
        name: product.name,
        price: product.price,
        status: product.status || 'active'
      }));

      setProducts(transformedProducts);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      setError('Failed to load products. Please check your connection and authentication.');

      // If unauthorized, you might want to redirect to login
      if (error.response?.status === 401) {
        authUtils.removeToken();
        setError('Authentication expired. Please log in again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler for adding a new product
  const handleAddProduct = async (name: string, price: number) => {
    setLoading(true);
    setError(null);
    try {
      const newProductData: Omit<ProductDto, 'productId'> = {
        name,
        price,
        status: 'active'
      };

      const savedProduct = await productApi.createProduct(newProductData);

      // Add new product to local state
      const newProduct: Product = {
        productId: savedProduct.productId || 0,
        name: savedProduct.name,
        price: savedProduct.price,
        status: savedProduct.status || 'active'
      };

      setProducts([...products, newProduct]);
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Failed to add product:', error);
      setError('Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for updating a product
  const handleUpdateProduct = async (updatedProduct: Product) => {
    setLoading(true);
    setError(null);
    try {
      const updateData: Omit<ProductDto, 'productId'> = {
        name: updatedProduct.name,
        price: updatedProduct.price,
        status: updatedProduct.status
      };

      const savedProduct = await productApi.updateProduct(updatedProduct.productId, updateData);

      // Update product in local state
      setProducts(products.map(product =>
          product.productId === updatedProduct.productId
              ? {
                productId: savedProduct.productId || updatedProduct.productId,
                name: savedProduct.name,
                price: savedProduct.price,
                status: savedProduct.status || 'active'
              }
              : product
      ));

      setIsModalOpen(false);
      setCurrentProduct(null);
    } catch (error: any) {
      console.error('Failed to update product:', error);
      setError('Failed to update product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for deleting a product
  const handleDeleteProduct = async (productId: string | number) => {
    const id = typeof productId === 'string' ? parseInt(productId) : productId;

    if (window.confirm('Are you sure you want to delete this product?')) {
      setLoading(true);
      setError(null);
      try {
        await productApi.deleteProduct(id);

        // Remove product from local state
        setProducts(products.filter(product => product.productId !== id));
      } catch (error: any) {
        console.error('Failed to delete product:', error);
        setError('Failed to delete product. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handler for opening edit modal
  const handleEditClick = (product: Product) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  // Handler for opening add modal
  const handleAddClick = () => {
    setCurrentProduct(null);
    setIsModalOpen(true);
  };

  // Handler for refresh
  const handleRefresh = () => {
    loadProducts();
  };

  return (
      <div className="min-h-screen bg-gray-50">
        <Header
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAddClick={handleAddClick}
            onRefresh={handleRefresh}
            loading={loading}
        />

        <main className="container mx-auto px-4 py-8">
          {/* Error Message */}
          {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
                <button
                    onClick={() => setError(null)}
                    className="ml-2 text-red-900 hover:text-red-700"
                >
                  ×
                </button>
              </div>
          )}

          {/* Loading State */}
          {loading && (
              <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
                Loading products...
              </div>
          )}

          {/* Authentication Check */}
          {!authUtils.isAuthenticated() && (
              <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
                Please log in to manage products. Some features may not work without authentication.
              </div>
          )}

          <ProductTable
              products={filteredProducts}
              onEdit={handleEditClick}
              onDelete={handleDeleteProduct}
              loading={loading}
          />

          <ProductModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setCurrentProduct(null);
                setError(null);
              }}
              product={currentProduct}
              onAdd={handleAddProduct}
              onUpdate={handleUpdateProduct}
              loading={loading}
          />
        </main>
      </div>
  );
};