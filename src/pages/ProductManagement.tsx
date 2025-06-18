import { useEffect, useState } from 'react';
import { Header } from '../components/product/Header';
import { ProductTable } from '../components/product/ProductTable';
import { ProductModal } from '../components/product/ProductModal';
// Product type definition
export type Product = {
  productId: string;
  name: string;
  price: number;
  status: 'active' | 'inactive';
};
// Initial mock data
const initialProducts: Product[] = [{
  productId: 'p1',
  name: 'Wireless Headphones',
  price: 99.99,
  status: 'active'
}, {
  productId: 'p2',
  name: 'Smart Watch',
  price: 199.99,
  status: 'active'
}, {
  productId: 'p3',
  name: 'Bluetooth Speaker',
  price: 79.99,
  status: 'inactive'
}, {
  productId: 'p4',
  name: 'Laptop Stand',
  price: 29.99,
  status: 'active'
}, {
  productId: 'p5',
  name: 'USB-C Hub',
  price: 49.99,
  status: 'inactive'
}];

export const ProductManagement = () => {
const [products, setProducts] = useState<Product[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  // Filter products based on search term
  useEffect(() => {
    const results = products.filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()) || product.productId.toLowerCase().includes(searchTerm.toLowerCase()));
    setFilteredProducts(results);
  }, [searchTerm, products]);
  // Handler for adding a new product
  const handleAddProduct = (name: string, price: number) => {
    const newProduct: Product = {
      productId: `p${products.length + 1}`,
      name,
      price,
      status: 'active'
    };
    setProducts([...products, newProduct]);
    setIsModalOpen(false);
  };
  // Handler for updating a product
  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(products.map(product => product.productId === updatedProduct.productId ? updatedProduct : product));
    setIsModalOpen(false);
    setCurrentProduct(null);
  };
  // Handler for deleting a product
  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(product => product.productId !== productId));
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
  return <div className="min-h-screen bg-gray-50">
      <Header searchTerm={searchTerm} onSearchChange={setSearchTerm} onAddClick={handleAddClick} />
      <main className="container mx-auto px-4 py-8">
        <ProductTable products={filteredProducts} onEdit={handleEditClick} onDelete={handleDeleteProduct} />
        <ProductModal isOpen={isModalOpen} onClose={() => {
        setIsModalOpen(false);
        setCurrentProduct(null);
      }} product={currentProduct} onAdd={handleAddProduct} onUpdate={handleUpdateProduct} />
      </main>
    </div>;
}