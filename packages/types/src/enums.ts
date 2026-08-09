/**
 * Domain enums — mirror the Prisma enums exactly.
 * Single source of truth shared by API (validation) and frontend (typing/UI).
 */

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SALES_MANAGER: 'SALES_MANAGER',
  EXECUTIVE: 'EXECUTIVE',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
  CUSTOMER: 'CUSTOMER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Staff roles ordered by privilege (index = rank). Used by RBAC helpers. */
export const STAFF_ROLE_RANK: UserRole[] = [
  UserRole.VIEWER,
  UserRole.EDITOR,
  UserRole.EXECUTIVE,
  UserRole.SALES_MANAGER,
  UserRole.SUPER_ADMIN,
];

export const ProjectType = {
  RESIDENTIAL: 'RESIDENTIAL',
  COMMERCIAL: 'COMMERCIAL',
  PLOTTED: 'PLOTTED',
  VILLA: 'VILLA',
  MIXED_USE: 'MIXED_USE',
} as const;
export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];

export const ProjectStatus = {
  DRAFT: 'DRAFT',
  UPCOMING: 'UPCOMING',
  ONGOING: 'ONGOING',
  READY_TO_MOVE: 'READY_TO_MOVE',
  COMPLETED: 'COMPLETED',
  SOLD_OUT: 'SOLD_OUT',
  ARCHIVED: 'ARCHIVED',
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const PlotStatus = {
  AVAILABLE: 'AVAILABLE',
  RESERVED: 'RESERVED',
  BOOKED: 'BOOKED',
  SOLD: 'SOLD',
  BLOCKED: 'BLOCKED',
} as const;
export type PlotStatus = (typeof PlotStatus)[keyof typeof PlotStatus];

/** Live availability colors — the single source enforced across editor, viewer, legend. */
export const PLOT_STATUS_COLOR: Record<PlotStatus, string> = {
  AVAILABLE: '#22c55e', // green
  BOOKED: '#3b82f6', // blue
  RESERVED: '#eab308', // yellow
  SOLD: '#ef4444', // red
  BLOCKED: '#9ca3af', // gray
};

export const PLOT_STATUS_LABEL: Record<PlotStatus, string> = {
  AVAILABLE: 'Available',
  BOOKED: 'Booked',
  RESERVED: 'Reserved',
  SOLD: 'Sold',
  BLOCKED: 'Blocked',
};

/**
 * Preferential Location Charges. A plot may carry any combination; each ticked
 * charge adds its percentage of the base price, and they stack additively.
 * Rates follow the Liberty Imperial Greens price list.
 */
export const PLC_CHARGES = [
  { key: 'parkFacing', label: 'Park Facing / Adjacent', short: 'Park', note: 'Corner, park facing or park adjacent', pct: 10 },
  { key: 'corner', label: 'Corner Plot', short: 'Corner', note: 'Plot on a corner junction', pct: 10 },
  { key: 'wideRoad', label: 'Wide Road', short: 'Wide Rd', note: '45–40 Ft. or double side road', pct: 5 },
] as const;

export type PlcKey = (typeof PLC_CHARGES)[number]['key'];

/** The PLC flags carried on a plot. All optional so pre-PLC layouts still load. */
export type PlcFlags = Partial<Record<PlcKey, boolean>>;

/** Combined PLC percentage for a plot (e.g. corner + park facing = 20). */
export function plcPercent(plot: PlcFlags): number {
  return PLC_CHARGES.reduce((sum, c) => (plot[c.key] ? sum + c.pct : sum), 0);
}

/** Rupee value of the PLC uplift on a base price. */
export function plcAmount(basePrice: number, plot: PlcFlags): number {
  return Math.round((basePrice * plcPercent(plot)) / 100);
}

/** Base price plus every applicable PLC. */
export function priceWithPlc(basePrice: number, plot: PlcFlags): number {
  return basePrice + plcAmount(basePrice, plot);
}

/** The charges actually applied to a plot — for breakdown UI. */
export function appliedPlc(plot: PlcFlags) {
  return PLC_CHARGES.filter((c) => plot[c.key]);
}

/* ── Gallery ────────────────────────────────────────────────────────────── */

/** Categories the public gallery page filters by. Shared so the admin's
 *  uploader and the website's gallery can never disagree. */
export const GALLERY_CATEGORIES = [
  'Township',
  'Amenities',
  'Gardens',
  'Sports',
  'Club Imperial',
] as const;

export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number];

