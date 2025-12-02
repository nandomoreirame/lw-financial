import { render } from '@react-email/render';
import type { ReactElement } from 'react';

/**
 * Renderiza um componente React Email para HTML e texto
 * @param component Componente React Email
 * @returns Objeto com HTML e texto do email
 */
export async function renderEmail(component: ReactElement) {
  const html = await render(component);
  const text = await render(component, { plainText: true });

  return { html, text };
}
