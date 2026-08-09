'use client';

import {
  detectMarketingKind,
  isSafeMediaUrl,
  type MarketingItem,
  type MarketingKind,
} from '@spb/types';
import { WEBSITE_URL } from './layouts';
import { compressImage } from './gallery';
import { publishError, publishHeaders } from './publish';

/**
 * Store for the Marketing Material page. Same shape as the gallery store:
 * the admin's working copy lives in localStorage and "publish" pushes it to
 * the public site's /api/marketing endpoint. Swapped for S3 uploads when the
 * API lands.
 *
 * Uploaded files become data URIs, so anything large belongs on a URL instead
 * of in browser storage — hence the caps below.
 */

export const MARKETING_KEY = 'rnr_marketing';
export const MARKETING_API = `${WEBSITE_URL}/api/marketing`;

/** Browser storage is ~5 MB total. A PDF past this must be linked, not uploaded. */
export const MAX_PDF_BYTES = 2 * 1024 * 1024;

export function readMarketing(): MarketingItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MARKETING_KEY);
    const list = raw ? (JSON.parse(raw) as MarketingItem[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function writeMarketing(items: MarketingItem[]): { ok: boolean; error?: string } {
  try {
    localStorage.setItem(MARKETING_KEY, JSON.stringify(items));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error:
        'Browser storage is full. Remove an uploaded file, or add large PDFs and videos by URL instead.',
    };
  }
}

/** Rough byte size of the stored set, for the quota meter. */
export function marketingSize(items: MarketingItem[]): number {
  return items.reduce((sum, i) => sum + i.url.length + (i.thumbnail?.length ?? 0), 0);
}

export const formatBytes = (n: number): string =>
  n > 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

/** Read any file as a data URI, refusing anything that would blow the quota. */
export function fileToDataUri(file: File, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      reject(
        new Error(
          `${formatBytes(file.size)} is over the ${formatBytes(maxBytes)} upload limit — add it by URL instead`,
        ),
      );
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

/** Turn a dropped file into an item body. Images are downscaled the same way
 *  the gallery does; PDFs are stored as-is under the size cap; everything else
 *  (video especially) is rejected in favour of a URL. */
export async function itemFromFile(
  file: File,
): Promise<{ kind: MarketingKind; url: string; title: string }> {
  const title =
    file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .slice(0, 80) || 'Untitled';

  if (file.type.startsWith('image/')) {
    const { src } = await compressImage(file);
    return { kind: 'image', url: src, title };
  }
  if (file.type === 'application/pdf') {
    return { kind: 'pdf', url: await fileToDataUri(file, MAX_PDF_BYTES), title };
  }
  throw new Error('only images and PDFs can be uploaded — add videos by URL');
}

/**
 * Normalise a pasted link and report whether it's something we're willing to
 * publish. Only a bare "example.com/file.pdf" gets an https:// prefix — a value
 * that already carries a scheme is judged as written, so `javascript:alert(1)`
 * is rejected instead of being laundered into `https://javascript:alert(1)`.
 */
export function normaliseUrl(raw: string): { url: string; ok: boolean } {
  const trimmed = raw.trim();
  if (!trimmed) return { url: '', ok: false };
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
  const url = hasScheme ? trimmed : `https://${trimmed}`;
  return { url, ok: isSafeMediaUrl(url) };
}

export { detectMarketingKind };

/** Push the current set to the public website. */
export async function publishMarketing(
  items: MarketingItem[],
): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const res = await fetch(MARKETING_API, {
      method: 'POST',
      headers: publishHeaders(),
      body: JSON.stringify({ items }),
    });
    if (!res.ok) return { ok: false, error: await publishError(res, WEBSITE_URL) };
    const body = (await res.json()) as { count?: number };
    return { ok: true, count: body.count ?? items.length };
  } catch {
    return { ok: false, error: `Could not reach the website at ${WEBSITE_URL}` };
  }
}

export const marketingId = () =>
  `mkt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
