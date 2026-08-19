

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
    const response = await dashboardApi.getChartData();
    return response.data || response;
  } catch (error) {
    console.error('Failed to fetch chart data:', error);
    return null;
  }
}
