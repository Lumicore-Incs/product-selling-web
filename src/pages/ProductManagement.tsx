import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BackgroundIcons } from '../components/BackgroundIcons';
import { Header } from '../components/product/Header';
import { ProductModal } from '../components/product/ProductModal';
import { ProductTable } from '../components/product/ProductTable';
import { productApi, ProductDto } from '../services/api';
import { isAuthenticated, removeToken } from '../services/authUtils';

// Updated Product type to match backend
export type Product = {
  productId: number;
  name: string;
  price: number;
  status: 'active' | 'inactive' | 'remove';
};

export const ProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

      const transformedProducts: Product[] = backendProducts.map((product) => ({
        productId: product.productId || 0,
        name: product.name,
        price: product.price,
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
  const handleAddProduct = async (name: string, price: number) => {
    setLoading(true);
    try {
      const newProductData: Omit<ProductDto, 'productId'> = {
        name,
        price,
        status: 'active',
      };

      const savedProduct = await productApi.createProduct(newProductData);

      const newProduct: Product = {
        productId: savedProduct.productId || 0,
        name: savedProduct.name,
        price: savedProduct.price,
        status: savedProduct.status || 'active',
      };

      setProducts([...products, newProduct]);
      setIsModalOpen(false);
      showToast('Product added successfully!', 'success');
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
        price: updatedProduct.price,
        status: validStatus,
      };

      const savedProduct = await productApi.updateProduct(updatedProduct.productId, updateData);

      setProducts(
        products.map((product) =>
          product.productId === updatedProduct.productId
            ? {
                productId: savedProduct.productId || updatedProduct.productId,
                name: savedProduct.name,
                price: savedProduct.price,
                status: savedProduct.status || 'active',
              }
            : product
        )
      );

      setIsModalOpen(false);
      setCurrentProduct(null);
      showToast('Product updated successfully!', 'success');
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

    setLoading(true);
    try {
      await productApi.deleteProduct(id);
      setProducts(products.filter((product) => product.productId !== id));
      showToast('Product deleted successfully!', 'success');
      loadProducts(); // Refresh the table after delete
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      showToast('Failed to delete product. Please try again.', 'error');
    } finally {
      setLoading(false);
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
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddClick={handleAddClick}
        onRefresh={handleRefresh}
        loading={loading}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {loading && (
          <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            Loading products...
          </div>
        )}

        {/* Authentication Check */}
        {!isAuthenticated() && (
          <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
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
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Showing {paginatedProducts.length} of {filteredProducts.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded border ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Prev
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded border ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
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
