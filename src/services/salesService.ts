import api, { API_BASE_URL } from './axiosConfig';

export const salesService = {
  /**
   * Update an order on the backend. Tries common endpoints and falls back when 404.
   * Returns the updated order data from the server.
   */
  updateOrder: async (id: string, payload: unknown): Promise<unknown> => {
    try {
      const putResp = await api.put(`${API_BASE_URL}/order/${id}/resolve`, payload as object);
      return putResp.data;
    } catch (err) {
      console.error('Failed to update order:', err);
      throw err;
    }
  },
};

export default salesService;
