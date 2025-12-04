/**
 * Authentication redirect utilities
 * Handles redirecting to login page when authentication fails
 * Uses window.location for compatibility with hooks that can't use React Router hooks
 */

/**
 * Redirects user to login page with error message
 * Clears authentication token from sessionStorage
 *
 * @param errorMessage - Error message to display on login page
 */
export function redirectToLogin(errorMessage: string): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('auth_token');
  }

  const loginUrl = new URL('/login', window.location.origin);
  loginUrl.searchParams.set('error', encodeURIComponent(errorMessage));

  window.location.href = loginUrl.toString();
}

/**
 * Checks if an error is an authentication error
 *
 * @param error - Error object or error message
 * @returns true if error is related to authentication
 */
export function isAuthenticationError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message || '';

  return (
    errorMessage.includes('Não autenticado') ||
    errorMessage.includes('autenticação') ||
    errorMessage.includes('Token') ||
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('Forbidden')
  );
}
