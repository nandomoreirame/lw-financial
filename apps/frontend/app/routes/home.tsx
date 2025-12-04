/**
 * Home route - Redirects to first account
 * This route redirects authenticated users to their first account page
 */

import * as React from 'react';
import { redirect, useNavigate } from 'react-router';
import { getFirstAccount, useAccounts } from '../hooks/use-accounts';
import {
  checkAuthentication,
  requireAuth,
} from '../middleware/protected-route';
import type { Route } from './+types/home';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'LW Financial' },
    { name: 'description', content: 'Sistema bancário' },
  ];
}

/**
 * Loader for home route
 * Validates authentication and allows client-side redirect
 */
export async function loader({ request }: Route.LoaderArgs) {
  const isServerSide = typeof window === 'undefined';
  const authCheck = checkAuthentication(request);

  if (isServerSide && !authCheck.isAuthenticated) {
    return {
      needsClientAuth: true,
    };
  }

  if (!authCheck.isAuthenticated) {
    return redirect('/login');
  }

  requireAuth(request);

  return {
    needsClientAuth: false,
  };
}

/**
 * Home page component
 * Redirects to first account on client-side
 */
export default function Home({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const { accounts, isLoading: isLoadingAccounts } = useAccounts();

  React.useEffect(() => {
    if (loaderData?.needsClientAuth) {
      const mockRequest = new Request(window.location.href);
      const authCheck = checkAuthentication(mockRequest);

      if (!authCheck.isAuthenticated) {
        navigate('/login', { replace: true });
        return;
      }
    }

    if (!isLoadingAccounts && accounts.length > 0) {
      const firstAccount = getFirstAccount(accounts);
      if (firstAccount?.code) {
        navigate(`/conta/${firstAccount.code}`, { replace: true });
        return;
      }
    }

    if (!isLoadingAccounts && accounts.length === 0) {
      navigate('/login', { replace: true });
    }
  }, [accounts, isLoadingAccounts, navigate, loaderData?.needsClientAuth]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center">Redirecionando...</div>
      </div>
    </div>
  );
}
