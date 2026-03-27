import api, { AUTH_TOKEN_KEY, AUTH_USER_KEY, AUTH_ROLES_KEY } from './api';
import type { LoginRequest, LoginResponse, AuthState } from '@/types';

/**
 * Authentication Service
 * 
 * Handles login/logout operations with the Spring Boot backend.
 */

const AUTH_ENDPOINT = '/auth';
export const AUTH_FULLNAME_KEY = 'sinaps_auth_fullname';
export const AUTH_RANK_KEY = 'sinaps_auth_rank';

/**
 * Authenticate user with credentials
 * @param credentials - Username and password
 * @returns Login response with token and user info
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(`${AUTH_ENDPOINT}/login`, credentials);
  const { token, username, role } = response.data;

  // Store auth data in localStorage
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ username, role }));
  localStorage.setItem(AUTH_ROLES_KEY, JSON.stringify([role]));
  localStorage.removeItem(AUTH_FULLNAME_KEY);
  localStorage.removeItem(AUTH_RANK_KEY);

  return response.data;
}

/**
 * Log out the current user
 */
export function logout(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_ROLES_KEY);
  localStorage.removeItem(AUTH_FULLNAME_KEY);
  localStorage.removeItem(AUTH_RANK_KEY);

  // Dispatch logout event for UI to react
  window.dispatchEvent(new CustomEvent('auth:logout'));
}

/**
 * Get current authentication state
 */
export function getAuthState(): AuthState {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const rawUser = localStorage.getItem(AUTH_USER_KEY);
  let user: AuthState['user'] = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
    } catch {
      user = null;
    }
  }

  return {
    isAuthenticated: !!token,
    token,
    user
  };
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Get stored username
 */
export function getUsername(): string | null {
  try {
    const user = localStorage.getItem(AUTH_USER_KEY);
    if (!user) {
      return null;
    }
    return JSON.parse(user).username ?? null;
  } catch {
    return null;
  }
}

/**
 * Validate token with backend (if endpoint available)
 */
export async function validateToken(): Promise<boolean> {
  try {
    await api.get(`${AUTH_ENDPOINT}/validate`);
    return true;
  } catch {
    // Token invalid or endpoint not available
    return false;
  }
}

/**
 * Get user roles
 */
export function getRoles(): string[] {
  try {
    const rolesStr = localStorage.getItem(AUTH_ROLES_KEY);
    return rolesStr ? JSON.parse(rolesStr) : [];
  } catch {
    return [];
  }
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(): boolean {
  try {
    const user = localStorage.getItem(AUTH_USER_KEY);
    if (!user) {
      return false;
    }
    return JSON.parse(user).role === 'KARARGAH_ADMIN';
  } catch {
    return false;
  }
}

export default {
  login,
  logout,
  getAuthState,
  isAuthenticated,
  getUsername,
  validateToken,
  getRoles,
  isAdmin
};