export interface GalleryImage {
  id: string;
  /** Absolute URL or a self-contained data: URI produced by the uploader. */
  src: string;
  label: string;
  category: GalleryCategory;
}

export const isGalleryCategory = (v: unknown): v is GalleryCategory =>
  typeof v === 'string' && (GALLERY_CATEGORIES as readonly string[]).includes(v);

/* ── Marketing material ─────────────────────────────────────────────────── */

/** Categories the public /marketing page filters by. Shared so the admin's
 *  uploader and the website can never disagree. */
export const MARKETING_CATEGORIES = [
  'Brochures',
  'Price List',
  'Site Plan',
  'Walkthrough',
  'Presentations',
  'Legal & RERA',
  'Print & Ads',
  'Other',
] as const;

export type MarketingCategory = (typeof MARKETING_CATEGORIES)[number];

/** The three shapes an asset can take: a picture, a document, or a video. */
export const MARKETING_KINDS = ['image', 'pdf', 'video'] as const;
export type MarketingKind = (typeof MARKETING_KINDS)[number];

export const MARKETING_KIND_LABEL: Record<MarketingKind, string> = {
  image: 'Image',
  pdf: 'PDF',
  video: 'Video',
};

export interface MarketingItem {
  id: string;
  kind: MarketingKind;
  /** Absolute http(s) URL, or a self-contained data: URI from the uploader. */
  url: string;
  title: string;
  description: string;
  category: MarketingCategory;
  /** Optional poster image for videos and documents. */
  thumbnail?: string;
}

export const isMarketingCategory = (v: unknown): v is MarketingCategory =>
  typeof v === 'string' && (MARKETING_CATEGORIES as readonly string[]).includes(v);

export const isMarketingKind = (v: unknown): v is MarketingKind =>
  typeof v === 'string' && (MARKETING_KINDS as readonly string[]).includes(v);

/**
 * Only real http(s) links and the base64 media data: URIs our own uploader
 * produces are ever stored or rendered — the one guard that stops a pasted
 * `javascript:` (or `data:text/html`) URL becoming a live link on the site.
 * Parsed rather than pattern-matched, so `https://javascript:alert(1)` and
 * other malformed addresses are rejected too.
 */
export function isSafeMediaUrl(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  const s = v.trim();
  if (!s) return false;
  if (/^data:(image\/[\w.+-]+|video\/[\w.+-]+|application\/pdf);base64,/i.test(s)) return true;
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    // A bare word like "javascript" is not an address anyone meant to publish.
    return u.hostname === 'localhost' || u.hostname.includes('.');
  } catch {
    return false;
  }
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i;
const VIDEO_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i;

/** YouTube id from any of watch / youtu.be / embed / shorts / live URLs. */
export function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/i,
  );
  return m?.[1] ?? null;
}

export function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d{6,})/i);
  return m?.[1] ?? null;
}

/** Player URL for an embeddable host, or null when it's a plain video file. */
export function videoEmbedUrl(url: string): string | null {
  const yt = youtubeId(url);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt}?rel=0&autoplay=1`;
  const vm = vimeoId(url);
  if (vm) return `https://player.vimeo.com/video/${vm}?autoplay=1`;
  return null;
}

/** Best-effort card poster: an explicit thumbnail, the image itself, or the
 *  YouTube still. Null means "draw the placeholder tile instead". */
export function marketingPoster(item: MarketingItem): string | null {
  if (item.thumbnail && isSafeMediaUrl(item.thumbnail)) return item.thumbnail.trim();
  if (item.kind === 'image') return item.url;
  const yt = youtubeId(item.url);
  return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null;
}

/** Photo CDNs that serve images from extension-less URLs. */
const IMAGE_HOST =
  /^(images\.unsplash\.com|i\.imgur\.com|images\.pexels\.com|cdn\.pixabay\.com|res\.cloudinary\.com|lh3\.googleusercontent\.com)$/i;

