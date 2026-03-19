import http from '../axiosConfig';

export interface PaymentRequest {
  commission: number;
  basicSalary: number;
  userId: number;
}

export interface PaymentDetail {
  id: number;
  date: string | null;
  monthlyQty: number;
  totalCommission: number;
  totalAmount: number;
  status: string;
  paymentId: number;
}

export interface PaymentResponseData {
  id: number;
  commission: number;
  basicSalary: number;
  userId: number;
  paymentDetails: PaymentDetail[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaymentDetailRequest {
  date: string;
  monthlyQty: number;
  totalCommission: number;
  totalAmount: number;
  status: string;
  paymentId: number; 
}

export const paymentService = {
  addPayment: async (payment: PaymentRequest): Promise<ApiResponse<PaymentResponseData>> => {
    try {
      const response = await http.post<ApiResponse<PaymentResponseData>>('/payments', payment);
      return response.data;
    } catch (error) {
      console.error('Error adding payment:', error);
      throw error;
    }
  },

  getPaymentsByUserId: async (userId: string | number): Promise<ApiResponse<PaymentResponseData>> => {
    try {
      const response = await http.get<ApiResponse<PaymentResponseData>>(`/payments/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  },

  updatePayment: async (id: number, payment: PaymentRequest): Promise<ApiResponse<PaymentResponseData>> => {
    try {
      const response = await http.put<ApiResponse<PaymentResponseData>>(`/payments/${id}`, payment);
      return response.data;
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  },

  addPaymentDetails: async (details: PaymentDetailRequest): Promise<ApiResponse<PaymentDetail>> => {
    try {
      const response = await http.post<ApiResponse<PaymentDetail>>('/payments/details', details);
      return response.data;
    } catch (error) {
      console.error('Error adding payment details:', error);
      throw error;
    }
  },

  updatePaymentDetails: async (id: number, details: PaymentDetailRequest): Promise<ApiResponse<PaymentDetail>> => {
    try {
      const response = await http.put<ApiResponse<PaymentDetail>>(`/payments/Details/${id}`, details);
      return response.data;
    } catch (error) {
      console.error('Error updating payment details:', error);
      throw error;
    }
  },

  deletePaymentDetails: async (id: number): Promise<ApiResponse<any>> => {
    try {
      const response = await http.delete<ApiResponse<any>>(`/payments/details/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting payment details:', error);
      throw error;
    }
  }
};

