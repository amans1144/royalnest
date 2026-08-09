'use client';

import type { GalleryImage } from '@spb/types';
import { WEBSITE_URL } from './layouts';
import { publishError, publishHeaders } from './publish';

/**
 * Gallery store for the Media Library. Images are held as compressed data URIs
 * in localStorage (the admin's working copy) and pushed to the public site's
 * /api/gallery endpoint on publish. Swapped for S3 uploads when the API lands.
 */

export const GALLERY_KEY = 'rnr_gallery';
export const GALLERY_API = `${WEBSITE_URL}/api/gallery`;

/** Uploads are downscaled before storage — originals from a phone are 4–8 MB
 *  each and would blow the ~5 MB localStorage budget after one or two photos. */
export const MAX_EDGE = 1600;
export const JPEG_QUALITY = 0.82;

export function readGallery(): GalleryImage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    const list = raw ? (JSON.parse(raw) as GalleryImage[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function writeGallery(images: GalleryImage[]): { ok: boolean; error?: string } {
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(images));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Browser storage is full. Remove some images or publish and clear older ones.',
    };
  }
}

/** Rough byte size of the stored gallery, for the quota meter. */
export function gallerySize(images: GalleryImage[]): number {
  return images.reduce((sum, g) => sum + g.src.length, 0);
}

export const formatBytes = (n: number): string =>
  n > 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

/**
 * Read a file, downscale it so the long edge is at most `maxEdge`, and return a
 * JPEG data URI. SVGs are passed through untouched (they're already small and
 * rasterising them would lose their scalability). The hero background passes a
 * larger edge than the gallery — it's shown full-screen.
 */
export function compressImage(
  file: File,
  maxEdge: number = MAX_EDGE,
): Promise<{ src: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.onload = () => {
      const raw = reader.result as string;
      if (file.type === 'image/svg+xml') {
        resolve({ src: raw, width: 0, height: 0 });
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a readable image'));
      img.onload = () => {
        const { naturalWidth: w, naturalHeight: h } = img;
        const scale = Math.min(1, maxEdge / Math.max(w, h));
        const cw = Math.max(1, Math.round(w * scale));
        const ch = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement('canvas');
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas is unavailable in this browser'));
          return;
        }
        ctx.imageSmoothingQuality = 'high';
        // JPEG has no alpha — paint white first so PNGs don't go black.
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, 0, 0, cw, ch);
        resolve({ src: canvas.toDataURL('image/jpeg', JPEG_QUALITY), width: cw, height: ch });
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });
}

/** Push the current gallery to the public website. */
export async function publishGallery(
  images: GalleryImage[],
): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const res = await fetch(GALLERY_API, {
      method: 'POST',
      headers: publishHeaders(),
      body: JSON.stringify({ images }),
    });
    if (!res.ok) return { ok: false, error: await publishError(res, WEBSITE_URL) };
    const body = (await res.json()) as { count?: number };
    return { ok: true, count: body.count ?? images.length };
  } catch {
    return { ok: false, error: `Could not reach the website at ${WEBSITE_URL}` };
  }
}

export const galleryId = () => `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
