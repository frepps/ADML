import type { APIRoute } from 'astro';
import { listArticles, writeArticle, articleExists } from '../../../lib/articles';

export const GET: APIRoute = async () => {
  const articles = await listArticles();
  return new Response(JSON.stringify(articles), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const slug = body.slug as string | undefined;
  const content = (body.content as string) ?? '';

  if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
    return new Response(
      JSON.stringify({ error: 'Invalid slug. Use lowercase letters, numbers, and hyphens.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (await articleExists(slug)) {
    return new Response(
      JSON.stringify({ error: 'Article already exists' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    );
  }

  await writeArticle(slug, content);
  return new Response(JSON.stringify({ slug }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
