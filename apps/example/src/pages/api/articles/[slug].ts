import type { APIRoute } from 'astro';
import { readArticle, writeArticle, deleteArticle } from '../../../lib/articles';

export const GET: APIRoute = async ({ params }) => {
  const article = await readArticle(params.slug!);
  if (!article) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ slug: article.slug, content: article.raw }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request }) => {
  const body = await request.json();
  const content = body.content as string;
  if (typeof content !== 'string') {
    return new Response(
      JSON.stringify({ error: 'content is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  await writeArticle(params.slug!, content);
  return new Response(JSON.stringify({ slug: params.slug }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params }) => {
  const deleted = await deleteArticle(params.slug!);
  if (!deleted) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ deleted: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
