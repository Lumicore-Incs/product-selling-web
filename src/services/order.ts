import { api } from './api';

interface Product {
  productId: number;
  name: string;
  price: number;
  status: string;
}

interface OrderDetail {
  orderDetailsId: number;
  qty: number;
  total: number;
  productId: Product;
  orderId: number | null;
}

interface Customer {
  customerId: number;
  name: string;
  address: string;
  contact01: string;
  contact02?: string;
  date?: string;
  status?: string;
  userId?: number;
}

export interface Order {
  orderId: number;
  totalPrice: number;
  date: string;
  trackingId?: string;
  status: string;
  customerId: Customer;
  orderDetails: OrderDetail[];
}

export async function getOrders(): Promise<Order[]> {
  const response = await api.get<Order[]>('/order');
  return response.data;
}

export async function getAllCustomerOrders(): Promise<Order[]> {
  const response = await api.get<Order[]>('/order/allCustomer');
  return response.data;
}
