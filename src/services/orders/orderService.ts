import { Sale } from '../../models/sales';
import { orderApi } from '../api';
import apiClient from '../axiosConfig';
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
      // Directly call the backend endpoint and map DTOs to Sale model
      const resp = await apiClient.get('/order/duplicate');
      const data = resp?.data;
      if (!data) return [];
      if (Array.isArray(data)) return (data as unknown[]).map((o) => mapOrderDtoToSale(o));
      const maybeData =
        data && typeof data === 'object' ? (data as Record<string, unknown>)['data'] : undefined;
      if (Array.isArray(maybeData))
        return (maybeData as unknown[]).map((o) => mapOrderDtoToSale(o));
      return [];
    } catch (err) {
      console.error('orderService.getAllDuplicateOrders failed:', err);
      throw err;
    }
  }

  async deleteOrder(id: string): Promise<unknown> {
    try {
      // Call the backend DELETE /order/{id}
      const resp = await apiClient.delete(`/order/${id}`);
      return resp.data;
    } catch (err) {
      console.error('orderService.deleteOrder failed:', err);
      throw err;
    }
  }

  async updateOrder(id: string, payload: unknown): Promise<unknown> {
    try {
      // Delegate to backend endpoint for resolving/updating an order
      const putResp = await apiClient.put(`/order/${id}/resolve`, payload as object);
      return putResp.data;
    } catch (err) {
      console.error('orderService.updateOrder failed:', err);
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
