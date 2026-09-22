import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { INTEREST_OPTIONS, BRAND, PROJECT } from '../../../lib/site-data';
import { appendStore, storePath } from '../../../lib/content-store';

/**
 * Enquiry intake for the website contact form.
 *
 *   POST /api/lead { name, phone, email?, interest, message?, _hp? } -> { ok, mailed }
 *
 * Order of operations matters: the enquiry is written to disk BEFORE the email
 * is attempted, and the response is ok as soon as it is stored. A prospective
 * buyer who filled in the form has reached us; if the SMTP relay is down we
 * must not tell them otherwise and we must not drop the lead. The stored log is
 * the system of record, email is the notification on top of it.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Where enquiry notifications are sent. */
const TO = process.env.LEAD_INBOX?.trim() || 'info@royalnestrealty.in';

const LOG = storePath('spb-leads.jsonl');

/* ── Validation ───────────────────────────────────────────────────────────
   Phone arrives as free text ("+91 99990 00000", "09999-000000"), so it is
   normalised to digits before the shape is checked rather than rejecting
   punctuation a visitor can reasonably type. */

const digits = (v: string) => v.replace(/[\s()\-.]/g, '');

const schema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(160),
  phone: z
    .string()
    .trim()
    .transform(digits)
    .refine((v) => /^\+?[0-9]{7,15}$/.test(v), 'Please enter a valid phone number'),
  // Optional, but must be a real address when supplied — a typo here is how a
  // reply silently never arrives.
  email: z.union([z.literal(''), z.string().trim().email()]).optional(),
  // Message is overridden because zod's default enumerates every option, and
  // that string is rendered to the visitor. Only reachable by a tampered
  // request — the <select> cannot produce anything else.
  interest: z
    .enum(INTEREST_OPTIONS as [string, ...string[]], {
      errorMap: () => ({ message: 'Please choose what you are interested in' }),
    })
    .optional(),
  message: z.string().trim().max(4000).optional(),
  // Honeypot: a field no human sees. Bots fill every input they find.
  _hp: z.string().max(0).optional(),
});

/* ── Rate limiting ────────────────────────────────────────────────────────
   A public unauthenticated POST endpoint will be found by spam bots. This is
   per-process and in memory, which is the right scope here: DEPLOYMENT.md runs
   a single systemd website service, so there is nothing to share state with.
   It is a spam brake, not a security control. */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

const recentFor = (ip: string, now: number) =>
  (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

/** Read-only check. */
function rateLimited(ip: string): boolean {
  return recentFor(ip, Date.now()).length >= MAX_PER_WINDOW;
}

/**
 * Counted only for enquiries that actually validated and were stored.
 *
 * Counting rejected submissions too would mean someone who mistypes their
 * phone number five times is locked out of contacting us for ten minutes —
 * punishing exactly the customer we want. A bot posting garbage is rejected
 * before it reaches the log or the inbox, so it costs nothing worth metering;
 * cap raw request volume at Nginx if that ever becomes a problem.
 */
function recordHit(ip: string): void {
  const now = Date.now();
  hits.set(ip, [...recentFor(ip, now), now]);
  // Opportunistic sweep so the map cannot grow without bound.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
}

/** Nginx terminates TLS and proxies, so the real client is in X-Forwarded-For. */
function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  return xff?.split(',')[0]?.trim() || req.headers.get('x-real-ip')?.trim() || 'unknown';
}

/* ── Mail ─────────────────────────────────────────────────────────────────── */

const SMTP_HOST = process.env.SMTP_HOST?.trim() ?? '';
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER?.trim() ?? '';
const SMTP_PASS = process.env.SMTP_PASS ?? '';
const SMTP_FROM = process.env.SMTP_FROM?.trim() || `${BRAND.name} <${TO}>`;

const mailConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Lead = z.infer<typeof schema> & { receivedAt: string; ip: string; userAgent: string };

function renderMail(lead: Lead) {
  const rows: [string, string][] = [
    ['Name', lead.name],
    ['Phone', lead.phone],
    ['Email', lead.email || '—'],
    ['Interested in', lead.interest || '—'],
    ['Message', lead.message || '—'],
    ['Received', new Date(lead.receivedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  const html = `<table style="border-collapse:collapse;font:14px/1.5 system-ui,sans-serif">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#587;white-space:nowrap;vertical-align:top">${esc(
          k,
        )}</td><td style="padding:6px 0"><strong>${esc(v).replace(/\n/g, '<br>')}</strong></td></tr>`,
    )
    .join('')}</table>`;
  return { text, html };
}

async function sendMail(lead: Lead): Promise<boolean> {
  if (!mailConfigured) {
    console.error(
      '[lead] SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASS) — enquiry stored but not emailed.',
    );
    return false;
  }
  const { text, html } = renderMail(lead);
  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      // 465 is implicit TLS; 587 upgrades with STARTTLS.
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transport.sendMail({
      from: SMTP_FROM,
      to: TO,
      // So hitting Reply in the inbox goes to the enquirer, not back to us.
      replyTo: lead.email || undefined,
      subject: `New enquiry — ${lead.name} (${lead.interest || 'General'}) — ${PROJECT.name}`,
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error('[lead] SMTP send failed — enquiry is stored in', LOG, err);
    return false;
  }
}

/* ── Handler ──────────────────────────────────────────────────────────────── */

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Too many enquiries from this connection. Please call us instead.' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Malformed request.' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    // A filled honeypot is a bot. Answer 200 so it sees success and moves on
    // instead of retrying with the field cleared.
    if (first?.path[0] === '_hp') return NextResponse.json({ ok: true, mailed: false });
    return NextResponse.json(
      { ok: false, error: first?.message ?? 'Please check the form and try again.' },
      { status: 400 },
    );
  }

  // `_hp` is spam plumbing, not part of the enquiry — keep it out of the log.
  const { _hp: _ignored, ...fields } = parsed.data;
  const lead: Lead = {
    ...fields,
    receivedAt: new Date().toISOString(),
    ip,
    userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? '',
  };

  recordHit(ip);

  try {
    await appendStore(LOG, lead);
  } catch (err) {
    // Nothing is captured, so this is the one case the visitor must be told
    // about — otherwise they would walk away believing they had reached us.
    console.error('[lead] could not write the enquiry log', err);
    return NextResponse.json(
      { ok: false, error: 'We could not record your enquiry. Please call or WhatsApp us.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, mailed: await sendMail(lead) });
}
