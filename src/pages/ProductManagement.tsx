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

      const savedProduct = await productApi.createProduct(newProductData);

      const newProduct: Product = {
        productId: savedProduct.productId || 0,
        name: savedProduct.name,
        shortName: savedProduct.shortName || shortName,
        price: savedProduct.price,
        serialPrefix: savedProduct.serialPrefix,
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
        shortName: updatedProduct.shortName,
        price: updatedProduct.price,
        serialPrefix: updatedProduct.serialPrefix,
        status: validStatus,
      };

      const id =
        typeof updatedProduct.productId === 'string'
          ? parseInt(updatedProduct.productId)
          : updatedProduct.productId;
      const savedProduct = await productApi.updateProduct(id, updateData);

      setProducts(
        products.map((product) =>
          product.productId === id
            ? {
                productId: savedProduct.productId ?? id,
                name: savedProduct.name,
                shortName: savedProduct.shortName || updatedProduct.shortName,
                price: savedProduct.price,
                serialPrefix: savedProduct.serialPrefix,
                status: savedProduct.status ?? 'active',
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

  // Handler for refresh
  const handleRefresh = () => {
    loadProducts();
  };

  return (
    <div className="min-h-screen relative" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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

      <div className="px-4 sm:px-6 py-6">
        {/* Page Header */}
        <Header
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddClick={handleAddClick}
          onRefresh={handleRefresh}
          loading={loading}
        />

        {/* Loading Banner */}
        {loading && (
          <div className="mb-4 p-3 text-sm rounded-xl text-center"
            style={{ background: 'rgba(11,129,141,0.1)', color: '#0B818D', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Loading products...
          </div>
        )}

        {/* Table */}
        <ProductTable
          products={paginatedProducts}
          onEdit={handleEditClick}
          onDelete={handleDeleteProduct}
          loading={loading}
          totalCount={filteredProducts.length}
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        />
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
    </div>
  );
};
