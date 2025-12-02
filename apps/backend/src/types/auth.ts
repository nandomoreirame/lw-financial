import { FastifyRequest } from 'fastify';

export interface LoginRequest {
  username: string;
  pass: string;
}

export interface LoginResponse {
  token: string;
}

export interface ErrorResponse {
  error: string;
}

/**
 * Interface for authenticated requests.
 * Extends FastifyRequest with user information from decoded JWT token.
 *
 * This interface is used to type requests that have passed authentication middleware.
 * The `user` property is populated by the `authenticateRequest` middleware after
 * successfully validating the JWT token.
 *
 * @example
 * ```typescript
 * fastify.get('/api/profile', async (request: AuthenticatedRequest, reply) => {
 *   // request.user is guaranteed to be available here
 *   return {
 *     userId: request.user.userId,
 *     username: request.user.username,
 *     email: request.user.email
 *   };
 * });
 * ```
 */
export interface AuthenticatedRequest extends FastifyRequest {
  /**
   * User information extracted from the decoded JWT token payload.
   * Available after successful authentication via `authenticateRequest` middleware.
   */
  user: {
    /** Unique user identifier */
    userId: string;
    /** User's username (accountId from authentication) */
    username: string;
    /** User's email address */
    email: string;
    /** Token issued at time (Unix timestamp) */
    iat: number;
    /** Token expiration time (Unix timestamp, optional) */
    exp?: number;
  };
}
