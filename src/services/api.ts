// src/services/api.ts
import axios from 'axios';

// Updated API base URL to match your existing system
const API_BASE_URL = 'http://localhost:8081';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to include JWT token
api.interceptors.request.use(
    (config) => {
        // Use 'token' key to match your existing auth system
        const token = localStorage.getItem('token');
        if (token) {
            config.headers ??= {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/auth'; 
        }
        return Promise.reject(error);
    }
);

// Product type definition to match backend DTO
export interface ProductDto {
    productId?: number;
    name: string;
    price: number;
    status?: 'active' | 'inactive';
}

export interface OrderItem {
    productId: number;
    productName: string;
    qty: number;
    price: number;
    total: number;
}

export interface CustomerRequestDTO {
    name: string;
    address: string;
    contact01: string;
    contact02?: string;
    qty: string;
    remark: string;
    totalPrice: number;
    items: OrderItem[];
}

export interface CustomerDtoGet {
    customerId: number;
    name: string;
    address: string;
    contact01: string;
    contact02?: string;
    qty: string;
    userId: number;
    createdDate: string;
    status: string;
}

export interface OrderDtoGet {
    orderId: number;
    customerId: number;
    name: string;
    address: string;
    contact01: string;
    contact02?: string;
    qty: string;
    remark: string;
    items: OrderItem[];
    totalPrice: number;
    orderDate: string;
    status: string;
    userId: number;
}

export interface OrderDetailsDto {
    orderDetailsId?: number;
    qty: number;
    total: number;
    productId: number;
    orderId?: number;
}

// User type for API response
export interface UserApiDto {
    id: number;
    name: string;
    email: string;
    telephone: string;
    role: string;
    registration_date: string;
    status: string;
    type?: string | null;
}

// API service functions
export const productApi = {
    // Get all products
    getAllProducts: async (): Promise<ProductDto[]> => {
        try {
            const response = await api.get<ProductDto[]>('/products');
            return response.data;
        } catch (error) {
            console.error('Error fetching products:', error);
            throw error;
        }
    },

    // Get product by ID
    getProductById: async (id: number): Promise<ProductDto> => {
        try {
            const response = await api.get(`/products/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching product:', error);
            throw error;
        }
    },

    // Create new product
    createProduct: async (product: Omit<ProductDto, 'productId'>): Promise<ProductDto> => {
        try {
            const response = await api.post('/products', product);
            return response.data;
        } catch (error) {
            console.error('Error creating product:', error);
            throw error;
        }
    },

    // Update product
    updateProduct: async (id: number, product: Omit<ProductDto, 'productId'>): Promise<ProductDto> => {
        try {
            const response = await api.put(`/products/${id}`, product);
            return response.data;
        } catch (error) {
            console.error('Error updating product:', error);
            throw error;
        }
    },

    // Delete product
    deleteProduct: async (id: number): Promise<boolean> => {
        try {
            const response = await api.delete(`/products/${id}`);
            return response.status === 200;
        } catch (error) {
            console.error('Error deleting product:', error);
            throw error;
        }
    },

    // Search products
    searchProducts: async (name?: string, minPrice?: number, maxPrice?: number): Promise<ProductDto[]> => {
        try {
            const params = new URLSearchParams();
            if (name) params.append('name', name);
            if (minPrice !== undefined) params.append('minPrice', minPrice.toString());
            if (maxPrice !== undefined) params.append('maxPrice', maxPrice.toString());

            const response = await api.get(`/products/search?${params.toString()}`);
            return response.data;
        } catch (error) {
            console.error('Error searching products:', error);
            throw error;
        }
    }
};

export const customerApi = {
    // Create new customer with order
    createCustomer: async (customerData: CustomerRequestDTO): Promise<CustomerDtoGet> => {
        try {
            const response = await api.post<CustomerDtoGet>('/customer', customerData);
            return response.data;
        } catch (error) {
            console.error('Error creating customer:', error);
            throw error;
        }
    },

    // Get all customers
    getAllCustomers: async (): Promise<CustomerDtoGet[]> => {
        try {
            const response = await api.get<CustomerDtoGet[]>('/customer');
            return response.data;
        } catch (error) {
            console.error('Error fetching customers:', error);
            throw error;
        }
    }
};

// Updated orderApi section for api.ts
export const orderApi = {
    // Get today's orders
    getTodaysOrders: async (): Promise<OrderDtoGet[]> => {
        try {
            console.log('Fetching today\'s orders from:', `${API_BASE_URL}/order`);
            const response = await api.get<OrderDtoGet[]>('/order');
            console.log('Today\'s orders response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching today\'s orders:', error);
            console.error('Request URL:', error.config?.url);
            console.error('Response status:', error.response?.status);
            console.error('Response data:', error.response?.data);
            throw error;
        }
    },

    // Get all orders
    getAllOrders: async (): Promise<OrderDtoGet[]> => {
        try {
            console.log('Fetching all orders from:', `${API_BASE_URL}/order/allCustomer`);
            const response = await api.get<OrderDtoGet[]>('/order/allCustomer');
            console.log('All orders response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching all orders:', error);
            console.error('Request URL:', error.config?.url);
            console.error('Response status:', error.response?.status);
            console.error('Response data:', error.response?.data);

            // If 404, try alternative endpoint
            if (error.response?.status === 404) {
                console.log('Trying alternative endpoint: /order');
                try {
                    const fallbackResponse = await api.get<OrderDtoGet[]>('/order');
                    console.log('Fallback response successful:', fallbackResponse.data);
                    return fallbackResponse.data;
                } catch (fallbackError) {
                    console.error('Fallback also failed:', fallbackError);
                    throw error; // Throw original error
                }
            }

            throw error;
        }
    },

    // Test endpoint connectivity
    testConnection: async (): Promise<boolean> => {
        try {
            // Try a simple GET request to see if server is responding
            const response = await api.get('/order');
            return response.status === 200;
        } catch (error: any) {
            console.error('Connection test failed:', error);
            return false;
        }
    }
};


export const authUtils = {
    setToken: (token: string) => {
        localStorage.setItem('token', token);
    },

    getToken: () => {
        return localStorage.getItem('token');
    },

    removeToken: () => {
        localStorage.removeItem('token');
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },

    logout: () => {
        localStorage.removeItem('token');
        window.location.href = '/auth';
    }
};

// User type for frontend mapped from UserApiDto
export interface User {
    id: string;
    name: string;
    email: string;
    contact: string;
    role: string;
    registration_date: string;
    status: 'active' | 'inactive' | 'pending';
}

export const userApi = {
    getAllUsers: async (): Promise<User[]> => {
        try {
            const response = await api.get<UserApiDto[]>('/user/get_all_user');
            // Map API fields to frontend User type
            return response.data.map((user) => ({
                id: user.id.toString(),
                name: user.name,
                email: user.email,
                contact: user.telephone,
                role: user.role,
                registration_date: user.registration_date,
                status: (user.status?.toLowerCase() as 'active' | 'inactive' | 'pending') || 'pending',
            }));
        } catch (error) {
            console.error('Error fetching users:', error);
            throw error;
        }
    },
};