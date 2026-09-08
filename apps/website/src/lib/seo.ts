import { AMENITY_GROUPS, BRAND, PROJECT, THEME_GARDENS } from './site-data';

/**
 * Canonical origin for the site. MUST be set to the real domain in production
 * (NEXT_PUBLIC_SITE_URL) — canonical tags, OG URLs, the sitemap and robots.txt
 * all derive from it, and shipping with the localhost default would tell
 * crawlers the canonical page lives on localhost.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
).replace(/\/$/, '');

/** Absolute URL for a site-relative path. */
export const absolute = (path = '/'): string => new URL(path, SITE_URL).toString();

export const OG_IMAGE = '/liberty-imperial-greens-gate.jpg';

/** Every route we want indexed, with its change cadence. */
export const ROUTES = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' as const },
  { path: '/gallery', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/marketing', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' as const },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' as const },
];

/* ── JSON-LD ─────────────────────────────────────────────────────────────
   Only describe what is actually rendered on the page — search engines
   penalise structured data that has no visible counterpart.               */

const postalAddress = {
  '@type': 'PostalAddress',
  streetAddress: PROJECT.locality,
  addressLocality: PROJECT.city,
  addressRegion: 'Uttar Pradesh',
  postalCode: '227125',
  addressCountry: 'IN',
};

/** The selling agent — powers the knowledge panel / brand result. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': absolute('/#organization'),
    name: BRAND.name,
    url: SITE_URL,
    logo: absolute('/royal-nest-logo.png'),
    image: absolute(OG_IMAGE),
    description: BRAND.tagline,
    telephone: BRAND.phone,
    email: BRAND.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: BRAND.address,
      addressLocality: 'Lucknow',
      addressRegion: 'Uttar Pradesh',
      addressCountry: 'IN',
    },
    areaServed: { '@type': 'City', name: 'Lucknow' },
    openingHours: 'Mo-Sa 10:00-19:00',
  };
}

/** The township itself and its amenities. No price or offer is published —
 *  structured data must not expose a rate the page deliberately withholds. */
export function projectJsonLd() {
  const amenities = [
    ...AMENITY_GROUPS.flatMap((g) => g.items.map((i) => i.label)),
    ...THEME_GARDENS.map((g) => g.name),
  ];
  return {
    '@context': 'https://schema.org',
    '@type': 'Residence',
    '@id': absolute('/#project'),
    name: PROJECT.name,
    url: SITE_URL,
    description: PROJECT.pitch,
    image: absolute(OG_IMAGE),
    address: postalAddress,
    numberOfRooms: undefined,
    amenityFeature: amenities.map((label) => ({
      '@type': 'LocationFeatureSpecification',
      name: label,
      value: true,
    })),
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: absolute(t.path),
    })),
  };
}

export function imageGalleryJsonLd(count: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    '@id': absolute('/gallery#gallery'),
    name: `${PROJECT.name} — Photo Gallery`,
    description: `${count} photographs of ${PROJECT.name}, ${PROJECT.locality}, ${PROJECT.city}.`,
    url: absolute('/gallery'),
  };
}

/** Renders a JSON-LD block. Kept in one place so escaping is consistent. */
export const jsonLdScript = (data: unknown) => ({
  __html: JSON.stringify(data).replace(/</g, '\\u003c'),
});
