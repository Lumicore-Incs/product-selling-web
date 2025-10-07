import { Sale } from '../../models/sales';
import apiClient from '../axiosConfig';
import { mapOrderDtoToSale } from '../mappers/salesMapper';

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

  //currently not used
  async getTodaysOrders(): Promise<Sale[]> {
    try {
      const resp = await apiClient.get('/order');
      const data = resp?.data;
      if (!data) return [];
      if (Array.isArray(data)) return (data as unknown[]).map((o) => mapOrderDtoToSale(o));
      const maybeData =
        data && typeof data === 'object' ? (data as Record<string, unknown>)['data'] : undefined;
      if (Array.isArray(maybeData))
        return (maybeData as unknown[]).map((o) => mapOrderDtoToSale(o));
      return [];
    } catch (err) {
      console.error('orderService.getTodaysOrders failed:', err);
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

  async updateDuplicateOrder(id: string, payload: unknown): Promise<unknown> {
    try {
      // Delegate to backend endpoint for resolving/updating an order
      const putResp = await apiClient.put(`/order/${id}/duplicate`, payload as object);
      return putResp.data;
    } catch (err) {
      console.error('orderService.updateOrder failed:', err);
      throw err;
    }
  }

  async getOrders(): Promise<Sale[]> {
    try {
      // Prefer direct backend call for today's orders
      const resp = await apiClient.get('/order');
      const data = resp?.data;
      if (!data) return [];
      if (Array.isArray(data)) return (data as unknown[]).map((o) => mapOrderDtoToSale(o));
      const maybeData =
        data && typeof data === 'object' ? (data as Record<string, unknown>)['data'] : undefined;
      if (Array.isArray(maybeData))
        return (maybeData as unknown[]).map((o) => mapOrderDtoToSale(o));
      // Fallback to duplicate orders endpoint
      return this.getAllDuplicateOrders();
    } catch (err) {
      console.error('orderService.getOrders failed:', err);
      throw err;
    }
  }

  async getAllCustomerOrders(): Promise<Sale[]> {
    try {
      const resp = await apiClient.get('/order/allCustomer');
      const data = resp?.data;
      if (!data) return [];
      if (Array.isArray(data)) return (data as unknown[]).map((o) => mapOrderDtoToSale(o));
      const maybeData =
        data && typeof data === 'object' ? (data as Record<string, unknown>)['data'] : undefined;
      if (Array.isArray(maybeData))
        return (maybeData as unknown[]).map((o) => mapOrderDtoToSale(o));
      return [];
    } catch (err) {
      console.error('orderService.getAllCustomerOrders failed:', err);
      throw err;
    }
  }
}

export const orderService = new OrderService();

export const getAllDuplicateOrders = () => orderService.getAllDuplicateOrders();
export const deleteOrder = (id: string) => orderService.deleteOrder(id);
export const getOrders = () => orderService.getOrders();
export const getAllCustomerOrders = () => orderService.getAllCustomerOrders();
