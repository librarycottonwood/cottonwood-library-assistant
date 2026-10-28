import type { APIRoute } from 'astro';
import { tokensCSS } from '../../design-system/tokens';

export const GET: APIRoute = () => new Response(tokensCSS, {
  headers: { 'Content-Type': 'text/css; charset=utf-8' },
});
