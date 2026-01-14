import axios from '../services/axiosConfig';

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
  productId?: number;
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

export async function updateUser(userId: string | number, payload: Partial<User> | Record<string, unknown>) {
  try {
    const response = await axios.put(`/user/update/${userId}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}
