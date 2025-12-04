import { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/auth';

/**
 * Authentication error constants
 */
export const AUTH_REQUIRED = 'Authentication required';
export const INVALID_FORMAT = 'Invalid authorization format';
export const INVALID_TOKEN = 'Invalid or expired token';

/**
 * Authenticates a request by validating the JWT token from the Authorization header.
 *
 * This middleware validates:
 * - Presence of Authorization header
 * - Bearer token format
 * - JWT token structure, signature, and expiration
 *
 * If authentication succeeds, the decoded token payload is attached to request.user.
 * If authentication fails, throws an error with statusCode 401 and appropriate error message.
 * The error is handled by Fastify's error handler which sends the response.
 *
 * @param request - Fastify request object
 * @param _reply - Fastify reply object (unused, kept for Fastify preHandler compatibility)
 * @returns true if authentication succeeds
 * @throws Error with statusCode 401 if authentication fails
 *
 * @example
 * ```typescript
 *
 * fastify.get('/protected', {
 *   preHandler: authenticateRequest
 * }, async (request: AuthenticatedRequest, reply) => {
 *
 *   return { message: 'Protected resource', userId: request.user.userId };
 * });
 * ```
 */
export async function authenticateRequest(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<boolean> {
  const startTime =
    typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();

  try {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      const error = new Error(AUTH_REQUIRED);
      (error as { statusCode?: number }).statusCode = 401;
      throw error;
    }

    const authHeaderValue = Array.isArray(authHeader)
      ? authHeader[0]
      : authHeader;

    if (!authHeaderValue || authHeaderValue.trim().length === 0) {
      const error = new Error(AUTH_REQUIRED);
      (error as { statusCode?: number }).statusCode = 401;
      throw error;
    }

    const BEARER_PREFIX = 'Bearer ';
    if (!authHeaderValue.startsWith(BEARER_PREFIX)) {
      const error = new Error(INVALID_FORMAT);
      (error as { statusCode?: number }).statusCode = 401;
      throw error;
    }

    const token = authHeaderValue.substring(BEARER_PREFIX.length).trim();

    if (!token || token.length === 0) {
      const error = new Error(INVALID_FORMAT);
      (error as { statusCode?: number }).statusCode = 401;
      throw error;
    }

    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      const error = new Error(INVALID_TOKEN);
      (error as { statusCode?: number }).statusCode = 401;
      throw error;
    }

    const secret = process.env.BETTER_AUTH_SECRET;

    if (!secret) {
      request.log.error('BETTER_AUTH_SECRET is not configured');
      const error = new Error('Server configuration error');
      (error as { statusCode?: number }).statusCode = 500;
      throw error;
    }

    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256'],
      }) as jwt.JwtPayload;

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        userId: decoded.userId as string,
        username: decoded.username as string,
        email: decoded.email as string,
        iat: decoded.iat as number,
        exp: decoded.exp,
      };

      const endTime =
        typeof performance !== 'undefined' && performance.now
          ? performance.now()
          : Date.now();
      const duration = endTime - startTime;
      if (duration > 50) {
        request.log.warn(
          { duration: Math.round(duration) },
          'Authentication took longer than 50ms target'
        );
      }

      return true;
    } catch (error) {
      if (
        error instanceof jwt.JsonWebTokenError ||
        error instanceof jwt.TokenExpiredError
      ) {
        const authError = new Error(INVALID_TOKEN);
        (authError as { statusCode?: number }).statusCode = 401;
        throw authError;
      }

      request.log.error({ err: error }, 'Unexpected JWT validation error');
      const authError = new Error(INVALID_TOKEN);
      (authError as { statusCode?: number }).statusCode = 401;
      throw authError;
    }
  } catch (error) {
    if ((error as { statusCode?: number }).statusCode) {
      throw error;
    }
    request.log.error({ err: error }, 'Authentication error');
    const authError = new Error(AUTH_REQUIRED);
    (authError as { statusCode?: number }).statusCode = 401;
    throw authError;
  }
}
