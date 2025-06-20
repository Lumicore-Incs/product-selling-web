import axios from './axiosConfig';

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  telephone: string;
  userName: string;
  role: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  telephone: string;
  userName: string;
}

export async function login(payload: LoginPayload) {
  const response = await axios.post('/user/login', payload);
  return response.data;
}

export async function register(payload: RegisterPayload) {
  const response = await axios.post('/user/register', payload);
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await axios.post<User>('/user/get_user_info_by_token');
  return response.data;
} 