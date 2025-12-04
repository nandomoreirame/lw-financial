/**
 * Authentication utilities for JWT token management
 * Handles token storage, validation, and decoding
 *
 * ## Security Considerations: Token Storage Strategy
 *
 * **Current Implementation: sessionStorage**
 *
 * This implementation uses `sessionStorage` for client-side token storage, which is
 * a deliberate architectural decision with specific trade-offs:
 *
 * ### Advantages:
 * - Simple implementation without requiring cookie configuration
 * - Token automatically cleared when browser tab/window closes
 * - Works seamlessly with React Router 7 client-side navigation
 * - No CSRF token management required
 *
 * ### Security Trade-offs:
 * - **XSS Vulnerability**: Tokens in sessionStorage are accessible to JavaScript,
 *   making them vulnerable to Cross-Site Scripting (XSS) attacks. If malicious
 *   JavaScript executes in the application context, it can steal the token.
 *
 * ### Mitigation Strategies (Current & Recommended):
 * 1. **Input Sanitization**: All user inputs are validated and sanitized
 * 2. **Content Security Policy (CSP)**: Should be implemented at the application level
 *    to prevent XSS attacks
 * 3. **HTTPS Only**: All API communication must use HTTPS in production
 * 4. **Token Expiration**: Tokens expire after 1 hour, limiting exposure window
 * 5. **Server-Side Validation**: All API endpoints validate tokens server-side
 *
 * ### Alternative Approach (Future Consideration):
 * For enhanced security, consider migrating to httpOnly cookies:
 * - Tokens stored in httpOnly cookies are not accessible to JavaScript
 * - Provides better protection against XSS attacks
 * - Requires CSRF token implementation
 * - More complex setup with CORS and cookie configuration
 *
 * **Decision**: sessionStorage was chosen for MVP to balance security, complexity,
 * and development velocity. This decision should be revisited as the application
 * scales and security requirements evolve.
 */

const AUTH_TOKEN_KEY = 'auth_token';

export interface JWTPayload {
  userId?: string;
  username?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * Stores JWT token in sessionStorage (client-side)
 */
export function storeToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (!token || typeof token !== 'string') {
    throw new Error('Token inválido');
  }

  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Retrieves JWT token from sessionStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Removes JWT token from sessionStorage
 */
export function removeToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Decodes JWT token without verification (for client-side expiration check)
 * Note: This does not verify the signature, only decodes the payload
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error decoding token:', error);
    }
    return null;
  }
}

/**
 * Checks if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);

  if (!decoded || !decoded.exp) {
    return true;
  }

  return Date.now() >= decoded.exp * 1000;
}

/**
 * Validates JWT token format (basic validation)
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  return parts.length === 3;
}

/**
 * Gets account ID from token payload
 */
export function getAccountIdFromToken(token: string): string | null {
  const decoded = decodeToken(token);
  return decoded?.username || null;
}
