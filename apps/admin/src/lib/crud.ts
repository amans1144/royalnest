'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { diffFields, logActivity, type ActivityEntity } from './activity';
import { loadState, saveState } from './remote-store';
import { primeShared } from './shared-state';

/**
 * A SERVER-backed collection with a React hook.
 *
 * This used to be localStorage, which meant each browser held its own private
 * copy: a project created on one laptop was invisible on every other, and
 * clearing site data destroyed it. The list now lives on the website (see
 * lib/remote-store), so every admin on any machine works on the same records.
 *
 * `storageError` is surfaced rather than swallowed — an operator needs to know
 * when their edits are sitting on one device instead of being shared.
 *
 * Pass `audit` to record every mutation to the activity log:
 *   usePersistentList('leads', SEED, { entity: 'Lead', label: l => l.name })
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
  const [storageError, setStorageError] = useState<string | null>(null);
  /** Server version, carried so a save can detect another admin's edit. */
  const version = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const got = await loadState<T[]>(key, seed);
      if (cancelled) return;
      const list = Array.isArray(got.value) ? got.value : seed;
      setItems(list);
      // Synchronous readers (readProjects, live-data) read the mirror.
      primeShared(key, list);
      version.current = got.version;
      setStorageError(got.error);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
    // `seed` is a module-level constant in every call site; re-running on a new
    // array identity would clobber loaded data with the seed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /**
   * Push a new list up and keep the version in step.
   *
   * Mutations go through here rather than an effect watching `items`: an
   * effect would also fire for the initial load and write the server's own
   * value straight back, bumping the version on every page view.
   */
  const persist = useCallback(
    async (next: T[]) => {
      primeShared(key, next);
      const res = await saveState(key, next, version.current);
      if (res.ok) {
        version.current = res.version;
        setStorageError(null);
        return;
      }
      if (res.conflict) {
        // Another admin got there first. Their version is authoritative, so
        // reload rather than pretending this save succeeded.
        const fresh = await loadState<T[]>(key, next);
        const list = Array.isArray(fresh.value) ? fresh.value : next;
        setItems(list);
        primeShared(key, list);
        version.current = fresh.version;
      }
      setStorageError(res.error);
    },
    [key],
  );

  /**
   * Applies a change locally for instant feedback, then saves it.
   *
   * The next list is computed by the CALLER from `items`, not inside a setState
   * updater. StrictMode double-invokes updaters, so saving from inside one
   * fired two PUTs per edit — the second carrying a now-stale version, which
   * came back 409 and triggered a pointless reload on every single change.
   * This is the same trap the audit calls below already avoid.
   */
  const commit = useCallback(
    (next: T[]) => {
      setItems(next);
      void persist(next);
    },
    [persist],
  );

  const add = (item: T) => {
    commit([item, ...items]);
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
    commit(items.map((x) => (x.id === id ? { ...x, ...patch } : x)));
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
    commit(items.filter((x) => x.id !== id));
  };

  const reset = () => commit(seed);

  return { items, add, update, remove, reset, loaded, storageError };
}

/** Short unique id with a readable prefix, e.g. genId('prj') -> 'prj-k3f9a2'. */
export const genId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