/** Guess what a pasted URL points at so the admin form can pre-fill the kind.
 *  Unknown links (Drive, Dropbox, …) are almost always documents. The admin can
 *  always correct it with the Type dropdown. */
export function detectMarketingKind(url: string): MarketingKind {
  const s = url.trim();
  if (/^data:application\/pdf/i.test(s) || /\.pdf(\?|#|$)/i.test(s)) return 'pdf';
  if (/^data:video\//i.test(s) || VIDEO_EXT.test(s) || youtubeId(s) || vimeoId(s)) return 'video';
  if (/^data:image\//i.test(s) || IMAGE_EXT.test(s)) return 'image';
  try {
    if (IMAGE_HOST.test(new URL(s).hostname)) return 'image';
  } catch {
    /* not parseable yet — the user is probably still typing */
  }
  return 'pdf';
}

/* ── Site settings ──────────────────────────────────────────────────────── */

/** What the homepage hero paints behind its copy. */
export const HERO_MEDIA_TYPES = ['default', 'image', 'video'] as const;
export type HeroMediaType = (typeof HERO_MEDIA_TYPES)[number];

export const isHeroMediaType = (v: unknown): v is HeroMediaType =>
  typeof v === 'string' && (HERO_MEDIA_TYPES as readonly string[]).includes(v);

/** Overlay dim is clamped — past this the hero photo stops reading as a photo. */
export const HERO_OVERLAY_MAX = 80;
export const HERO_OVERLAY_DEFAULT = 30;

export const clampHeroOverlay = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return HERO_OVERLAY_DEFAULT;
  return Math.min(HERO_OVERLAY_MAX, Math.max(0, Math.round(n)));
};

/**
 * Background player URL for an embeddable host: muted, looping, chrome-free.
 * Null means the URL is a plain video file, played with a <video> element.
 */
export function backgroundVideoEmbedUrl(url: string): string | null {
  const yt = youtubeId(url);
  if (yt) {
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      loop: '1',
      playlist: yt, // a single-video loop needs itself as the playlist
      controls: '0',
      modestbranding: '1',
      rel: '0',
      playsinline: '1',
      disablekb: '1',
      fs: '0',
      iv_load_policy: '3',
    });
    return `https://www.youtube-nocookie.com/embed/${yt}?${params.toString()}`;
  }
  const vm = vimeoId(url);
  if (vm) return `https://player.vimeo.com/video/${vm}?background=1&autoplay=1&loop=1&muted=1&autopause=0`;
  return null;
}

/** Analytics + SEO settings the admin publishes to the public site. */
export interface SiteSettings {
  /** GA4 measurement ID, e.g. G-XXXXXXXXXX */
  gaMeasurementId: string;
  /** Google Tag Manager container, e.g. GTM-XXXXXXX */
  gtmId: string;
  /** google-site-verification token (Search Console) */
  googleSiteVerification: string;
  /** Meta/Facebook domain verification token */
  facebookDomainVerification: string;
  /** Optional SEO overrides — blank means "use the built-in defaults". */
  metaTitle: string;
  metaDescription: string;

  /* ── Homepage hero background ──────────────────────────────────────────
     'default' keeps the built-in entrance-gate render. 'image' and 'video'
     take over the full-screen backdrop; the poster is what paints while a
     video buffers, and whenever autoplay is refused or motion is reduced. */
  heroMediaType: HeroMediaType;
  /** Uploaded data: URI or a hosted image URL. */
  heroImageUrl: string;
  /** YouTube / Vimeo link, or a direct .mp4 / .webm URL. */
  heroVideoUrl: string;
  heroPosterUrl: string;
  /** Percentage of navy wash over the media, 0–80. */
  heroOverlay: number;

  updatedAt: string | null;
}

export const EMPTY_SITE_SETTINGS: SiteSettings = {
  gaMeasurementId: '',
  gtmId: '',
  googleSiteVerification: '',
  facebookDomainVerification: '',
  metaTitle: '',
  metaDescription: '',
  heroMediaType: 'default',
  heroImageUrl: '',
  heroVideoUrl: '',
  heroPosterUrl: '',
  heroOverlay: HERO_OVERLAY_DEFAULT,
  updatedAt: null,
};

/**
 * What the hero should actually paint, resolved from the saved settings.
 * Falls back to the built-in render whenever the chosen source is missing or
 * unusable, so the hero is never blank.
 */
export function resolveHeroBackground(s: Partial<SiteSettings> | null | undefined): {
  kind: 'default' | 'image' | 'video';
  image: string | null;
  video: string | null;
  overlay: number;
} {
  const overlay = clampHeroOverlay(s?.heroOverlay ?? HERO_OVERLAY_DEFAULT);
  const image = isSafeMediaUrl(s?.heroImageUrl) ? s!.heroImageUrl!.trim() : null;
  const poster = isSafeMediaUrl(s?.heroPosterUrl) ? s!.heroPosterUrl!.trim() : null;
  const video = isSafeMediaUrl(s?.heroVideoUrl) ? s!.heroVideoUrl!.trim() : null;
  const type = isHeroMediaType(s?.heroMediaType) ? s!.heroMediaType! : 'default';

  if (type === 'video' && video) return { kind: 'video', image: poster ?? image, video, overlay };
  if (type === 'image' && image) return { kind: 'image', image, video: null, overlay };
  return { kind: 'default', image: null, video: null, overlay };
}

/** GA4 IDs look like G-XXXXXXXXXX; GTM containers like GTM-XXXXXXX. */
export const isGaMeasurementId = (v: string) => /^G-[A-Z0-9]{4,}$/i.test(v.trim());
export const isGtmContainerId = (v: string) => /^GTM-[A-Z0-9]{4,}$/i.test(v.trim());

export const PlotFacing = {
  NORTH: 'NORTH',
  SOUTH: 'SOUTH',
  EAST: 'EAST',
  WEST: 'WEST',
  NORTH_EAST: 'NORTH_EAST',
  NORTH_WEST: 'NORTH_WEST',
  SOUTH_EAST: 'SOUTH_EAST',
  SOUTH_WEST: 'SOUTH_WEST',
} as const;
export type PlotFacing = (typeof PlotFacing)[keyof typeof PlotFacing];

export const AreaUnit = {
  SQ_FT: 'SQ_FT',
  SQ_YARD: 'SQ_YARD',
  SQ_METER: 'SQ_METER',
  ACRE: 'ACRE',
  HECTARE: 'HECTARE',
  MARLA: 'MARLA',
  KANAL: 'KANAL',
} as const;
export type AreaUnit = (typeof AreaUnit)[keyof typeof AreaUnit];

export const LeadSource = {
  WEBSITE: 'WEBSITE',
  WHATSAPP: 'WHATSAPP',
  PHONE: 'PHONE',
  EMAIL: 'EMAIL',
  FACEBOOK: 'FACEBOOK',
  GOOGLE_ADS: 'GOOGLE_ADS',
  REFERRAL: 'REFERRAL',
  WALK_IN: 'WALK_IN',
  OTHER: 'OTHER',
} as const;
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const LeadStatus = {
  NEW: 'NEW',
  CONTACTED: 'CONTACTED',
  QUALIFIED: 'QUALIFIED',
  SITE_VISIT_SCHEDULED: 'SITE_VISIT_SCHEDULED',
  SITE_VISIT_DONE: 'SITE_VISIT_DONE',
  NEGOTIATION: 'NEGOTIATION',
  WON: 'WON',
  LOST: 'LOST',
  DUPLICATE: 'DUPLICATE',
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const LeadPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
export type LeadPriority = (typeof LeadPriority)[keyof typeof LeadPriority];

export const BookingStatus = {
  DRAFT: 'DRAFT',
  RESERVED: 'RESERVED',
  CONFIRMED: 'CONFIRMED',
  AGREEMENT_SIGNED: 'AGREEMENT_SIGNED',
  REGISTERED: 'REGISTERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const NotificationChannel = {
  IN_APP: 'IN_APP',
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  WHATSAPP: 'WHATSAPP',
  PUSH: 'PUSH',
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];
