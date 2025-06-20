// src/services/authService.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8081';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    // Add other fields as per your backend response
}

export const authService = {
    // Login function - adjust endpoint as per your backend
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
            return response.data;
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    },

    // Logout function
    logout: () => {
        localStorage.removeItem('authToken');
    }
};
