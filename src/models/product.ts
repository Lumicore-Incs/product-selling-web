export interface Product {
  productId: number | string;
  name: string;
  price: number;
  status?: 'active' | 'inactive' | 'remove' | string;
}

export default Product;
