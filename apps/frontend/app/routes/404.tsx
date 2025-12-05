/**
 * 404 Not Found route
 * Handles unknown routes and prevents errors for browser extension requests
 */

import type { Route } from './+types/404';

export function meta(_args: Route.MetaArgs) {
  return [
    { title: '404 - Página não encontrada' },
    { name: 'description', content: 'Página não encontrada' },
  ];
}

/**
 * Loader for 404 route
 * Returns 404 status for actual page requests
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);

  if (
    url.pathname.startsWith('/.well-known/') ||
    url.pathname.startsWith('/favicon.ico') ||
    url.pathname.includes('chrome-extension://')
  ) {
    return new Response(null, { status: 404 });
  }

  throw new Response('Página não encontrada', { status: 404 });
}

/**
 * 404 Not Found page component
 */
export default function NotFound() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="space-y-4 text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-muted-foreground text-xl">Página não encontrada</p>
        <a href="/" className="text-primary inline-block hover:underline">
          Voltar para a página inicial
        </a>
      </div>
    </div>
  );
}
