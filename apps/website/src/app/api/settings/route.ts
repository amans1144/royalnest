import { NextResponse } from 'next/server';
import {
  EMPTY_SITE_SETTINGS,
  clampHeroOverlay,
  isHeroMediaType,
  isSafeMediaUrl,
  type SiteSettings,
} from '@spb/types';
import { CORS, denyPublish, storageFailure } from '../../../lib/content-store';
import { getContent, putContent } from '../../../lib/db';

/**
 * Site settings published from the admin's Settings page — analytics IDs,
 * search-console verification, SEO overrides and the hero background. Stored
 * in Postgres (site.content) — see lib/db.
 *
 *   GET  /api/settings -> SiteSettings
 *   POST /api/settings { ...settings } -> { ok }
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const str = (v: unknown, max = 300): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

/** Hero sources are never truncated (an uploaded image is one long data URI) —
 *  they're either a safe, complete media URL or they're dropped entirely. */
const media = (v: unknown): string => (isSafeMediaUrl(v) ? v.trim() : '');

async function read(): Promise<SiteSettings> {
  const row = await getContent<Partial<SiteSettings>>('settings');
  return { ...EMPTY_SITE_SETTINGS, ...(row?.value ?? {}) };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET() {
  try {
    return NextResponse.json(await read(), { headers: CORS });
  } catch (err) {
    return storageFailure(err, EMPTY_SITE_SETTINGS);
  }
}

export async function POST(req: Request) {
  const denied = denyPublish(req);
  if (denied) {
    return NextResponse.json(
      { ok: false, error: denied.error },
      { status: denied.status, headers: CORS },
    );
  }
  try {
    const b = (await req.json()) as Record<string, unknown>;
    const next: SiteSettings = {
      gaMeasurementId: str(b.gaMeasurementId, 40),
      gtmId: str(b.gtmId, 40),
      googleSiteVerification: str(b.googleSiteVerification, 120),
      facebookDomainVerification: str(b.facebookDomainVerification, 120),
      metaTitle: str(b.metaTitle, 120),
      metaDescription: str(b.metaDescription, 320),
      heroMediaType: isHeroMediaType(b.heroMediaType) ? b.heroMediaType : 'default',
      heroImageUrl: media(b.heroImageUrl),
      heroVideoUrl: media(b.heroVideoUrl),
      heroPosterUrl: media(b.heroPosterUrl),
      heroOverlay: clampHeroOverlay(b.heroOverlay),
      updatedAt: new Date().toISOString(),
    };
    await putContent('settings', next);
    return NextResponse.json({ ok: true, settings: next }, { headers: CORS });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { ok: false, error: 'Malformed request body.' },
        { status: 400, headers: CORS },
      );
    }
    return storageFailure(err);
  }
}
