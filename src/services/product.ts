import { api } from "./api";

export interface ProductDto {
  productId?: number;
  name: string;
  price: number;
  status?: "active" | "inactive" | "remove";
}

export const productApi = {
  getAllProducts: async (): Promise<ProductDto[]> => {
    const response = await api.get<ProductDto[]>("/products");
    return response.data;
  },

  getProductById: async (id: number): Promise<ProductDto> => {
    const response = await api.get<ProductDto>(`/products/${id}`);
    return response.data;
  },

  createProduct: async (product: Omit<ProductDto, "productId">): Promise<ProductDto> => {
    const response = await api.post<ProductDto>("/products", product);
    return response.data;
  },

  updateProduct: async (
    id: number,
    product: Omit<ProductDto, "productId">
  ): Promise<ProductDto> => {
    const response = await api.put<ProductDto>(`/products/${id}`, product);
    return response.data;
  },

  deleteProduct: async (id: number): Promise<boolean> => {
    const response = await api.delete(`/products/${id}`);
    return response.status === 200;
  },
};

// Export individual functions for direct import compatibility
export const getAllProducts = productApi.getAllProducts;
