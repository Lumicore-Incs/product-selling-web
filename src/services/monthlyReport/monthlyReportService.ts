import apiClient from '../axiosConfig';

interface MonthlyOrderData {
  date: string;
  totalOrders: number;
  totalItems: number;
}

const monthlyReportService = {
  // Get monthly order count for a specific user
  async getMonthlyOrderCount(
    userId: string,
    year: number,
    month: number
  ): Promise<MonthlyOrderData[]> {
    try {
      // Format month as YYYY-MM
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;

      const response = await apiClient.get<MonthlyOrderData[]>(
        '/order/getAllCustomerByUser',
        {
          params: {
            id: userId,
            month: monthStr,
          },
        }
      );

      const data = response.data || [];
      console.log('Monthly order data for user', userId, ':', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch monthly order count:', error);
      // Return empty array instead of throwing to allow UI to handle gracefully
      return [];
    }
  },

  // Get daily order count for a specific user and date
  async getDailyOrderCount(
    userId: string,
    date: string
  ): Promise<MonthlyOrderData[]> {
    try {
      const response = await apiClient.get<MonthlyOrderData[]>(
        '/order/getAllCustomerByUser',
        {
          params: {
            id: userId,
            date: date,
          },
        }
      );

      const data = response.data || [];
      console.log('Daily order data for user', userId, 'on', date, ':', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch daily order count:', error);
      return [];
    }
  },

  // Get monthly summary stats
  async getMonthlySummary(userId: string, year: number, month: number): Promise<any> {
    try {
      const data = await this.getMonthlyOrderCount(userId, year, month);

      const totalOrders = data.reduce((sum, d) => sum + d.totalOrders, 0);
      const totalItems = data.reduce((sum, d) => sum + d.totalItems, 0);
      const avgOrdersPerDay = data.length > 0 ? totalOrders / data.length : 0;

      return {
        totalOrders,
        totalItems,
        avgOrdersPerDay,
        daysWithOrders: data.length,
      };
    } catch (error) {
      console.error('Failed to fetch monthly summary:', error);
      return {
        totalOrders: 0,
        totalItems: 0,
        avgOrdersPerDay: 0,
        daysWithOrders: 0,
      };
    }
  },
};

export default monthlyReportService;
