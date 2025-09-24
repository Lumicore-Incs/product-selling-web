import { Sale } from '../../models/sales';
import { orderApi } from '../api';
import { mapOrderDtoToSale } from '../mappers/salesMapper';

type PossibleOrderApi = {
  getAllDuplicateOrders?: () => Promise<unknown>;
  deleteOrder?: (id: string) => Promise<unknown>;
  [k: string]: unknown;
};

const api = orderApi as unknown as PossibleOrderApi;

class OrderService {
  async getAllDuplicateOrders(): Promise<Sale[]> {
    try {
      if (typeof api.getAllDuplicateOrders === 'function') {
        const resp = await api.getAllDuplicateOrders();
        if (!resp) return [];
        if (Array.isArray(resp)) {
          return (resp as unknown[]).map((o) => mapOrderDtoToSale(o));
        }
        // If API returned an object with data array (e.g. { data: [...] })
        const maybeData =
          resp && typeof resp === 'object' ? (resp as Record<string, unknown>)['data'] : undefined;
        if (Array.isArray(maybeData))
          return (maybeData as unknown[]).map((o) => mapOrderDtoToSale(o));
        return [];
      }
      throw new Error('getAllDuplicateOrders not implemented on orderApi');
    } catch (err) {
      console.error('orderService.getAllDuplicateOrders failed:', err);
      throw err;
    }
  }

  async deleteOrder(id: string): Promise<unknown> {
    try {
      if (typeof api.deleteOrder === 'function') {
        return await api.deleteOrder(id);
      }
      throw new Error('deleteOrder not implemented on orderApi');
    } catch (err) {
      console.error('orderService.deleteOrder failed:', err);
      throw err;
    }
  }

  async getOrders(): Promise<Sale[]> {
    try {
      if (typeof (api as any).getOrders === 'function') {
        const resp = await (api as any).getOrders();
        if (!resp) return [];
        if (Array.isArray(resp)) return (resp as unknown[]).map((o) => mapOrderDtoToSale(o));
        const maybeData =
          resp && typeof resp === 'object' ? (resp as Record<string, unknown>)['data'] : undefined;
        if (Array.isArray(maybeData))
          return (maybeData as unknown[]).map((o) => mapOrderDtoToSale(o));
      }
      // Fallback to getAllDuplicateOrders if available
      return this.getAllDuplicateOrders();
    } catch (err) {
      console.error('orderService.getOrders failed:', err);
      throw err;
    }
  }

  async getAllCustomerOrders(): Promise<Sale[]> {
    try {
      if (typeof (api as any).getAllCustomerOrders === 'function') {
        const resp = await (api as any).getAllCustomerOrders();
        if (!resp) return [];
        if (Array.isArray(resp)) return (resp as unknown[]).map((o) => mapOrderDtoToSale(o));
        const maybeData =
          resp && typeof resp === 'object' ? (resp as Record<string, unknown>)['data'] : undefined;
        if (Array.isArray(maybeData))
          return (maybeData as unknown[]).map((o) => mapOrderDtoToSale(o));
      }
      return [];
    } catch (err) {
      console.error('orderService.getAllCustomerOrders failed:', err);
      throw err;
    }
  }

  // Add other wrappers as needed (getById, updateOrder, createOrder)
}

export const orderService = new OrderService();

export const getAllDuplicateOrders = () => orderService.getAllDuplicateOrders();
export const deleteOrder = (id: string) => orderService.deleteOrder(id);
export const getOrders = () => orderService.getOrders();
export const getAllCustomerOrders = () => orderService.getAllCustomerOrders();
