export interface Product {
  productId: number | string;
  name: string;
  price: number;
  serialPrefix: string;
  status?: 'active' | 'inactive' | 'remove' | string;
}

export default Product;
