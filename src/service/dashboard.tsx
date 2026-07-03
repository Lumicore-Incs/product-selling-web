

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

export async function getDashboardStats(): Promise<DashboardStats> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        total_order: 0,
        today_order: 0,
        conform_order: 0,
        cancel_order: 0,
        totalOrdersTrend: '0%',
        todayOrdersTrend: '0%',
        confirmedOrdersTrend: '0%',
        cancelledOrdersTrend: '0%',
      });
    }, 500);
  });
}
