import axios from '../axiosConfig';
import { StockItem } from '../../components/stock/StockForm';

export const getAllStock = async (): Promise<StockItem[]> => {
  try {
    const response = await axios.get<StockItem[]>('/stockes');
    return response.data;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
};

export const addStock = async (stockItem: Omit<StockItem, 'stock_id'>): Promise<StockItem> => {
  try {
    // Ensure backend receives totalQuantity as well (use quantity when totalQuantity not provided)
    const payload = {
      ...stockItem,
      totalQuantity: stockItem.totalQuantity ?? stockItem.quantity,
    };
    const response = await axios.post<StockItem>('/stockes', payload);
    return response.data;
  } catch (error) {
    console.error('Error adding stock:', error);
    throw error;
  }
};

export const updateStock = async (stockId: number, stockItem: Partial<StockItem>): Promise<StockItem> => {
  try {
    // Always set totalQuantity equal to quantity when updating
    const payload: Partial<StockItem> = {
      ...stockItem,
      totalQuantity: stockItem.quantity, // Force totalQuantity to match quantity
    };
    // Use the /{id} endpoint for PUT requests
    const response = await axios.put<StockItem>(`/stockes/${stockId}`, payload);
    return response.data;
  } catch (error: any) {
    // Pass through the backend error message if available
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    console.error('Error updating stock:', error);
    throw error;
  }
};

export const deleteStock = async (stockId: number): Promise<any> => {
  try {
    const response = await axios.delete(`/stockes/${stockId}`);
    // Return backend response body so callers can show messages
    return response.data;
  } catch (error) {
    console.error('Error deleting stock:', error);
    throw error;
  }
};