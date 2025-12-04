import '@lw-financial/ui/styles';

import { Toaster } from '@lw-financial/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import type { Route } from './+types/root';
import { queryClient } from './lib/query-client';

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [showDevtools, setShowDevtools] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      setShowDevtools(true);
    }
  }, []);

  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          <>
            {children}
            <footer className="container mx-auto max-w-4xl py-8 px-6 flex items-center justify-between gap-2 text-center mb-8">
              <p className="text-sm text-muted-foreground">
                © 2025 LW Financial. Todos os direitos reservados.
              </p>
              <p className="text-sm text-muted-foreground">
                Desenvolvido por{' '}
                <a
                  href="https://nandomoreira.dev/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 underline hover:no-underline"
                >
                  Fernando Moreira
                </a>
              </p>
            </footer>
          </>
          {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
        <Toaster />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
