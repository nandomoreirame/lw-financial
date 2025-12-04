/**
 * Signup route - Public route for user registration
 */

import { redirect } from 'react-router';
import { SignupForm } from '../components/signup/signup-form';
import { checkAuthentication } from '../middleware/protected-route';
import type { Route } from './+types/signup';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Registro - LW Financial' },
    { name: 'description', content: 'Crie sua conta no sistema bancário' },
  ];
}

/**
 * Loader for signup route
 * Redirects to dashboard if user is already authenticated
 */
export async function loader({ request }: Route.LoaderArgs) {
  const authCheck = checkAuthentication(request);

  if (authCheck.isAuthenticated) {
    throw redirect('/');
  }

  const url = new URL(request.url);
  const error = url.searchParams.get('error');

  return {
    error: error || null,
  };
}

/**
 * Signup page component
 * Based on shadcn/ui login-01 block
 */
export default function Signup(_props: Route.ComponentProps) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <SignupForm />
    </div>
  );
}
