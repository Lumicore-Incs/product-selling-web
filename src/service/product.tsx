import http from '../services/axiosConfig';

export const getAllProducts = async () => {
  try {
    const response = await http.get('/products');
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};
