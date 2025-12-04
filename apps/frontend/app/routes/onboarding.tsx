/**
 * Onboarding route - Protected route for setting up initial bank account
 * Redirects to dashboard if user is not authenticated
 */

import * as React from 'react';
import { OnboardingForm } from '../components/onboarding/onboarding-form';
import {
  checkAuthentication,
  requireAuth,
} from '../middleware/protected-route';
import type { Route } from './+types/onboarding';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: 'Configuração Inicial - LW Financial' },
    {
      name: 'description',
      content: 'Configure sua conta bancária com saldo inicial',
    },
  ];
}

/**
 * Loader for onboarding route
 * Validates authentication and redirects if not authenticated
 */
export async function loader({ request }: Route.LoaderArgs) {
  const isServerSide = typeof window === 'undefined';
  const authCheck = checkAuthentication(request);

  if (isServerSide && !authCheck.isAuthenticated) {
    return {
      needsClientAuth: true,
    };
  }

  requireAuth(request);

  return {
    needsClientAuth: false,
  };
}

/**
 * Onboarding page component
 * Allows user to add initial balance to their bank account
 */
export default function Onboarding({ loaderData }: Route.ComponentProps) {
  const [clientAuthChecked, setClientAuthChecked] = React.useState(false);

  React.useEffect(() => {
    if (loaderData?.needsClientAuth) {
      const mockRequest = new Request(window.location.href);
      const authCheck = checkAuthentication(mockRequest);

      if (!authCheck.isAuthenticated) {
        const loginUrl = new URL('/login', window.location.origin);
        loginUrl.searchParams.set(
          'error',
          encodeURIComponent('Por favor, faça login para continuar')
        );
        window.location.href = loginUrl.toString();
        return;
      }

      setClientAuthChecked(true);
    } else {
      setClientAuthChecked(true);
    }
  }, [loaderData?.needsClientAuth]);

  if (loaderData?.needsClientAuth && !clientAuthChecked) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="text-center">Verificando autenticação...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <OnboardingForm />
    </div>
  );
}
