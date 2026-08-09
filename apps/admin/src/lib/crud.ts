'use client';

import { useEffect, useState } from 'react';
import { diffFields, logActivity, type ActivityEntity } from './activity';

/**
 * A localStorage-backed collection with a React hook. Seeded from mock data on
 * first load; all create/update/delete operations persist across reloads.
 * (Standalone stand-in until the NestJS API + Postgres are wired in.)
 *
 * Pass `audit` to record every mutation to the activity log:
 *   usePersistentList('rnr_leads', SEED, { entity: 'Lead', label: l => l.name })
 */
export interface AuditOptions<T> {
  entity: ActivityEntity;
  /** Human-readable name for the record, shown in the activity log. */
  label: (item: T) => string;
  /** Fields never worth auditing (derived values, etc.). */
  skipFields?: string[];
}

export function usePersistentList<T extends { id: string }>(
  key: string,
  seed: T[],
  audit?: AuditOptions<T>,
) {
  const [items, setItems] = useState<T[]>(seed);
  const [loaded, setLoaded] = useState(false);

  // Load persisted data on the client (after first paint) to avoid SSR mismatch.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) setItems(JSON.parse(raw) as T[]);
    } catch {
      /* ignore corrupt storage */
    }
    setLoaded(true);
  }, [key]);

  // Persist whenever items change (but not before the initial load).
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      /* storage full / unavailable */
    }
  }, [key, items, loaded]);

  const add = (item: T) => {
    setItems((xs) => [item, ...xs]);
    if (audit) {
      logActivity({
        action: 'CREATE',
        entity: audit.entity,
        entityId: item.id,
        label: audit.label(item),
      });
    }
  };

  // NOTE: auditing happens *outside* the setItems updater. React StrictMode
  // double-invokes updater functions, which would double-log every mutation.
  const update = (id: string, patch: Partial<T>) => {
    if (audit) {
      const before = items.find((x) => x.id === id);
      if (before) {
        const changes = diffFields(
          before as Record<string, unknown>,
          patch as Record<string, unknown>,
          ['id', ...(audit.skipFields ?? [])],
        );
        if (changes.length) {
          logActivity({
            action: 'UPDATE',
            entity: audit.entity,
            entityId: id,
            label: audit.label({ ...before, ...patch }),
            changes,
          });
        }
      }
    }
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const remove = (id: string) => {
    if (audit) {
      const gone = items.find((x) => x.id === id);
      if (gone) {
        logActivity({
          action: 'DELETE',
          entity: audit.entity,
          entityId: id,
          label: audit.label(gone),
        });
      }
    }
    setItems((xs) => xs.filter((x) => x.id !== id));
  };

  const reset = () => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setItems(seed);
  };

  return { items, add, update, remove, reset, loaded };
}

/** Short unique id with a readable prefix, e.g. genId('prj') -> 'prj-k3f9a2'. */
export const genId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
