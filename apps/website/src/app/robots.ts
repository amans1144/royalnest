import type { MetadataRoute } from 'next';
import { SITE_URL, absolute } from '../lib/seo';

/** Served at /robots.txt. The API routes are internal, so they stay out of the index. */
export default function robots(): MetadataRoute.Robots {
  // Never let a preview/staging deploy get indexed.
  const isProduction =
    process.env.NEXT_PUBLIC_ALLOW_INDEXING === 'true' ||
    (SITE_URL.startsWith('https://') && !SITE_URL.includes('localhost'));

  return {
    rules: isProduction
      ? [{ userAgent: '*', allow: '/', disallow: ['/api/'] }]
      : [{ userAgent: '*', disallow: '/' }],
    sitemap: absolute('/sitemap.xml'),
    host: SITE_URL,
  };
}
