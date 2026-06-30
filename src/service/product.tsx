import http from '../services/axiosConfig';

export const getAllProducts = async () => {
  try {
    const response = await http.get('/products');
    const allProducts = response.data;
    if (Array.isArray(allProducts)) {
      return allProducts.filter((p: any) => p?.status?.toLowerCase() !== 'remove');
    }
    return allProducts;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};
