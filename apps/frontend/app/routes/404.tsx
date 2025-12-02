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

  // Ignore browser extension and well-known requests silently
  if (
    url.pathname.startsWith('/.well-known/') ||
    url.pathname.startsWith('/favicon.ico') ||
    url.pathname.includes('chrome-extension://')
  ) {
    return new Response(null, { status: 404 });
  }

  // For actual page requests, return 404
  throw new Response('Página não encontrada', { status: 404 });
}

/**
 * 404 Not Found page component
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-xl text-muted-foreground">Página não encontrada</p>
        <a href="/" className="inline-block text-primary hover:underline">
          Voltar para a página inicial
        </a>
      </div>
    </div>
  );
}
