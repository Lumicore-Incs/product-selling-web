import apiClient from '../axiosConfig';

export interface OrderExport {
  customerId: number;
  name: string;
  address: string;
  contact01: string;
  contact02: string;
  date: string;
  waybillId: string;
  price: number;
  status: string;
}

export type OrderExportDateFilter =
  | { date: string }
  | { startDate: string; endDate: string };

const orderExportService = {
  async exportOrders(dateFilter: OrderExportDateFilter): Promise<OrderExport[]> {
    const response = await apiClient.get<unknown>('/order/exportOrders', {
      params: dateFilter,
    });

    if (!Array.isArray(response.data)) {
      throw new Error('Unexpected response while loading exported orders.');
    }

    return response.data as OrderExport[];
  },
};

export default orderExportService;
