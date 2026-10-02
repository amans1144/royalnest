import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { PoolClient } from 'pg';

/**
 * One-time import of the JSON-file store into Postgres.
 *
 * Before the database, everything lived as files under DATA_DIR. On the first
 * start against an empty database those files are read and copied in, so an
 * upgrade keeps every published page, traced map and enquiry without anyone
 * running a script. The files are left exactly where they are: they are the
 * rollback if the upgrade has to be reverted.
 *
 * Runs inside the schema transaction (see lib/db), under its advisory lock, and
 * records itself in site.migrations so it happens once. Existing rows always
 * win (ON CONFLICT DO NOTHING) — the import can fill gaps, never overwrite.
 * Each record gets its own savepoint, so one unstorable record is logged and
 * skipped instead of taking the whole site down with it.
 */

const MIGRATION = 'import-json-files-v1';

const DATA_DIR = process.env.DATA_DIR?.trim() || os.tmpdir();

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(path.join(DATA_DIR, file), 'utf8')) as T;
  } catch {
    return null;
  }
}

async function readJsonLines<T>(file: string): Promise<T[]> {
  let raw: string;
  try {
    raw = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
  } catch {
    return [];
  }
  return raw.split('\n').flatMap((line) => {
    if (!line.trim()) return [];
    try {
      return [JSON.parse(line) as T];
    } catch {
      return []; // a torn final line from the old append-only log
    }
  });
}

const json = (v: unknown) => JSON.stringify(v ?? null);

/** A timestamp from the old files, or null to let the column default apply. */
const when = (v: unknown): string | null =>
  typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : null;

export async function importLegacyFiles(db: PoolClient): Promise<void> {
  const done = await db.query('SELECT 1 FROM site.migrations WHERE name = $1', [MIGRATION]);
  if (done.rowCount) return;

  const counts = { content: 0, layouts: 0, adminState: 0, enquiries: 0, skipped: 0 };

  /** Run one insert in its own savepoint; true if it stored a row. */
  const attempt = async (what: string, sql: string, params: unknown[]): Promise<boolean> => {
    await db.query('SAVEPOINT legacy_row');
    try {
      const res = await db.query(sql, params);
      await db.query('RELEASE SAVEPOINT legacy_row');
      return (res.rowCount ?? 0) > 0;
    } catch (err) {
      await db.query('ROLLBACK TO SAVEPOINT legacy_row');
      console.error(`[db] legacy import: skipped ${what}:`, (err as Error).message);
      counts.skipped++;
      return false;
    }
  };

  const putContent = async (key: string, value: unknown, updatedAt: unknown) => {
    const ok = await attempt(
      `content "${key}"`,
      `INSERT INTO site.content (key, value, updated_at)
       VALUES ($1, $2::jsonb, COALESCE($3::timestamptz, now()))
       ON CONFLICT (key) DO NOTHING`,
      [key, json(value), when(updatedAt)],
    );
    if (ok) counts.content++;
  };

  // ── Published content ──
  const settings = await readJson<Record<string, unknown>>('spb-site-settings.json');
  if (settings && typeof settings === 'object') {
    await putContent('settings', settings, settings.updatedAt);
  }

  const gallery = await readJson<{ images?: unknown[]; updatedAt?: string }>(
    'spb-published-gallery.json',
  );
  if (Array.isArray(gallery?.images)) {
    await putContent('gallery', gallery.images, gallery.updatedAt);
  }

  const marketing = await readJson<{ items?: unknown[]; updatedAt?: string }>(
    'spb-published-marketing.json',
  );
  if (Array.isArray(marketing?.items)) {
    await putContent('marketing', marketing.items, marketing.updatedAt);
  }

  // ── Published layouts ──
  const layouts = await readJson<Record<string, { image?: unknown; plots?: unknown[]; updatedAt?: string }>>(
    'spb-published-layouts.json',
  );
  for (const [project, l] of Object.entries(layouts ?? {})) {
    if (!l || typeof l !== 'object') continue;
    const ok = await attempt(
      `layout "${project}"`,
      `INSERT INTO site.layouts (project, image, plots, updated_at)
       VALUES ($1, $2::jsonb, $3::jsonb, COALESCE($4::timestamptz, now()))
       ON CONFLICT (project) DO NOTHING`,
      [project, json(l.image), json(Array.isArray(l.plots) ? l.plots : []), when(l.updatedAt)],
    );
    if (ok) counts.layouts++;
  }

  // ── Shared admin state: admin-<key with / as __>.json ──
  let names: string[] = [];
  try {
    names = await fs.readdir(DATA_DIR);
  } catch {
    /* no data dir — nothing to import */
  }
  for (const name of names) {
    const m = /^admin-([a-z0-9_-]+)\.json$/.exec(name);
    if (!m) continue;
    const key = m[1]!.replace(/__/g, '/');
    const env = await readJson<{ value?: unknown; version?: number; updatedAt?: string }>(name);
    if (!env || env.value === undefined || env.value === null) continue;
    const ok = await attempt(
      `admin state "${key}"`,
      `INSERT INTO site.admin_state (key, value, version, updated_at)
       VALUES ($1, $2::jsonb, $3, COALESCE($4::timestamptz, now()))
       ON CONFLICT (key) DO NOTHING`,
      [
        key,
        json(env.value),
        Number.isInteger(env.version) && env.version! > 0 ? env.version : 1,
        when(env.updatedAt),
      ],
    );
    if (ok) counts.adminState++;
  }

  // ── Enquiries: the append-only spb-leads.jsonl ──
  type OldLead = {
    name?: string;
    phone?: string;
    email?: string;
    interest?: string;
    message?: string;
    receivedAt?: string;
    ip?: string;
    userAgent?: string;
  };
  for (const l of await readJsonLines<OldLead>('spb-leads.jsonl')) {
    if (!l.name || !l.phone) continue;
    const receivedAt = when(l.receivedAt);
    // Skips an enquiry already present (same person, same instant), so a
    // re-run after a partial failure cannot double the log.
    const ok = await attempt(
      `enquiry from ${l.name}`,
      `INSERT INTO site.enquiries (name, phone, email, interest, message, ip, user_agent, mailed, received_at)
       SELECT $1, $2, $3, $4, $5, $6, $7, NULL, COALESCE($8::timestamptz, now())
       WHERE NOT EXISTS (
         SELECT 1 FROM site.enquiries
         WHERE phone = $2 AND received_at = COALESCE($8::timestamptz, now())
       )`,
      [
        l.name,
        l.phone,
        l.email || null,
        l.interest || null,
        l.message || null,
        l.ip || null,
        l.userAgent || null,
        receivedAt,
      ],
    );
    if (ok) counts.enquiries++;
  }

  await db.query('INSERT INTO site.migrations (name, detail) VALUES ($1, $2::jsonb)', [
    MIGRATION,
    json({ from: DATA_DIR, ...counts }),
  ]);
  if (counts.content || counts.layouts || counts.adminState || counts.enquiries) {
    console.log(`[db] imported legacy JSON from ${DATA_DIR}:`, counts);
  }
}
