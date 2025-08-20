import axios from "axios";

const instance = axios.create({
  // baseURL: 'https://back.pearlyskyplc.com/api/',
  baseURL: 'http://168.231.102.248:8080/demo-0.0.1-SNAPSHOT',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // @ts-ignore
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default instance; 