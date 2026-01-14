// src/services/axiosConfig.ts
import axios from 'axios';
import { getToken, removeToken } from './authUtils';

type ViteEnv = Partial<Record<string, string>> & {
  VITE_API_BASE_URL?: string;
  MODE?: string;
};

const viteEnv = (import.meta as unknown as { env?: ViteEnv }).env ?? ({} as ViteEnv);
const explicit = viteEnv.VITE_API_BASE_URL ?? '';

const mode = viteEnv.MODE ?? 'development';

const modeDefaults: Record<string, string> = {
  // production: 'https://api.weadits.com/demo-0.0.1-SNAPSHOT',
  development: 'http://localhost:8080',
  // development: 'https://api.weadits.com/demo-0.0.1-SNAPSHOT'
};

export const API_BASE_URL: string = (
  explicit ||
  modeDefaults[mode] ||
  modeDefaults.development
).toString();

const baseURL = API_BASE_URL.replace(/\/+$/g, '');

const http = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s default timeout
});

// Allow the app to provide a custom unauthorized handler (SPA-friendly)
let onUnauthorized: () => void = () => {
  window.location.href = '/auth';
};
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

// Attach token automatically from localStorage
http.interceptors.request.use(
  (config) => {
    const token = getToken() ?? undefined;

    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Centralized response handler for 401
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        removeToken();
      } catch (err) {
        console.warn('Failed to remove token during 401 handling', err);
      }
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default http;
