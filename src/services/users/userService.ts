import type { UserApiDto } from '../../models/userApiDto';
import apiClient from '../axiosConfig';

export type User = {
  id: string;
  name: string;
  email: string;
  contact: string;
  role: string;
  type: string;
  registration_date: string;
  status: 'active' | 'inactive' | 'pending';
  password: string; // frontend stores password when creating a user
  productId: number; // required per request
};

class UserService {
  async getAllUsers(): Promise<User[]> {
    try {
      const resp = await apiClient.get<UserApiDto[]>('/user/get_all_user');
      const data = resp?.data || [];
      return data.map((u) => ({
        id: u.id.toString(),
        name: u.name,
        email: u.email,
        contact: u.telephone,
        role: u.role,
        type: u.type ?? '',
        registration_date: u.registration_date,
        status: (u.status?.toLowerCase() as 'active' | 'inactive' | 'pending') || 'pending',
        password: '',
        productId: 0,
      }));
    } catch (err) {
      console.error('userService.getAllUsers failed:', err);
      throw err;
    }
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put(`/user/update/${id}`, {
        name: userData.name,
        email: userData.email,
        telephone: userData.contact,
        role: userData.role,
        type: 'USER',
      });
      const updatedUser = response.data as UserApiDto;
      return {
        id: updatedUser.id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        contact: updatedUser.telephone,
        role: updatedUser.role,
        type: updatedUser.type ?? '',
        registration_date: updatedUser.registration_date,
        status:
          (updatedUser.status?.toLowerCase() as 'active' | 'inactive' | 'pending') || 'pending',
        password: '',
        productId: 0,
      };
    } catch (err) {
      console.error('userService.updateUser failed:', err);
      throw err;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const resp = await apiClient.delete(`/user/${id}`);
      return resp.status === 200;
    } catch (err) {
      console.error('userService.deleteUser failed:', err);
      throw err;
    }
  }

  async createUser(userData: User): Promise<User> {
    try {
      const payload = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        password: userData.password,
        telephone: userData.contact,
        registration_date: userData.registration_date,
        role: userData.role,
        status: userData.status,
        type: userData.role.toUpperCase(),
        productId: userData.productId,
      };

      const resp = await apiClient.post<UserApiDto>('/user/create', payload);
      const created = resp.data;
      return {
        id: created.id.toString(),
        name: created.name,
        email: created.email,
        contact: created.telephone,
        role: created.role,
        type: created.type ?? '',
        registration_date: created.registration_date,
        status: (created.status?.toLowerCase() as 'active' | 'inactive' | 'pending') || 'pending',
        password: '',
        productId: userData.productId,
      };
    } catch (err) {
      console.error('userService.createUser failed:', err);
      throw err;
    }
  }
}

export const userService = new UserService();
export const getAllUsers = () => userService.getAllUsers();
