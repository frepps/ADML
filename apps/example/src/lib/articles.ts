import fs from 'node:fs/promises';
import path from 'node:path';
import { parse, type ADMLResult } from '@adml/parser';

const CONTENT_DIR = path.resolve(
  new URL('.', import.meta.url).pathname,
  '../../content/articles'
);

export interface ArticleFile {
  slug: string;
  raw: string;
  data: ADMLResult;
}

export async function listArticles(): Promise<{ slug: string; title: string }[]> {
  try {
    const files = await fs.readdir(CONTENT_DIR);
    const articles: { slug: string; title: string }[] = [];
    for (const file of files) {
      if (!file.endsWith('.adml')) continue;
      const slug = file.replace(/\.adml$/, '');
      const raw = await fs.readFile(path.join(CONTENT_DIR, file), 'utf-8');
      const data = parse(raw);
      articles.push({ slug, title: data.title ?? slug });
    }
    return articles.sort((a, b) => a.slug.localeCompare(b.slug));
  } catch {
    return [];
  }
}

export async function readArticle(slug: string): Promise<ArticleFile | null> {
  const filePath = path.join(CONTENT_DIR, `${slug}.adml`);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = parse(raw);
    return { slug, raw, data };
  } catch {
    return null;
  }
}

export async function writeArticle(slug: string, content: string): Promise<void> {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  await fs.writeFile(path.join(CONTENT_DIR, `${slug}.adml`), content, 'utf-8');
}

export async function deleteArticle(slug: string): Promise<boolean> {
  try {
    await fs.unlink(path.join(CONTENT_DIR, `${slug}.adml`));
    return true;
  } catch {
    return false;
  }
}

export async function articleExists(slug: string): Promise<boolean> {
  try {
    await fs.access(path.join(CONTENT_DIR, `${slug}.adml`));
    return true;
  } catch {
    return false;
  }
}
