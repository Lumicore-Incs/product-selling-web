// src/services/authUtils.ts
export const TOKEN_KEY = 'authToken';

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.warn('Failed to persist auth token', err);
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to read auth token', err);
    return null;
  }
}

export function removeToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to remove auth token', err);
  }
}

export function isAuthenticated(): boolean {
  const t = getToken();
  return Boolean(t && t.length > 0);
}

export function getAuthHeader(): { Authorization?: string } {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export function logout(): void {
  try {
    removeToken();
  } catch (err) {
    console.warn('Failed to remove auth token during logout', err);
  }
  window.location.href = '/auth';
}

export default {
  TOKEN_KEY,
  setToken,
  getToken,
  removeToken,
  isAuthenticated,
  getAuthHeader,
  logout,
};
