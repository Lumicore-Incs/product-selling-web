import axios from '../services/axiosConfig';

interface DashboardStats {
  total_order: number;
  today_order: number;
  conform_order: number;
  cancel_order: number;
  totalOrdersTrend: string;
  todayOrdersTrend: string;
  confirmedOrdersTrend: string;
  cancelledOrdersTrend: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await axios.get<DashboardStats>('/dashboard');
  return response.data;
}
