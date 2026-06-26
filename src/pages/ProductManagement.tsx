import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { Header } from '../components/product/Header';
import { ProductModal } from '../components/product/ProductModal';
import { ProductTable } from '../components/product/ProductTable';
import { productApi, ProductDto } from '../services/api';
import { isAuthenticated, removeToken } from '../services/authUtils';

// Updated Product type to match backend
import { Product as ProductModel } from '../models/product';

export type Product = ProductModel;

export const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Reset to first page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, products]);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const results = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.productId.toString().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(results);
    }
  }, [searchTerm, products]);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    toast[type](message, {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  // Load all products from backend
  const loadProducts = async () => {
    setLoading(true);
    try {
      const backendProducts = await productApi.getAllProducts();

      const transformedProducts: Product[] = backendProducts
        .filter((product) => product.status?.toLowerCase() !== 'remove')
        .map((product) => ({
          productId: product.productId || 0,
          name: product.name,
          shortName: product.shortName || '',
          price: product.price,
          serialPrefix: product.serialPrefix,
          status: product.status || 'active',
        }));

      setProducts(transformedProducts);
    } catch (error: any) {
      console.error('Failed to load products:', error);
      showToast(
        'Failed to load products. Please check your connection and authentication.',
        'error'
      );

      if (error.response?.status === 401) {
        removeToken();
        showToast('Authentication expired. Please log in again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handler for adding a new product
  const handleAddProduct = async (name: string, shortName: string, price: number, serialPrefix: string) => {
    setLoading(true);
    try {
      const newProductData: Omit<ProductDto, 'productId'> = {
        name,
        shortName,
        price,
        serialPrefix,
        status: 'active',
      };

      await productApi.createProduct(newProductData);

      setIsModalOpen(false);
      showToast('Product added successfully!', 'success');
      await loadProducts(); // Refresh the table from the backend to get the real ID
    } catch (error: any) {
      console.error('Failed to add product:', error);
      showToast('Failed to add product. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler for updating a product
  const handleUpdateProduct = async (updatedProduct: Product) => {
    setLoading(true);
    try {
      const validStatus = updatedProduct.status === 'inactive' ? 'inactive' : 'active';
      const updateData: Omit<ProductDto, 'productId'> = {
        name: updatedProduct.name,
        shortName: updatedProduct.shortName,
        price: updatedProduct.price,
        serialPrefix: updatedProduct.serialPrefix,
        status: validStatus,
      };

      const id =
        typeof updatedProduct.productId === 'string'
          ? parseInt(updatedProduct.productId)
          : updatedProduct.productId;
          
      await productApi.updateProduct(id, updateData);

      setIsModalOpen(false);
      setCurrentProduct(null);
      showToast('Product updated successfully!', 'success');
      await loadProducts(); // Refresh the table from the backend
    } catch (error: any) {
      console.error('Failed to update product:', error);
      showToast('Failed to update product. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler for deleting a product
  const handleDeleteProduct = async (productId: string | number) => {
    const id = typeof productId === 'string' ? parseInt(productId) : productId;
    
    const productToDelete = products.find(p => p.productId === id);
    if (!productToDelete) return;

    setLoading(true);
    try {
      // Perform soft delete by updating the status to 'remove'
      // This ensures the backend hides/removes it if the DELETE endpoint is not functioning.
      await productApi.updateProduct(id, {
        name: productToDelete.name,
        shortName: productToDelete.shortName,
        price: productToDelete.price,
        serialPrefix: productToDelete.serialPrefix,
        status: 'remove',
      });
      
      showToast('Product deleted successfully!', 'success');
      await loadProducts(); // Refresh the table after delete
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      showToast('Failed to delete product. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handler for opening edit modal
  const handleEditClick = (product: Product) => {
    // Ensure currentProduct has numeric productId for local state consistency
    const normalized = {
      ...product,
      productId:
        typeof product.productId === 'string' ? parseInt(product.productId) : product.productId,
    } as Product;
    setCurrentProduct(normalized);
    setIsModalOpen(true);
  };

  // Handler for opening add modal
  const handleAddClick = () => {
    setCurrentProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen mx-6 relative">
      <BackgroundIcons type="product" />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <Header
        onAddClick={handleAddClick}
      />

      <main className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
        {/* Loading State */}
        {loading && (
          <div className="mb-4 p-3 sm:p-4 bg-blue-100 border border-blue-400 text-blue-700 text-sm sm:text-base rounded">
            Loading products...
          </div>
        )}

        {/* Authentication Check */}
        {!isAuthenticated() && (
          <div className="mb-4 p-3 sm:p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 text-sm sm:text-base rounded">
            Please log in to manage products. Some features may not work without authentication.
          </div>
        )}

        <ProductTable
          products={paginatedProducts}
          onEdit={handleEditClick}
          onDelete={handleDeleteProduct}
          loading={loading}
        />

        {/* Pagination Controls */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p className="order-2 sm:order-1 mt-4 sm:mt-0">
            Showing {paginatedProducts.length} of {filteredProducts.length} entries
          </p>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-5 h-5 flex items-center justify-center rounded bg-white/50 text-gray-500 hover:bg-white/80 transition-colors disabled:opacity-50"
            >
              {'<'}
            </button>
            <span className="w-5 h-5 flex items-center justify-center rounded bg-white text-blue-600 font-medium shadow-sm">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-5 h-5 flex items-center justify-center rounded bg-white/50 text-gray-500 hover:bg-white/80 transition-colors disabled:opacity-50"
            >
              {'>'}
            </button>
          </div>
        </div>

        <ProductModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setCurrentProduct(null);
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
