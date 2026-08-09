'use client';

/**
 * Headers for every call that rewrites the public site (gallery, marketing,
 * settings, plot layouts).
 *
 * The website refuses those writes in production unless the request carries a
 * matching PUBLISH_TOKEN, so this value has to be set at admin build time —
 * NEXT_PUBLIC_PUBLISH_TOKEN and the website's PUBLISH_TOKEN must be the same
 * string. Being a NEXT_PUBLIC_ value it is readable by anyone who can load the
 * admin bundle, which is exactly why the admin host also sits behind HTTP Basic
 * Auth: the token stops the endpoints being writable by the open internet, and
 * Basic Auth stops the bundle being downloadable in the first place.
 */
const TOKEN = process.env.NEXT_PUBLIC_PUBLISH_TOKEN ?? '';

export function publishHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(TOKEN ? { 'x-publish-token': TOKEN } : {}),
  };
}

/** Turns a failed publish response into something worth showing the user. */
export async function publishError(res: Response, websiteUrl: string): Promise<string> {
  if (res.status === 401) {
    return 'Publish rejected — the admin and website publish tokens do not match.';
  }
  if (res.status === 503) {
    return 'The website has no publish token configured, so publishing is disabled.';
  }
  if (res.status === 413) {
    return 'That upload is too large for the server to accept. Use a URL instead of a file.';
  }
  try {
    const body = (await res.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    /* fall through to the generic message */
  }
  return `${websiteUrl} returned ${res.status}`;
}
