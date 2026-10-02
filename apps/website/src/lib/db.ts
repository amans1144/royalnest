import { Pool } from 'pg';
import { importLegacyFiles } from './legacy-import';

/**
 * The website's Postgres store.
 *
 * Everything the admin publishes, every piece of shared admin state and every
 * contact-form enquiry lives here — not in JSON files on a volume. That buys
 * what the file store could not give: concurrent writers without lost updates
 * (the version check is one atomic UPDATE, not read-compare-write), enquiries
 * that are rows rather than lines in a log, and a single `pg_dump` that backs
 * up the lot.
 *
 * All tables live in their own `site` schema. The API's Prisma schema owns
 * `public` and is applied with `prisma db push`, which drops tables it does not
 * know about; keeping ours out of `public` makes that impossible rather than
 * merely unlikely.
 *
 * The schema is created on first use, idempotently and under an advisory lock,
 * so a fresh volume, a restart and two processes starting at once all converge
 * on the same state with no separate migrate step to forget.
 */

declare global {
  // Survives Next's dev-mode module reloads; one pool per process, not per edit.
  var __spbPool: Pool | undefined;
  var __spbReady: Promise<void> | undefined;
}

export class DbUnavailable extends Error {}

/**
 * DATABASE_URL is shared with the API, which appends Prisma's `?schema=public`.
 * node-postgres does not understand that parameter, and our tables are always
 * schema-qualified anyway, so it is dropped rather than passed through.
 */
function connectionString(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new DbUnavailable(
      'DATABASE_URL is not set on the website, so it has nowhere to store content or enquiries.',
    );
  }
  try {
    const url = new URL(raw);
    url.searchParams.delete('schema');
    return url.toString();
  } catch {
    return raw;
  }
}

