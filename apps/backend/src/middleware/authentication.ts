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
 * T027: Standardize error message format to JSON { "error": "..." }
 * T030: Add Content-Type: application/json header to error responses
 * T028: Ensure error messages are generic (don't differentiate expired vs invalid)
 * T029: Verify error messages don't leak sensitive information
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
  // T058: Add performance logging (optional) to verify <50ms target
  const startTime = Date.now();

  try {
    // T008: Implement Authorization header presence check
    // T015: Handle case-insensitive Authorization header name
    // Fastify normalizes headers to lowercase, so we use request.headers.authorization
    const authHeader = request.headers.authorization;

    // T008: Check if Authorization header is present
    if (!authHeader) {
      // T012: Implement 401 Unauthorized response for missing header
      // T027, T030: Standardized error response format
      sendErrorResponse(reply, 401, AUTH_REQUIRED);
      return false;
    }

    // T014: Handle multiple Authorization headers (use first one)
    // Fastify already handles this by returning the first value, but we ensure it's a string
    const authHeaderValue = Array.isArray(authHeader)
      ? authHeader[0]
      : authHeader;

    // T009: Implement empty Authorization header validation
    if (!authHeaderValue || authHeaderValue.trim().length === 0) {
      // T012: Implement 401 Unauthorized response for missing header
      // T027, T030: Standardized error response format
      sendErrorResponse(reply, 401, AUTH_REQUIRED);
      return false;
    }

    // T010: Implement Bearer format validation (must start with "Bearer ")
    const BEARER_PREFIX = 'Bearer ';
    if (!authHeaderValue.startsWith(BEARER_PREFIX)) {
      // T013: Implement 401 Unauthorized response for invalid format
      // T027, T030: Standardized error response format
      sendErrorResponse(reply, 401, INVALID_FORMAT);
      return false;
    }

    // T011: Implement token value presence check (after "Bearer " prefix)
    // T016: Extract JWT token from Authorization header (remove "Bearer " prefix)
    // T056: Verify error handling for edge cases (whitespace after Bearer, case-insensitive headers)
    // Trim whitespace to handle edge cases like "Bearer   token" or "Bearer token   "
    const token = authHeaderValue.substring(BEARER_PREFIX.length).trim();

    if (!token || token.length === 0) {
      // T013: Implement 401 Unauthorized response for invalid format
      // T027, T030: Standardized error response format
      sendErrorResponse(reply, 401, INVALID_FORMAT);
      return false;
    }

    // T017: Implement JWT token structure validation (3 parts separated by '.')
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      // T021: Handle malformed JWT token errors (return 401)
      // T027, T028, T029, T030: Standardized generic error response
      sendErrorResponse(reply, 401, INVALID_TOKEN);
      return false;
    }

    // T018: Implement JWT signature verification using BETTER_AUTH_SECRET
    // T019: Implement JWT expiration validation (exp claim)
    // T020: Configure jwt.verify to use HS256 algorithm
    // T026: Ensure validation is stateless (no database queries)
    const secret = process.env.BETTER_AUTH_SECRET;

    if (!secret) {
      // T029: Don't leak sensitive information (log error but return generic message)
      request.log.error('BETTER_AUTH_SECRET is not configured');
      // T027, T030: Standardized error response format
      sendErrorResponse(reply, 500, 'Server configuration error');
      return false;
    }

    try {
      // jwt.verify automatically validates:
      // - Token structure (3 parts)
      // - Signature (using secret)
      // - Expiration (exp claim)
      // T020: Configure to use HS256 algorithm
      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256'],
      }) as jwt.JwtPayload;

      // T024: Attach decoded token payload to request.user
      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = {
        userId: decoded.userId as string,
        username: decoded.username as string,
        email: decoded.email as string,
        iat: decoded.iat as number,
        exp: decoded.exp,
        ...decoded,
      };

      // T058: Log performance if it exceeds target (optional logging)
      const duration = Date.now() - startTime;
      if (duration > 50) {
        request.log.warn(
          { duration },
          'Authentication took longer than 50ms target'
        );
      }

      // T025: Allow request to proceed when token is valid
      // T057: Verify stateless validation (no database queries)
      // This function is stateless - no database queries, only JWT verification
      return true;
    } catch (error) {
      // T021: Handle malformed JWT token errors (return 401)
      // T022: Handle expired token errors (return 401)
      // T023: Handle invalid signature errors (return 401)
      // T028: Ensure error messages are generic (don't differentiate expired vs invalid)
      // All JWT errors are treated generically for security
      if (
        error instanceof jwt.JsonWebTokenError ||
        error instanceof jwt.TokenExpiredError
      ) {
        // T027, T028, T029, T030: Standardized generic error response
        // T029: Don't leak error details (expired vs invalid vs malformed)
        sendErrorResponse(reply, 401, INVALID_TOKEN);
        return false;
      }

      // Unexpected error - log for debugging but return generic message
      // T029: Don't leak sensitive information in error response
      request.log.error({ err: error }, 'Unexpected JWT validation error');
      // T027, T028, T029, T030: Standardized generic error response
      sendErrorResponse(reply, 401, INVALID_TOKEN);
      return false;
    }
  } catch (error) {
    // T029: Don't leak sensitive information in error response
    request.log.error({ err: error }, 'Authentication error');
    // T027, T030: Standardized error response format
    sendErrorResponse(reply, 401, AUTH_REQUIRED);
    return false;
  }
}
