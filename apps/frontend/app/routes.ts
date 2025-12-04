import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('login', 'routes/login.tsx'),
  // Catch-all route for unknown paths (e.g., Chrome DevTools requests)
  route('*', 'routes/404.tsx'),
] satisfies RouteConfig;
