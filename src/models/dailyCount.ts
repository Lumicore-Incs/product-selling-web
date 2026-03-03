// Daily count detail record
export interface DailyCountDetail {
  id: number;
  productId: number;
  productName: string;
  category: number;
  qty: number;
}

// Daily count with grouped product details
export interface DailyCountWithDetails {
  id: number;
  date: string; // ISO date format YYYY-MM-DD
  totalQty: number;
  lastTime: string; // ISO datetime format
  dailyCountDetailsDtoGet: DailyCountDetail[];
}

// Flattened daily count for UI (individual product record)
export interface DailyCount {
  id: number;
  dailyCountId: number;
  date: string; // ISO date format YYYY-MM-DD
  totalQty: number;
  lastTime: string; // ISO datetime format
  productId: number;
  productName: string;
  productShortName?: string;
  category?: number | string;
  price?: number;
}

export interface DailyCountRequest {
  date: string;
  totalQty: number;
  productId: number;
}

export interface DailyCountWithProduct extends DailyCount {}

// Date summary with total quantity
export interface DateSummary {
  date: string;
  totalQty: number;
  productCount: number;
  lastUpdated: string;
}

// Pagination response wrapper
export interface PaginationResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
