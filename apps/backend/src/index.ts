import cors from '@fastify/cors';
import Fastify from 'fastify';
import { loginRoutes } from './auth/routes';

const fastify = Fastify({ logger: true });

// Configure CORS
fastify.register(cors, {
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
});

// Register auth routes
fastify.register(loginRoutes);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Legacy API endpoint (maintained for compatibility)
fastify.get('/api', async () => {
  return { message: 'Hello from backend API!' };
});

const PORT = process.env.PORT || 3001;

fastify.listen({ port: Number(PORT), host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`Backend server running on http://localhost:${PORT}`);
});
