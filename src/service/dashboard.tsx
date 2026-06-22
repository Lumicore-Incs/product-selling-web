

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
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        total_order: 1250,
        today_order: 45,
        conform_order: 1180,
        cancel_order: 25,
        totalOrdersTrend: '+5%',
        todayOrdersTrend: '+12%',
        confirmedOrdersTrend: '+8%',
        cancelledOrdersTrend: '-2%',
      });
    }, 500);
  });
}
