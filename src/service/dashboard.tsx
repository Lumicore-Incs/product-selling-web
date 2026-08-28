

import { dashboardApi } from '../services/api';

interface DashboardStats {
  total_order: number;
  today_order: number;
  conform_order: number;
  cancel_order: number;
  processing_order?: number;
  totalOrdersTrend: string;
  todayOrdersTrend: string;
  confirmedOrdersTrend: string;
  cancelledOrdersTrend: string;
}

const DEFAULT_STATS: DashboardStats = {
  total_order: 0,
  today_order: 0,
  conform_order: 0,
  cancel_order: 0,
  processing_order: 0,
  totalOrdersTrend: '0%',
  todayOrdersTrend: '0%',
  confirmedOrdersTrend: '0%',
  cancelledOrdersTrend: '0%',
};

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const data = await dashboardApi.getStats();

    return {
      total_order: Number(data.total_order ?? data.totalOrder ?? 0),
      today_order: Number(data.today_order ?? data.todayOrder ?? 0),
      conform_order: Number(data.conform_order ?? data.confirmed_order ?? 0),
      cancel_order: Number(data.cancel_order ?? data.cancelled_order ?? 0),
      processing_order: Number(data.processing_order ?? data.processing_orders ?? data.processingOrder ?? 0),
      totalOrdersTrend: '0%',
      todayOrdersTrend: '0%',
      confirmedOrdersTrend: '0%',
      cancelledOrdersTrend: '0%',
    };
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return DEFAULT_STATS;
  }
}

export async function getChartData() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [weeklyResponse, dailyResponse] = await Promise.all([
      dashboardApi.getChartData().catch(() => null),
      dashboardApi.getDailyOrdersChartData(today).catch(() => null)
    ]);
    const rawData = weeklyResponse?.data || weeklyResponse || [];
    const rawDaily = dailyResponse?.data || dailyResponse;

    // The backend returns a List<WeeklyUserOrderDto> which is a JSON Array.
    if (Array.isArray(rawData)) {
      
      // If backend has data, map it to the frontend format
      const userTotals: Record<string, number> = {};
      
      const parsedData = rawData.map((item: any) => {
        let dayStr = '';
        let ordersMap: any = {};
        
        // Dynamically find properties since we don't know exact DTO field names
        for (const key of Object.keys(item)) {
          if (typeof item[key] === 'string') dayStr = item[key];
          else if (typeof item[key] === 'object' && item[key] !== null) ordersMap = item[key];
        }
        
        const mappedItem: any = { name: dayStr.substring(0, 3).toUpperCase() || 'DAY' };
        for (const [user, qty] of Object.entries(ordersMap)) {
          userTotals[user] = (userTotals[user] || 0) + Number(qty);
          mappedItem[user] = Number(qty);
        }
        return mappedItem;
      });

      // Get top 3 customers
      const topCustomers = Object.entries(userTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(entry => entry[0]);
        
      // Format selling data with A, B, C keys for the chart
      const sellingData = parsedData.map((item: any) => {
        const newItem: any = { name: item.name };
        if (topCustomers[0]) newItem['A'] = item[topCustomers[0]] || 0;
        if (topCustomers[1]) newItem['B'] = item[topCustomers[1]] || 0;
        if (topCustomers[2]) newItem['C'] = item[topCustomers[2]] || 0;
        return newItem;
      });

      // Map daily revenue based on dailyResponse
      let revenueData: any[] = [];
      if (rawDaily) {
        if (Array.isArray(rawDaily)) {
           revenueData = rawDaily.map((item: any) => {
             let name = 'Unknown';
             let value = 0;
             for (const key of Object.keys(item)) {
               if (typeof item[key] === 'string') name = item[key];
               else if (typeof item[key] === 'number') value = item[key];
             }
             return { name, value };
           });
        } else if (typeof rawDaily === 'object') {
           revenueData = Object.entries(rawDaily).map(([k, v]) => ({ name: k, value: Number(v) || 0 }));
        }
      }

      if (revenueData.length === 0 && topCustomers.length > 0) {
        // Fallback to dummy data
        revenueData = topCustomers.map(user => ({
          name: user,
          value: userTotals[user] * 1500 // Assuming avg price 1500
        }));
      }

      return {
        sellingData,
        topCustomers,
        revenueData: revenueData.length > 0 ? revenueData : [{ name: 'No Data', value: 0 }]
      };
    }

    return rawData;
  } catch (error) {
    console.error('Failed to fetch chart data:', error);
    return null;
  }
}
