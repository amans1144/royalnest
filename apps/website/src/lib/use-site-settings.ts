'use client';

import { useEffect, useState } from 'react';
import { EMPTY_SITE_SETTINGS, type SiteSettings } from '@spb/types';

/**
 * The settings the admin publishes (analytics IDs, SEO overrides, the hero
 * background). Several components need them on the same page, so the request
 * is made once per page load and shared — an uploaded hero image travels in
 * this payload and is not worth fetching twice.
 */
let inflight: Promise<SiteSettings> | null = null;

export function fetchSiteSettings(): Promise<SiteSettings> {
  inflight ??= fetch('/api/settings', { cache: 'no-store' })
    .then((r) => r.json() as Promise<Partial<SiteSettings>>)
    .then((s) => ({ ...EMPTY_SITE_SETTINGS, ...s }))
    .catch(() => {
      // Let the next caller retry rather than caching a failure for the session.
      inflight = null;
      return EMPTY_SITE_SETTINGS;
    });
  return inflight;
}

/** `loaded` stays false until the real settings land, so components can hold
 *  their built-in default instead of flashing an empty state. */
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(EMPTY_SITE_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchSiteSettings().then((s) => {
      if (cancelled) return;
      setSettings(s);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { settings, loaded };
}
