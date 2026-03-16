export interface UserSummaryItem {
  date: string;
  qty: number;
  commission: number;
  total: number;
  serialNo?: string;
  status?: string;
}

export interface UserSummaryResponse {
  totalOrders: number;
  totalItem: number;
  deleverd: number;
  total: number;
  summery: UserSummaryItem[];
}
