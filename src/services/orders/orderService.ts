import { Sale } from '../../models/sales';
import apiClient from '../axiosConfig';
import { mapOrderDtoToSale } from '../mappers/salesMapper';

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // 0-based current page index
  size: number;
  first: boolean;
  last: boolean;
}

export interface AllCustomerOrdersParams {
  page?: number;
  size?: number;
  status?: string;
  search?: string;
}

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

  async getAllCustomerOrdersPaginated(
    params: AllCustomerOrdersParams = {},
  ): Promise<PagedResponse<Sale>> {
    try {
      const { page = 0, size = 5, status = '', search = '' } = params;
      const resp = await apiClient.get('/order/allCustomer', {
        params: {
          page,
          size,
          status: status === 'all' ? '' : status,
          search,
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = resp?.data as any;
      return {
        content: Array.isArray(data?.content)
          ? (data.content as unknown[]).map((o) => mapOrderDtoToSale(o))
          : [],
        totalElements: data?.totalElements ?? 0,
        totalPages: data?.totalPages ?? 0,
        number: data?.number ?? 0,
        size: data?.size ?? size,
        first: data?.first ?? true,
        last: data?.last ?? true,
      };
    } catch (err) {
      console.error('orderService.getAllCustomerOrdersPaginated failed:', err);
      throw err;
    }
  }

  async getUserDetails(id: number | string): Promise<any> {
    try {
      const resp = await apiClient.get(`/dashboard/getUserDetails/${id}`);
      return resp?.data || null;
    } catch (err) {
      console.error('orderService.getUserDetails failed:', err);
      throw err;
    }
  }

  async updateTrackingStatus(): Promise<void> {
    try {
      await apiClient.get('dashboard/updateTrackingStatus');
    } catch (err) {
      console.error('orderService.updateTrackingStatus failed:', err);
      throw err;
    }
  }
}

export const orderService = new OrderService();

interface TrackingUploadDto {
  wayBillNo: string;
  orderId: string;
  customerName: string;
  contact: string;
}

async function uploadTrackingData(trackingList: TrackingUploadDto[]): Promise<string> {
  try {
    const response = await apiClient.post('/order', trackingList);
    return response.data as string;
  } catch (error) {
    console.error('Failed to upload tracking data:', error);
    throw error;
  }
}

export const getAllDuplicateOrders = () => orderService.getAllDuplicateOrders();
export const deleteOrder = (id: string) => orderService.deleteOrder(id);
export const getOrders = () => orderService.getOrders();
export const getAllCustomerOrders = () => orderService.getAllCustomerOrders();
export const getAllCustomerOrdersPaginated = (params?: AllCustomerOrdersParams) =>
  orderService.getAllCustomerOrdersPaginated(params);
export const uploadTracking = (trackingList: TrackingUploadDto[]) =>
  uploadTrackingData(trackingList);
export const getUserDetails = (id: string | number) => orderService.getUserDetails(id);
