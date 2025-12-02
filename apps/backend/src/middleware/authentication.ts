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
 * Helper function to send standardized error responses.
 *
 * Ensures all authentication errors follow a consistent format:
 * - JSON response with { "error": "..." } structure
 * - Content-Type: application/json header
 * - Generic error messages that don't leak sensitive information
 * - No differentiation between expired vs invalid tokens for security
 *
 * @param reply - Fastify reply object
 * @param statusCode - HTTP status code (typically 401)
 * @param errorMessage - Generic error message (from constants)
 */
function sendErrorResponse(
  reply: FastifyReply,
  statusCode: number,
  errorMessage: string
): void {
  reply.status(statusCode).header('Content-Type', 'application/json').send({
    error: errorMessage,
  });
}

/**
 * Authenticates a request by validating the JWT token from the Authorization header.
 *
 * This middleware validates:
 * - Presence of Authorization header
 * - Bearer token format
 * - JWT token structure, signature, and expiration
 *
 * If authentication succeeds, the decoded token payload is attached to request.user.
 * If authentication fails, returns 401 Unauthorized with appropriate error message.
 *
 * @param request - Fastify request object
 * @param reply - Fastify reply object
 * @returns true if authentication succeeds, false otherwise (and sends error response)
 *
 * @example
 * ```typescript
 * // Apply to a route
 * fastify.get('/protected', {
 *   preHandler: async (request, reply) => {
 *     await authenticateRequest(request, reply);
 *   }
 * }, async (request: AuthenticatedRequest, reply) => {
 *   // request.user is available here
 *   return { message: 'Protected resource', userId: request.user.userId };
 * });
 * ```
 */
export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<boolean> {
  // Performance logging to verify <50ms target
  // Use performance.now() for higher precision if available, fallback to Date.now()
  const startTime =
    typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();

  try {
    // Fastify normalizes headers to lowercase, so we use request.headers.authorization
    // HTTP specification allows case-insensitive header names, Fastify handles this automatically
    const authHeader = request.headers.authorization;

    // Check if Authorization header is present
    if (!authHeader) {
      sendErrorResponse(reply, 401, AUTH_REQUIRED);
      return false;
    }

    // Handle multiple Authorization headers: use first one
    // Fastify automatically returns the first value when multiple headers with the same name are present
    // We ensure it's a string (Fastify may return string or string[])
    const authHeaderValue = Array.isArray(authHeader)
      ? authHeader[0]
      : authHeader;

    // Validate empty Authorization header
    if (!authHeaderValue || authHeaderValue.trim().length === 0) {
      sendErrorResponse(reply, 401, AUTH_REQUIRED);
      return false;
    }

    // Validate Bearer format (must start with "Bearer ")
    const BEARER_PREFIX = 'Bearer ';
    if (!authHeaderValue.startsWith(BEARER_PREFIX)) {
      sendErrorResponse(reply, 401, INVALID_FORMAT);
      return false;
    }

    // Extract JWT token from Authorization header (remove "Bearer " prefix)
    // Trim whitespace to handle edge cases like "Bearer   token" or "Bearer token   "
    const token = authHeaderValue.substring(BEARER_PREFIX.length).trim();

    if (!token || token.length === 0) {
      sendErrorResponse(reply, 401, INVALID_FORMAT);
      return false;
    }

    // Validate JWT token structure (must have 3 parts separated by '.')
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      sendErrorResponse(reply, 401, INVALID_TOKEN);
      return false;
    }

    // Get secret from environment
    // Validation of secret length should be done at application startup, not per-request
    const secret = process.env.BETTER_AUTH_SECRET;

    if (!secret) {
      request.log.error('BETTER_AUTH_SECRET is not configured');
      sendErrorResponse(reply, 500, 'Server configuration error');
      return false;
    }

    try {
      // jwt.verify automatically validates:
      // - Token structure (3 parts)
      // - Signature (using secret)
      // - Expiration (exp claim)
      // Explicitly configure to use HS256 algorithm for security
      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256'],
      }) as jwt.JwtPayload;

      // Attach decoded token payload to request.user
      // Only include explicitly defined fields to prevent exposing unexpected token claims
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        userId: decoded.userId as string,
        username: decoded.username as string,
        email: decoded.email as string,
        iat: decoded.iat as number,
        exp: decoded.exp,
      };

      // Log performance if it exceeds target
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

      // Allow request to proceed when token is valid
      // This function is stateless - no database queries, only JWT verification
      return true;
    } catch (error) {
      // Handle all JWT validation errors generically for security
      // Don't differentiate between expired, invalid signature, or malformed tokens
      // This prevents information leakage that could aid attackers
      if (
        error instanceof jwt.JsonWebTokenError ||
        error instanceof jwt.TokenExpiredError
      ) {
        sendErrorResponse(reply, 401, INVALID_TOKEN);
        return false;
      }

      // Unexpected error - log for debugging but return generic message
      // Never leak sensitive information in error responses
      request.log.error({ err: error }, 'Unexpected JWT validation error');
      sendErrorResponse(reply, 401, INVALID_TOKEN);
      return false;
    }
  } catch (error) {
    // Don't leak sensitive information in error response
    request.log.error({ err: error }, 'Authentication error');
    sendErrorResponse(reply, 401, AUTH_REQUIRED);
    return false;
  }
}