function pool(): Pool {
  if (!globalThis.__spbPool) {
    const p = new Pool({
      connectionString: connectionString(),
      // A 1 vCPU box: a handful of connections is plenty, and Postgres's own
      // default limit is shared with the API.
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    // An idle client dropping (Postgres restarted) must not crash the process;
    // the pool replaces it on the next checkout.
    p.on('error', (err) => console.error('[db] idle client error', err.message));
    globalThis.__spbPool = p;
  }
  return globalThis.__spbPool;
}

const SCHEMA_SQL = `
  CREATE SCHEMA IF NOT EXISTS site;

  -- One-shot steps that must not re-run (the legacy JSON import).
  CREATE TABLE IF NOT EXISTS site.migrations (
    name       text PRIMARY KEY,
    detail     jsonb,
    applied_at timestamptz NOT NULL DEFAULT now()
  );

  -- Published site content that is replaced as a whole: settings, gallery,
  -- marketing material.
  CREATE TABLE IF NOT EXISTS site.content (
    key        text PRIMARY KEY,
    value      jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  -- Published plot layouts, one row per project.
  CREATE TABLE IF NOT EXISTS site.layouts (
    project    text PRIMARY KEY,
    image      jsonb,
    plots      jsonb NOT NULL DEFAULT '[]'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  -- The admin console's shared working state (projects, leads, bookings,
  -- per-project layouts, activity). Versioned for conflict detection.
  CREATE TABLE IF NOT EXISTS site.admin_state (
    key        text PRIMARY KEY,
    value      jsonb,
    version    integer NOT NULL DEFAULT 1,
    updated_at timestamptz NOT NULL DEFAULT now()
  );

  -- Contact-form enquiries. Append-only from the public site.
  CREATE TABLE IF NOT EXISTS site.enquiries (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        text NOT NULL,
    phone       text NOT NULL,
    email       text,
    interest    text,
    message     text,
    ip          text,
    user_agent  text,
    -- null = unknown (imported from the old log, which did not record it).
    mailed      boolean DEFAULT false,
    received_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS enquiries_received_at_idx ON site.enquiries (received_at DESC);
  CREATE INDEX IF NOT EXISTS enquiries_phone_idx ON site.enquiries (phone);
`;

/** Any fixed 64-bit number; it just has to be the same in every process. */
const SCHEMA_LOCK = 724_310_551;

async function prepare(): Promise<void> {
  const client = await pool().connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [SCHEMA_LOCK]);
    await client.query(SCHEMA_SQL);
    await importLegacyFiles(client);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Resolves once the schema exists. A failure is not cached: if Postgres is
 * still starting, the next request tries again instead of the website staying
 * broken until it is restarted.
 */
function ready(): Promise<void> {
  globalThis.__spbReady ??= prepare().catch((err) => {
    globalThis.__spbReady = undefined;
    throw err;
  });
  return globalThis.__spbReady;
}

async function query<R extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<R[]> {
  try {
    await ready();
    return (await pool().query<R>(text, params)).rows;
  } catch (err) {
    if (err instanceof DbUnavailable) throw err;
    console.error('[db]', (err as Error).message);
    throw new DbUnavailable('The website could not reach its database.');
  }
}

/**
 * Always serialise explicitly: node-postgres turns a JS array parameter into a
 * Postgres array literal, not JSON, which would corrupt every list we store.
 */
const json = (v: unknown) => JSON.stringify(v ?? null);

const iso = (d: unknown): string | null => (d instanceof Date ? d.toISOString() : null);

/* ── Published content ──────────────────────────────────────────────────── */

export type ContentKey = 'settings' | 'gallery' | 'marketing';

export async function getContent<T>(
  key: ContentKey,
): Promise<{ value: T; updatedAt: string | null } | null> {
  const rows = await query<{ value: T; updated_at: Date }>(
    'SELECT value, updated_at FROM site.content WHERE key = $1',
    [key],
  );
  const row = rows[0];
  return row ? { value: row.value, updatedAt: iso(row.updated_at) } : null;
}

export async function putContent(key: ContentKey, value: unknown): Promise<string> {
  const rows = await query<{ updated_at: Date }>(
    `INSERT INTO site.content (key, value) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
     RETURNING updated_at`,
    [key, json(value)],
  );
  return iso(rows[0]?.updated_at) ?? new Date().toISOString();
}

/* ── Published layouts ──────────────────────────────────────────────────── */

export type PublishedLayout = { image: unknown; plots: unknown[]; updatedAt: string | null };

export async function getLayout(project: string): Promise<PublishedLayout | null> {
  const rows = await query<{ image: unknown; plots: unknown[]; updated_at: Date }>(
    'SELECT image, plots, updated_at FROM site.layouts WHERE project = $1',
    [project],
  );
  const row = rows[0];
  return row ? { image: row.image, plots: row.plots, updatedAt: iso(row.updated_at) } : null;
}

/** Projects that have a map worth showing: an image and at least one plot. */
export async function listLiveLayouts(): Promise<string[]> {
  const rows = await query<{ project: string }>(
    `SELECT project FROM site.layouts
     WHERE image IS NOT NULL AND image <> 'null'::jsonb
       AND jsonb_typeof(plots) = 'array' AND jsonb_array_length(plots) > 0
     ORDER BY project`,
  );
  return rows.map((r) => r.project);
}

/** One row upsert — publishing one project can no longer clobber another's. */
export async function putLayout(project: string, image: unknown, plots: unknown[]): Promise<void> {
  await query(
    `INSERT INTO site.layouts (project, image, plots) VALUES ($1, $2::jsonb, $3::jsonb)
     ON CONFLICT (project) DO UPDATE
       SET image = EXCLUDED.image, plots = EXCLUDED.plots, updated_at = now()`,
    [project, json(image), json(plots)],
  );
}

/* ── Shared admin state ─────────────────────────────────────────────────── */

export type StateEnvelope = { value: unknown; version: number; updatedAt: string };

export async function getState(key: string): Promise<StateEnvelope> {
  const rows = await query<{ value: unknown; version: number; updated_at: Date }>(
    'SELECT value, version, updated_at FROM site.admin_state WHERE key = $1',
    [key],
  );
  const row = rows[0];
  return row
    ? { value: row.value, version: row.version, updatedAt: iso(row.updated_at) ?? '' }
    : { value: null, version: 0, updatedAt: '' };
}

export type StateWrite =
  | { ok: true; version: number; updatedAt: string }
  | { ok: false; conflict: true; version: number };

/**
 * Write shared state.
 *
 * With `baseVersion` the write only lands if nobody else has written since —
 * enforced by the WHERE clause of a single statement, so two admins saving at
 * the same instant cannot both "win". Version 0 means "I believe this key has
 * never been written". Without `baseVersion` it is last-write-wins.
 */
export async function putState(
  key: string,
  value: unknown,
  baseVersion?: number,
): Promise<StateWrite> {
  type Row = { version: number; updated_at: Date };
  let rows: Row[];

  if (baseVersion === undefined) {
    rows = await query<Row>(
      `INSERT INTO site.admin_state (key, value) VALUES ($1, $2::jsonb)
       ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, version = site.admin_state.version + 1, updated_at = now()
       RETURNING version, updated_at`,
      [key, json(value)],
    );
  } else if (baseVersion === 0) {
    rows = await query<Row>(
      `INSERT INTO site.admin_state (key, value) VALUES ($1, $2::jsonb)
       ON CONFLICT (key) DO NOTHING
       RETURNING version, updated_at`,
      [key, json(value)],
    );
  } else {
    rows = await query<Row>(
      `UPDATE site.admin_state
         SET value = $2::jsonb, version = version + 1, updated_at = now()
       WHERE key = $1 AND version = $3
       RETURNING version, updated_at`,
      [key, json(value), baseVersion],
    );
  }

  const row = rows[0];
  if (row) return { ok: true, version: row.version, updatedAt: iso(row.updated_at) ?? '' };
  return { ok: false, conflict: true, version: (await getState(key)).version };
}

/* ── Enquiries ──────────────────────────────────────────────────────────── */

export type NewEnquiry = {
  name: string;
  phone: string;
  email?: string;
  interest?: string;
  message?: string;
  ip: string;
  userAgent: string;
};

export type EnquiryRow = NewEnquiry & { id: string; receivedAt: string; mailed: boolean | null };

export async function insertEnquiry(e: NewEnquiry): Promise<{ id: string; receivedAt: string }> {
  const rows = await query<{ id: string; received_at: Date }>(
    `INSERT INTO site.enquiries (name, phone, email, interest, message, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id::text AS id, received_at`,
    [e.name, e.phone, e.email || null, e.interest || null, e.message || null, e.ip, e.userAgent],
  );
  return { id: rows[0]!.id, receivedAt: iso(rows[0]!.received_at)! };
}

/** Best effort — the enquiry is already safe; this only records the email. */
export async function markEnquiryMailed(id: string): Promise<void> {
  await query('UPDATE site.enquiries SET mailed = true WHERE id = $1::bigint', [id]).catch(
    () => {},
  );
}

/** Newest first, because that is the order anybody actually reads them in. */
export async function listEnquiries(limit: number): Promise<{ total: number; rows: EnquiryRow[] }> {
  const [count, rows] = await Promise.all([
    query<{ n: string }>('SELECT count(*)::text AS n FROM site.enquiries'),
    query<{
      id: string;
      name: string;
      phone: string;
      email: string | null;
      interest: string | null;
      message: string | null;
      ip: string | null;
      user_agent: string | null;
      mailed: boolean | null;
      received_at: Date;
    }>(
      `SELECT id::text AS id, name, phone, email, interest, message, ip, user_agent, mailed, received_at
       FROM site.enquiries ORDER BY received_at DESC, id DESC LIMIT $1`,
      [limit],
    ),
  ]);
  return {
    total: Number(count[0]?.n ?? 0),
    rows: rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      email: r.email ?? undefined,
      interest: r.interest ?? undefined,
      message: r.message ?? undefined,
      ip: r.ip ?? '',
      userAgent: r.user_agent ?? '',
      mailed: r.mailed,
      receivedAt: iso(r.received_at)!,
    })),
  };
}
