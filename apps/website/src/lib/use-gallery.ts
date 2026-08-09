'use client';

import { useEffect, useState } from 'react';
import type { GalleryImage } from '@spb/types';
import { GALLERY } from './site-data';

/** The built-in set, shaped like published images so both render identically. */
const FALLBACK: GalleryImage[] = GALLERY.map((g, i) => ({
  id: `seed-${i}`,
  src: g.src,
  label: g.label,
  category: g.category,
}));

/**
 * The gallery the site should show: whatever the admin last published, falling
 * back to the built-in set when nothing has been published yet. Starts from the
 * fallback so the first paint (and SSR) is never empty.
 */
export function useGallery() {
  const [images, setImages] = useState<GalleryImage[]>(FALLBACK);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/gallery', { cache: 'no-store' });
        const data = (await res.json()) as { images?: GalleryImage[] };
        if (cancelled) return;
        if (Array.isArray(data.images) && data.images.length > 0) {
          setImages(data.images);
          setLive(true);
        }
      } catch {
        /* keep the fallback */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { images, live };
}

export { FALLBACK as GALLERY_FALLBACK };
