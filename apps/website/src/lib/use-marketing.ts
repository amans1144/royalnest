'use client';

import { useEffect, useState } from 'react';
import { isSafeMediaUrl, isMarketingKind, isMarketingCategory, type MarketingItem } from '@spb/types';

/**
 * The marketing material the site should show — whatever the admin last
 * published. Unlike the gallery there is no built-in fallback set: brochures
 * and price lists are real documents, so an empty page is the honest state
 * until the admin publishes. `loaded` distinguishes "still fetching" from
 * "nothing published", which is what the page renders its empty state on.
 */
export function useMarketing() {
  const [items, setItems] = useState<MarketingItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/marketing', { cache: 'no-store' });
        const data = (await res.json()) as { items?: unknown };
        if (cancelled) return;
        if (Array.isArray(data.items)) setItems(data.items.filter(isRenderable));
      } catch {
        /* leave the list empty — the page shows its empty state */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loaded };
}

/** Second line of defence after the API's own sanitiser. */
function isRenderable(raw: unknown): raw is MarketingItem {
  if (!raw || typeof raw !== 'object') return false;
  const r = raw as Record<string, unknown>;
  return (
    isSafeMediaUrl(r.url) &&
    isMarketingKind(r.kind) &&
    isMarketingCategory(r.category) &&
    typeof r.title === 'string'
  );
}
