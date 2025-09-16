// src/services/authService.ts
import { removeToken, setToken } from './authUtils';
import http from './axiosConfig';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await http.post<LoginResponse>(`/auth/login`, credentials);
      const data = response.data;
      if (data?.token) {
        setToken(data.token);
      }
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  logout: () => {
    removeToken();
  },
};
