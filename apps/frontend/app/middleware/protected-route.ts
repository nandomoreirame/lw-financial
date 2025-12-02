/**
 * Protected route middleware for React Router 7
 * Validates JWT token and handles authentication checks
 */

import { redirect } from 'react-router';
import { decodeToken, isTokenExpired, isValidTokenFormat } from '../lib/auth';

/**
 * Parses cookie header string into a key-value object
 * Handles edge cases like cookies with '=' in their values
 *
 * @param cookieHeader - Cookie header string from request
 * @returns Object with cookie key-value pairs
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(';').reduce(
    (acc, cookie) => {
      const eqIndex = cookie.indexOf('=');
      if (eqIndex === -1) return acc;
      const key = cookie.substring(0, eqIndex).trim();
      const value = cookie.substring(eqIndex + 1).trim();
      // Handle URL-encoded values and values containing '='
      try {
        acc[key] = decodeURIComponent(value);
      } catch {
        // If decodeURIComponent fails, use raw value
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>
  );
}

export interface AuthCheckResult {
  isAuthenticated: boolean;
  accountId: string | null;
  error?: string;
}

/**
 * Checks if user is authenticated by validating JWT token
 * Can be used in route loaders to protect routes
 */
export function checkAuthentication(request: Request): AuthCheckResult {
  // Try to get token from sessionStorage (client-side)
  // In server-side, token should come from httpOnly cookie
  const isServerSide = typeof window === 'undefined';

  let token: string | null = null;

  if (isServerSide) {
    // Server-side: get token from cookie
    const cookieHeader = request.headers.get('Cookie');
    if (cookieHeader) {
      const cookies = parseCookies(cookieHeader);
      token = cookies['auth_token'] || null;
    }
  } else {
    // Client-side: get token from sessionStorage
    token = sessionStorage.getItem('auth_token');
  }

  if (!token || !isValidTokenFormat(token)) {
    return {
      isAuthenticated: false,
      accountId: null,
      error: 'Token inválido',
    };
  }

  if (isTokenExpired(token)) {
    return {
      isAuthenticated: false,
      accountId: null,
      error: 'Sua sessão expirou. Por favor, faça login novamente',
    };
  }

  const decoded = decodeToken(token);
  const accountId = decoded?.username || null;

  return {
    isAuthenticated: true,
    accountId,
  };
}

/**
 * Redirects to login if user is not authenticated
 * Use this in route loaders for protected routes
 */
export function requireAuth(request: Request): void {
  const authCheck = checkAuthentication(request);

  if (!authCheck.isAuthenticated) {
    const loginUrl = new URL('/login', request.url);

    // Add error message as query parameter if available
    if (authCheck.error) {
      loginUrl.searchParams.set('error', encodeURIComponent(authCheck.error));
    }

    throw redirect(loginUrl.toString());
  }
}
