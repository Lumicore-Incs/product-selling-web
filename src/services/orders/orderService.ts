import { Sale } from '../../models/sales';
import apiClient from '../axiosConfig';
import { mapOrderDtoToSale } from '../mappers/salesMapper';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface OrderFilterParams {
  search?: string;
  status?: string; // omit or pass empty string to mean "all"
  productId?: string; // omit or pass empty string to mean "all"
  date?: string; // YYYY-MM-DD format
}

function parsePaginatedResponse(raw: unknown, page: number, size: number): PaginatedResult<Sale> {
  if (!raw) return { data: [], total: 0, totalPages: 0, page, size };

  if (typeof raw === 'object' && raw !== null) {
    const r = raw as Record<string, unknown>;

    // Spring Boot Pageable: { content: [], totalElements: N, totalPages: N, number: N }
    if (Array.isArray(r['content'])) {
      const data = (r['content'] as unknown[]).map((o) => mapOrderDtoToSale(o));
      const total = Number(r['totalElements'] ?? data.length);
      const totalPages = Number(r['totalPages'] ?? Math.ceil(total / size));
      return { data, total, totalPages, page, size };
    }

    // Custom wrapper: { data: [], total: N, totalPages: N }
    if (Array.isArray(r['data'])) {
      const data = (r['data'] as unknown[]).map((o) => mapOrderDtoToSale(o));
      const total = Number(r['total'] ?? r['totalElements'] ?? data.length);
      const totalPages = Number(r['totalPages'] ?? r['pages'] ?? Math.ceil(total / size));
      return { data, total, totalPages, page, size };
    }
  }

  // Plain array fallback (backend not yet paginated)
  if (Array.isArray(raw)) {
    const data = (raw as unknown[]).map((o) => mapOrderDtoToSale(o));
    return { data, total: data.length, totalPages: 1, page, size };
  }

  return { data: [], total: 0, totalPages: 0, page, size };
}

/**
 * Builds the query-param object sent to the backend.
 * Backend is expected to support:
 *   GET /order?page=0&size=10&search=john&status=PENDING&productId=3
 * Omit a param to disable that filter.
 */
function buildFilterParams(
  page: number,
  size: number,
  { search, status, productId, date }: OrderFilterParams,
): Record<string, string | number> {
  const params: Record<string, string | number> = { page, size };
  if (search && search.trim()) params['search'] = search.trim();
  if (status && status !== 'all') params['status'] = status;
  if (productId && productId !== 'all') params['productId'] = productId;
  if (date) params['date'] = date;
  return params;
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

  async updateCustomerOrder(id: string, payload: Sale): Promise<unknown> {
    try {
      const requestDTO = {
        customerId: isNaN(Number(id)) ? null : Number(id),
        name: payload.name || payload.customerName,
        customerName: payload.customerName,
        serialNo: payload.serialNo,
        address: payload.address,
        contact01: payload.contact01,
        contact02: payload.contact02,
        date: payload.date,
        remark: payload.remark,
        status: payload.status,
        items: payload.items?.map(item => ({
          orderDetailsId: item.orderDetailsId ? Number(item.orderDetailsId) : null,
          orderId: item.orderId ? Number(item.orderId) : null,
          productId: Number(item.productId),
          qty: item.qty || item.quantity,
          total: item.total || (item.qty * item.price)
        })) || [],
        totalPrice: payload.totalPrice
      };

      const putResp = await apiClient.put(`/customer/${id}`, requestDTO);
      return putResp.data;
    } catch (err) {
      console.error('orderService.updateCustomerOrder failed:', err);
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

  async getOrdersPaginated(
    page = 0,
    size = 10,
    filters: OrderFilterParams = {},
  ): Promise<PaginatedResult<Sale>> {
    try {
      const params = buildFilterParams(page, size, filters);
      const resp = await apiClient.get('/order', { params });
      return parsePaginatedResponse(resp?.data, page, size);
    } catch (err) {
      console.error('orderService.getOrdersPaginated failed:', err);
      throw err;
    }
  }

  async getAllCustomerOrdersPaginated(
    page = 0,
    size = 10,
    filters: OrderFilterParams = {},
  ): Promise<PaginatedResult<Sale>> {
    try {
      const params = buildFilterParams(page, size, filters);
      const resp = await apiClient.get('/order/allCustomer', { params });
      return parsePaginatedResponse(resp?.data, page, size);
    } catch (err) {
      console.error('orderService.getAllCustomerOrdersPaginated failed:', err);
      throw err;
    }
  }


  async updateTrackingStatus(page = 0, size = 10): Promise<PaginatedResult<Sale>> {
    try {
      const params = { page, size };
      const resp = await apiClient.get('dashboard/updateTrackingStatus', { params });
      return parsePaginatedResponse(resp?.data, page, size);
    } catch (err) {
      console.error('orderService.updateTrackingStatus failed:', err);
      throw err;
    }
  }

  async getSummaryDetails(id: number | string, month: number): Promise<any> {
    try {
      const resp = await apiClient.get('/summary/getUserDetails', {
        params: { id, month },
      });
      return resp?.data || null;
    } catch (err) {
      console.error('orderService.getSummaryDetails failed:', err);
      throw err;
    }
  }

  async getUserAnalytics(id: number | string): Promise<ApiResponse<UserAnalytics>> {
    try {
      const resp = await apiClient.get<ApiResponse<UserAnalytics>>(`/payments/qty/${id}`);
      return resp?.data;
    } catch (err) {
      console.error('orderService.getUserAnalytics failed:', err);
      throw err;
    }
  }
}

export interface UserAnalytics {
  todayQty: number;
  monthQty: number;
  deliveredQty: number;
  returnQty: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
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
export const updateCustomerOrder = (id: string, payload: Sale) => orderService.updateCustomerOrder(id, payload);
export const getOrders = () => orderService.getOrders();
export const getOrdersPaginated = (page: number, size: number, filters?: OrderFilterParams) =>
  orderService.getOrdersPaginated(page, size, filters);
export const getAllCustomerOrdersPaginated = (
  page: number,
  size: number,
  filters?: OrderFilterParams,
) => orderService.getAllCustomerOrdersPaginated(page, size, filters);
export const updateTrackingStatus = (page?: number, size?: number) =>
  orderService.updateTrackingStatus(page, size);
export const uploadTracking = (trackingList: TrackingUploadDto[]) =>
  uploadTrackingData(trackingList);
export const getSummaryDetails = (id: string | number, month: number) =>
  orderService.getSummaryDetails(id, month);
export const getUserAnalytics = (id: string | number) => orderService.getUserAnalytics(id);
