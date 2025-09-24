// Canonical frontend sale models

export interface SaleItem {
  productId: string; // frontend uses string ids
  productName: string;
  qty: number; // canonical quantity name (form uses 'qty')
  // compatibility: some components use 'quantity'
  quantity?: number;
  price: number;
  total: number; // price * qty
  orderDetailsId?: string;
  orderId?: string;
}

export interface Sale {
  id: string;
  customerId?: string;
  name: string;
  address: string;
  contact01?: string;
  contact02?: string;
  status?: string;
  // total item count on the sale
  qty: number;
  remark?: string;
  items: SaleItem[];
  // canonical sale total
  totalPrice: number;
}

export default Sale;
