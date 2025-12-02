/**
 * Login route - Public route for user authentication
 */

import type { Route } from './+types/login';
import { redirect } from 'react-router';
import { checkAuthentication } from '../middleware/protected-route';
import { LoginForm } from '../components/login/login-form';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Login - LW Financial' },
    { name: 'description', content: 'Faça login no sistema bancário' },
  ];
}

/**
 * Loader for login route
 * Redirects to dashboard if user is already authenticated
 */
export async function loader({ request }: Route.LoaderArgs) {
  // Check if user is already authenticated
  const authCheck = checkAuthentication(request);

  if (authCheck.isAuthenticated) {
    // User is already logged in, redirect to dashboard
    throw redirect('/dashboard');
  }

  // Check for error message in query params (from protected route redirect)
  const url = new URL(request.url);
  const error = url.searchParams.get('error');

  return {
    error: error || null,
  };
}

// Login is now handled client-side in LoginForm component
// This allows direct API calls without server-side fetch issues

/**
 * Login page component
 * Based on shadcn/ui login-01 block
 */
export default function Login(_props: Route.ComponentProps) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
