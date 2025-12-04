import bcrypt from 'bcrypt';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { validateLogin, validateSignup } from '../middleware/validation';
import {
  ErrorResponse,
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
} from '../types/auth';
import { auth } from './better-auth';

export async function loginRoutes(fastify: FastifyInstance) {
  fastify.route({
    method: ['GET', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    url: '/login',
    schema: {
      description: 'Métodos HTTP não suportados para /login',
      tags: ['auth'],
      hide: true,
    },
    async handler(request: FastifyRequest, reply: FastifyReply) {
      reply.header('Allow', 'POST');
      return reply.status(405).send({
        error: 'Method not allowed. Use POST',
      } as ErrorResponse);
    },
  });

  fastify.route({
    method: ['GET', 'POST'],
    url: '/auth/*',
    schema: {
      description:
        'Rota de autenticação Better Auth (proxy para futuras extensões)',
      tags: ['auth'],
      hide: true,
    },
    async handler(request: FastifyRequest, reply: FastifyReply) {
      try {
        const url = new URL(
          request.url,
          `http://${request.headers.host || 'localhost:3001'}`
        );

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

        const secret = process.env.BETTER_AUTH_SECRET!;

        const token = jwt.sign(
          {
            userId: account.userId,
            username: username,
            email: account.user.email,
            iat: Math.floor(Date.now() / 1000),
          },
          secret,
          {
            expiresIn: '1h',
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

  fastify.route({
    method: ['GET', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
    url: '/signup',
    schema: {
      description: 'Métodos HTTP não suportados para /signup',
      tags: ['auth'],
      hide: true,
    },
    async handler(request: FastifyRequest, reply: FastifyReply) {
      reply.header('Allow', 'POST');
      return reply.status(405).send({
        error: 'Method not allowed. Use POST',
      } as ErrorResponse);
    },
  });

  fastify.post(
    '/signup',
    {
      preHandler: validateSignup,
      schema: {
        description: 'Registro de novo usuário e criação de conta bancária',
        tags: ['auth'],
        summary: 'Registro de usuário',
        body: {
          type: 'object',
          required: ['username', 'email', 'name', 'pass'],
          properties: {
            username: {
              type: 'string',
              minLength: 3,
              maxLength: 20,
              pattern: '^[a-zA-Z0-9]+$',
              description: 'Nome de usuário (3-20 caracteres alfanuméricos)',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário',
            },
            name: {
              type: 'string',
              minLength: 1,
              description: 'Nome completo do usuário',
            },
            pass: {
              type: 'string',
              minLength: 6,
              description: 'Senha do usuário (mínimo 6 caracteres)',
            },
          },
        },
        response: {
          201: {
            description: 'Usuário criado com sucesso',
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
          409: {
            description: 'Usuário ou email já existe',
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
      const { username, email, name, pass } = request.body as SignupRequest;

      try {
        // Verificar se username já existe
        const existingAccount = await prisma.account.findFirst({
          where: {
            accountId: username,
            providerId: 'credential',
          },
        });

        if (existingAccount) {
          fastify.log.warn({ username }, 'Username already exists');
          return reply.status(409).send({
            error: 'Username already exists',
          } as ErrorResponse);
        }

        // Verificar se email já existe
        const existingUser = await prisma.user.findUnique({
          where: {
            email,
          },
        });

        if (existingUser) {
          fastify.log.warn({ email }, 'Email already exists');
          return reply.status(409).send({
            error: 'Email already exists',
          } as ErrorResponse);
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(pass, 10);

        // Criar usuário, conta e conta bancária em uma transação
        const result = await prisma.$transaction(async (tx) => {
          // Criar usuário
          const user = await tx.user.create({
            data: {
              email,
              name,
            },
          });

          // Criar conta de autenticação
          const account = await tx.account.create({
            data: {
              accountId: username,
              providerId: 'credential',
              userId: user.id,
              password: hashedPassword,
            },
          });

          // Criar conta bancária inicial com saldo zero
          await tx.bankAccount.create({
            data: {
              userId: user.id,
              balance: 0,
            },
          });

          return { user, account };
        });

        fastify.log.info(
          { username, userId: result.user.id, email },
          'User registered successfully'
        );

        const secret = process.env.BETTER_AUTH_SECRET!;

        const token = jwt.sign(
          {
            userId: result.user.id,
            username: username,
            email: result.user.email,
            iat: Math.floor(Date.now() / 1000),
          },
          secret,
          {
            expiresIn: '1h',
          }
        );

        reply.status(201).send({
          token,
        } as SignupResponse);
      } catch (error) {
        fastify.log.error({ err: error }, 'Signup error');
        reply.status(500).send({
          error: 'Internal server error',
          code: 'SIGNUP_FAILURE',
        } as ErrorResponse);
      }
    }
  );
}
