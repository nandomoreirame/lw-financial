import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/home.tsx'),
  route('login', 'routes/login.tsx'),
  route('signup', 'routes/signup.tsx'),
  route('onboarding', 'routes/onboarding.tsx'),
  route('conta/:accountCode', 'routes/conta.$accountCode.tsx'),
  route('*', 'routes/404.tsx'),
] satisfies RouteConfig;
