// DTO types returned by backend for users
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
