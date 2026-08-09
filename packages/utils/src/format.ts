import type { AreaUnit } from '@spb/types';

const AREA_UNIT_LABEL: Record<AreaUnit, string> = {
  SQ_FT: 'sq.ft',
  SQ_YARD: 'sq.yd',
  SQ_METER: 'sq.m',
  ACRE: 'acre',
  HECTARE: 'ha',
  MARLA: 'marla',
  KANAL: 'kanal',
};

/**
 * Format an amount as Indian-style currency. Uses the compact Indian numbering
 * system (Lakh/Crore) for large values, which is what real-estate buyers expect.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  opts: { currency?: string; compact?: boolean; locale?: string } = {},
): string {
  const { currency = 'INR', compact = true, locale = 'en-IN' } = opts;
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (value == null || Number.isNaN(value)) return '—';

  if (compact && currency === 'INR') {
    if (value >= 1_00_00_000) return `₹${trim(value / 1_00_00_000)} Cr`;
    if (value >= 1_00_000) return `₹${trim(value / 1_00_000)} L`;
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function trim(n: number): string {
  return Number(n.toFixed(2)).toString();
}

export function formatArea(area: number | string, unit: AreaUnit): string {
  const value = typeof area === 'string' ? Number(area) : area;
  if (Number.isNaN(value)) return '—';
  return `${new Intl.NumberFormat('en-IN').format(value)} ${AREA_UNIT_LABEL[unit] ?? ''}`.trim();
}

export function formatNumber(n: number, locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale).format(n);
}

export function formatDate(
  date: Date | string | null | undefined,
  opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' },
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', opts).format(d);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function initials(firstName: string, lastName?: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
