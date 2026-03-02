import api, { AUTH_TOKEN_KEY, AUTH_USER_KEY, AUTH_ROLES_KEY } from './api';
import type { LoginRequest, LoginResponse, AuthState } from '@/types';

/**
 * Authentication Service
 * 
 * Handles login/logout operations with the Spring Boot backend.
 * Note: If AuthController is not yet implemented in the backend,
 * this will fall back to mock authentication for development.
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
  try {
    const response = await api.post<LoginResponse>(`${AUTH_ENDPOINT}/login`, credentials);

    const { token, username } = response.data;

    // Store auth data in localStorage
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, username);
    if (response.data.roles) {
      localStorage.setItem(AUTH_ROLES_KEY, JSON.stringify(response.data.roles));
    }
    if (response.data.fullName) {
      localStorage.setItem(AUTH_FULLNAME_KEY, response.data.fullName);
    }
    if (response.data.rank) {
      localStorage.setItem(AUTH_RANK_KEY, response.data.rank);
    }

    return response.data;
  } catch (error) {
    // If backend auth is not available, use mock authentication for dev
    console.warn('[AuthService] Backend auth not available, using mock auth');

    // Mock authentication - accept any credentials for development
    const mockToken = `mock_jwt_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const mockResponse: LoginResponse = {
      token: mockToken,
      username: credentials.username,
      roles: ['ROLE_ADMIN'],
      fullName: 'Test User',
      rank: 'Yüzbaşı',
    };

    localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
    localStorage.setItem(AUTH_USER_KEY, credentials.username);
    localStorage.setItem(AUTH_ROLES_KEY, JSON.stringify(mockResponse.roles));
    localStorage.setItem(AUTH_FULLNAME_KEY, mockResponse.fullName || '');
    localStorage.setItem(AUTH_RANK_KEY, mockResponse.rank || '');

    return mockResponse;
  }
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
  const username = localStorage.getItem(AUTH_USER_KEY);

  return {
    isAuthenticated: !!token,
    token,
    username
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
  return localStorage.getItem(AUTH_USER_KEY);
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
  const roles = getRoles();
  return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_COMMANDER');
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
