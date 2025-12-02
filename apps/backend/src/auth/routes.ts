import bcrypt from 'bcrypt';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { validateLogin } from '../middleware/validation';
import { ErrorResponse, LoginRequest, LoginResponse } from '../types/auth';
import { auth } from './better-auth';

export async function loginRoutes(fastify: FastifyInstance) {
  // Tratamento de métodos HTTP não suportados para /login
  fastify.route({
    method: ['GET', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    url: '/login',
    schema: {
      description: 'Métodos HTTP não suportados para /login',
      tags: ['auth'],
      hide: true, // Ocultar da documentação Swagger
    },
    async handler(request: FastifyRequest, reply: FastifyReply) {
      reply.header('Allow', 'POST');
      return reply.status(405).send({
        error: 'Method not allowed. Use POST',
      } as ErrorResponse);
    },
  });

  // Rota de autenticação Better Auth (para futuras extensões)
  fastify.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    schema: {
      description:
        'Rota de autenticação Better Auth (proxy para futuras extensões)',
      tags: ['auth'],
      hide: true, // Ocultar da documentação Swagger por enquanto
    },
    async handler(request: FastifyRequest, reply: FastifyReply) {
      try {
        const url = new URL(request.url, `http://${request.headers.host}`);

        const headers = new Headers();
        Object.entries(request.headers).forEach(([key, value]) => {
          if (value) headers.append(key, value.toString());
        });

        const req = new Request(url.toString(), {
          method: request.method,
          headers,
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        const response = await auth.handler(req);

        reply.status(response.status);
        response.headers.forEach((value, key) => reply.header(key, value));
        reply.send(response.body ? await response.text() : null);
      } catch (error) {
        fastify.log.error({ err: error }, 'Authentication Error');
        reply.status(500).send({
          error: 'Internal authentication error',
          code: 'AUTH_FAILURE',
        } as ErrorResponse);
      }
    },
  });

  // Rota de login customizada
  fastify.post(
    '/login',
    {
      preHandler: validateLogin,
      schema: {
        description: 'Autenticação de usuário e obtenção de token JWT',
        tags: ['auth'],
        summary: 'Login de usuário',
        body: {
          type: 'object',
          required: ['username', 'pass'],
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 20,
              pattern: '^[a-zA-Z0-9]+$',
              description: 'Nome de usuário (3-20 caracteres alfanuméricos)',
            },
            pass: {
              type: 'string',
              minLength: 6,
              description: 'Senha do usuário (mínimo 6 caracteres)',
            },
          },
        },
        response: {
          200: {
            description: 'Login bem-sucedido',
            type: 'object',
            properties: {
              token: {
                type: 'string',
                description:
                  'Token JWT para autenticação em requisições subsequentes',
              },
            },
          },
          400: {
            description: 'Erro de validação de entrada',
            type: 'object',
            properties: {
              error: {
                type: 'string',
              },
            },
          },
          403: {
            description: 'Credenciais inválidas',
            type: 'object',
            properties: {
              error: {
                type: 'string',
              },
            },
          },
          405: {
            description: 'Método HTTP não permitido',
            type: 'object',
            properties: {
              error: {
                type: 'string',
              },
            },
          },
          500: {
            description: 'Erro interno do servidor',
            type: 'object',
            properties: {
              error: {
                type: 'string',
              },
              code: {
                type: 'string',
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { username, pass } = request.body as LoginRequest;

      try {
        // Buscar conta pelo accountId (username)
        const account = await prisma.account.findFirst({
          where: {
            accountId: username,
            providerId: 'credential',
          },
          include: {
            user: true,
          },
        });

        if (!account || !account.password) {
          fastify.log.warn({ username }, 'Account not found');
          return reply.status(403).send({
            error: 'Invalid credentials',
          } as ErrorResponse);
        }

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(pass, account.password);

        if (!isPasswordValid) {
          fastify.log.warn({ username }, 'Invalid password');
          return reply.status(403).send({
            error: 'Invalid credentials',
          } as ErrorResponse);
        }

        fastify.log.info(
          { username, userId: account.userId },
          'Successful login'
        );

        // Gerar token JWT
        const secret = process.env.BETTER_AUTH_SECRET!;

        // Gerar token JWT com payload básico
        const token = jwt.sign(
          {
            userId: account.userId,
            username: username,
            email: account.user.email,
            iat: Math.floor(Date.now() / 1000),
          },
          secret,
          {
            expiresIn: '1h', // Token expira em 1 hora (conforme recomendação para sistema bancário)
          }
        );

        reply.status(200).send({
          token,
        } as LoginResponse);
      } catch (error) {
        fastify.log.error({ err: error }, 'Authentication error');
        reply.status(500).send({
          error: 'Internal authentication error',
          code: 'AUTH_FAILURE',
        } as ErrorResponse);
      }
    }
  );
}
