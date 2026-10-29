import apiClient from '../axiosConfig';

export interface LeadRequestPayload {
  date: string;
  name: string;
  contact01: string;
  contact02: string;
  address: string;
  type: string;
  status: string;
  userId: number;
}

export interface LeadApiItem {
  id?: number | string;
  name?: string;
  fullName?: string;
  contact01?: string;
  contact02?: string;
  address?: string;
  type?: string;
  status?: string;
  userId?: number | string;
  date?: string;
  createdAt?: string;
}

export interface LeadQuantityItem {
  userId?: number | string;
  id?: number | string;
  qty?: number | string;
  quantity?: number | string;
  count?: number | string;
  name?: string;
  userName?: string;
}

const leadService = {
  async getLeadQty(): Promise<LeadQuantityItem[]> {
    const response = await apiClient.get<LeadQuantityItem[]>('/lead/getQty');
    return Array.isArray(response.data) ? response.data : [];
  },

  async getLeadsByUser(userId: string | number): Promise<LeadApiItem[]> {
    const response = await apiClient.get<LeadApiItem[]>(`/lead/user/${userId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  async saveLeads(payload: LeadRequestPayload[]): Promise<LeadApiItem[]> {
    const response = await apiClient.post<LeadApiItem[]>('/lead', payload);
    return Array.isArray(response.data) ? response.data : [];
  },

  async updateLeadStatus(leadId: string | number, status: string): Promise<LeadApiItem> {
    const response = await apiClient.put<LeadApiItem>(`/lead/${leadId}/status`, { status });
    return response.data;
  },
};

export default leadService;
