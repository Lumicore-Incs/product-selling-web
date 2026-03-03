import apiClient from '../axiosConfig';
import { DailyCountWithProduct, PaginationResponse, DailyCountWithDetails } from '../../models/dailyCount';

const API_BASE = '/report';

const dailyReportService = {
  // Get paginated list of all daily count records (individual products)
  // GET /report/daily-count/paginated?page=0&size=10
  async getDailyCountPaginated(
    page: number = 0,
    size: number = 10
  ): Promise<PaginationResponse<DailyCountWithProduct>> {
    try {
      // Response from backend has different field names
      interface BackendResponse {
        content: DailyCountWithDetails[];
        pageNumber: number;
        pageSize: number;
        totalElements: number;
        totalPages: number;
        lastPage: boolean;
      }

      const response = await apiClient.get<BackendResponse>(
        `${API_BASE}/daily-count/paginated`,
        {
          params: { page, size },
        }
      );

      const data = response.data;
      console.log('Paginated daily count records:', data);

      // Flatten the nested structure: convert DailyCountWithDetails into individual DailyCountWithProduct records
      const flattenedContent: DailyCountWithProduct[] = [];
      data.content.forEach((dailyCount) => {
        dailyCount.dailyCountDetailsDtoGet.forEach((detail) => {
          flattenedContent.push({
            id: detail.id,
            dailyCountId: dailyCount.id,
            date: dailyCount.date,
            totalQty: detail.qty,
            lastTime: dailyCount.lastTime,
            productId: detail.productId,
            productName: detail.productName,
            category: detail.category,
          });
        });
      });

      // Map backend response to frontend PaginationResponse format
      const mappedResponse: PaginationResponse<DailyCountWithProduct> = {
        content: flattenedContent,
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        currentPage: data.pageNumber,
        pageSize: data.pageSize,
        hasNext: !data.lastPage,
        hasPrevious: data.pageNumber > 0,
      };

      console.log('Mapped paginated response:', mappedResponse);
      return mappedResponse;
    } catch (error) {
      console.error('Failed to fetch paginated daily counts:', error);
      throw error;
    }
  },
};

export default dailyReportService;
