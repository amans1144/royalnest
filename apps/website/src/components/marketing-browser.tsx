'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MARKETING_CATEGORIES,
  MARKETING_KINDS,
  MARKETING_KIND_LABEL,
  marketingPoster,
  videoEmbedUrl,
  type MarketingCategory,
  type MarketingItem,
  type MarketingKind,
} from '@spb/types';
import { Download, Film, FileText, ImageIcon, Play, X, ArrowUpRight } from './icons';
import { useMarketing } from '../lib/use-marketing';

type KindFilter = MarketingKind | 'All';
type CategoryFilter = MarketingCategory | 'All';

const KIND_ICON: Record<MarketingKind, typeof FileText> = {
  image: ImageIcon,
  pdf: FileText,
  video: Film,
};

/** Tile tint per kind — keeps documents and videos distinguishable at a glance
 *  even before their poster (if any) loads. */
const KIND_TILE: Record<MarketingKind, string> = {
  image: 'from-slate-500/20 to-slate-700/30',
  pdf: 'from-primary/25 to-[hsl(var(--forest))]/25',
  video: 'from-navy/40 to-primary/25',
};

const isData = (u: string) => u.startsWith('data:');

/** A sensible download filename, derived from the title plus the real extension. */
function fileName(item: MarketingItem): string {
  const slug =
    item.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'royalnest-material';
  const ext = isData(item.url)
    ? item.url.match(/^data:[\w.+-]+\/([\w.+-]+);/i)?.[1]
    : item.url.split(/[?#]/)[0]?.match(/\.([a-z0-9]{2,5})$/i)?.[1];
  const fallback = item.kind === 'pdf' ? 'pdf' : item.kind === 'video' ? 'mp4' : 'jpg';
  return `${slug}.${(ext ?? fallback).toLowerCase()}`;
}

export function MarketingBrowser() {
  const { items, loaded } = useMarketing();
  const [kind, setKind] = useState<KindFilter>('All');
  const [category, setCategory] = useState<CategoryFilter>('All');
  const [openId, setOpenId] = useState<string | null>(null);

  /* ── Derived filter state ──────────────────────────────────────────────
     Everything below is computed, never stored: when the admin publishes a
     new set the filters re-derive instead of pointing at something gone. */

  const byKind = useMemo(
    () => (kind === 'All' ? items : items.filter((i) => i.kind === kind)),
    [items, kind],
  );

  const shownKinds = useMemo(
    () => MARKETING_KINDS.filter((k) => items.some((i) => i.kind === k)),
    [items],
  );

  const shownCategories = useMemo(
    () => MARKETING_CATEGORIES.filter((c) => byKind.some((i) => i.category === c)),
    [byKind],
  );

  // A category that no longer exists under the active kind falls back to "All"
  // rather than showing an empty grid.
  const activeCategory: CategoryFilter =
    category !== 'All' && shownCategories.includes(category) ? category : 'All';

  const shown = useMemo(
    () =>
      activeCategory === 'All' ? byKind : byKind.filter((i) => i.category === activeCategory),
    [byKind, activeCategory],
  );

  /* ── Lightbox ─────────────────────────────────────────────────────────── */

  // Only pictures and videos open in the overlay; documents open in a new tab.
  const viewable = useMemo(() => shown.filter((i) => i.kind !== 'pdf'), [shown]);
  const openIndex = viewable.findIndex((i) => i.id === openId);
  const open = openIndex >= 0 ? viewable[openIndex] : null;

  const step = useCallback(
    (delta: number) => {
      if (viewable.length < 2 || openIndex < 0) return;
      const next = viewable[(openIndex + delta + viewable.length) % viewable.length];
      if (next) setOpenId(next.id);
    },
    [openIndex, viewable],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, step]);

  const chip = (active: boolean) =>
    `inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all ${
      active
        ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
        : 'border-border bg-card hover:border-primary/40 hover:bg-accent'
    }`;

  const count = (n: number, active: boolean) => (
    <span
      className={`rounded-full px-1.5 text-[0.65rem] font-semibold ${
        active ? 'bg-black/15' : 'bg-muted text-muted-foreground'
      }`}
    >
      {n}
    </span>
  );

  /* ── Loading ──────────────────────────────────────────────────────────── */

  if (!loaded) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="aspect-[16/10] animate-pulse bg-muted" />
            <div className="space-y-2.5 p-5">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ── Empty ────────────────────────────────────────────────────────────── */

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center sm:px-10 sm:py-20">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <FileText width={28} height={28} />
        </div>
        <h2 className="mt-5 font-display text-2xl font-bold">Material coming soon</h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Brochures, price lists, site plans and walkthrough videos are being finalised. Call us
          and we&apos;ll send the latest set across on WhatsApp right away.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Filters ── */}
      <div className="sticky top-16 z-30 -mx-5 mb-10 bg-background/85 px-5 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8">
        {shownKinds.length > 1 && (
          <div className="mb-3 flex flex-wrap justify-center gap-2.5">
            <button onClick={() => setKind('All')} className={chip(kind === 'All')}>
              Everything {count(items.length, kind === 'All')}
            </button>
            {shownKinds.map((k) => {
              const Icon = KIND_ICON[k];
              const active = kind === k;
              return (
                <button key={k} onClick={() => setKind(k)} className={chip(active)}>
                  <Icon width={15} height={15} />
                  {MARKETING_KIND_LABEL[k]}s
                  {count(items.filter((i) => i.kind === k).length, active)}
                </button>
              );
            })}
          </div>
        )}

        {shownCategories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setCategory('All')}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                activeCategory === 'All'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-accent'
              }`}
            >
              All
            </button>
            {shownCategories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                  activeCategory === c
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Cards ── */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((item, i) => {
          const Icon = KIND_ICON[item.kind];
          const poster = marketingPoster(item);
          const openable = item.kind !== 'pdf' || !isData(item.url);

          return (
            <motion.article
              key={`${kind}-${activeCategory}-${item.id}`}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.04 }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-xl"
            >
              {/* Preview tile */}
              {item.kind === 'pdf' && isData(item.url) ? (
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  <Tile poster={poster} kind={item.kind} Icon={Icon} />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    item.kind === 'pdf'
                      ? window.open(item.url, '_blank', 'noopener,noreferrer')
                      : setOpenId(item.id)
                  }
                  aria-label={`${item.kind === 'pdf' ? 'Open' : 'View'} ${item.title}`}
                  className="relative aspect-[16/10] w-full cursor-pointer overflow-hidden bg-muted"
                >
                  <Tile poster={poster} kind={item.kind} Icon={Icon} hoverable />
                  {item.kind === 'video' && (
                    <span className="absolute inset-0 grid place-items-center">
                      <span className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-navy shadow-xl transition-transform duration-300 group-hover:scale-110">
                        <Play width={22} height={22} />
                      </span>
                    </span>
                  )}
                </button>
              )}

              {/* Body */}
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-primary">
                    <Icon width={12} height={12} />
                    {MARKETING_KIND_LABEL[item.kind]}
                  </span>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.category}
                  </span>
                </div>

                <h3 className="mt-2.5 font-display text-lg font-semibold leading-snug">
                  {item.title}
                </h3>
                {item.description && (
                  <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                  {item.kind === 'video' ? (
                    <button
                      type="button"
                      onClick={() => setOpenId(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      <Play width={14} height={14} /> Play
                    </button>
                  ) : item.kind === 'image' ? (
                    <button
                      type="button"
                      onClick={() => setOpenId(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      <ImageIcon width={14} height={14} /> View
                    </button>
                  ) : (
                    openable && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        <FileText width={14} height={14} /> Open PDF
                      </a>
                    )
                  )}

                  <a
                    href={item.url}
                    download={fileName(item)}
                    target={isData(item.url) ? undefined : '_blank'}
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-accent"
                  >
                    <Download width={14} height={14} /> Download
                  </a>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      {shown.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card px-8 py-14 text-center text-sm text-muted-foreground">
          Nothing here yet — try another filter.
        </div>
      )}

      {/* ── Viewer ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/95 p-4 backdrop-blur-sm"
            onClick={() => setOpenId(null)}
            role="dialog"
            aria-modal="true"
            aria-label={open.title}
          >
            <button
              onClick={() => setOpenId(null)}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X width={20} height={20} />
            </button>

            {viewable.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                  aria-label="Previous"
                  className="absolute left-2 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 text-2xl text-white transition-colors hover:bg-white/20 sm:left-6 sm:h-12 sm:w-12"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                  aria-label="Next"
                  className="absolute right-2 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 text-2xl text-white transition-colors hover:bg-white/20 sm:right-6 sm:h-12 sm:w-12"
                >
                  ›
                </button>
              </>
            )}

            <motion.figure
              key={open.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl px-2 sm:px-12"
            >
              {open.kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={open.url}
                  alt={open.title}
                  className="mx-auto max-h-[70vh] w-auto rounded-2xl object-contain shadow-2xl"
                />
              ) : (
                <VideoFrame item={open} />
              )}

              <figcaption className="mt-4 text-center">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {open.category}
                </div>
                <div className="mt-1 font-display text-xl text-white">{open.title}</div>
                {open.description && (
                  <p className="mx-auto mt-1.5 max-w-xl text-sm text-white/60">
                    {open.description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-center gap-3">
                  <a
                    href={open.url}
                    download={fileName(open)}
                    target={isData(open.url) ? undefined : '_blank'}
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-primary"
                  >
                    <Download width={14} height={14} /> Download
                  </a>
                  {!isData(open.url) && (
                    <a
                      href={open.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 text-sm text-white/70 transition-colors hover:text-primary"
                    >
                      Open original <ArrowUpRight width={14} height={14} />
                    </a>
                  )}
                </div>
                {viewable.length > 1 && (
                  <div className="mt-2 text-sm text-white/40">
                    {openIndex + 1} / {viewable.length}
                  </div>
                )}
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Card preview surface: the poster when there is one, else a tinted tile. */
function Tile({
  poster,
  kind,
  Icon,
  hoverable = false,
}: {
  poster: string | null;
  kind: MarketingKind;
  Icon: typeof FileText;
  hoverable?: boolean;
}) {
  if (poster) {
    // YouTube's hqdefault still is 4:3 with baked-in letterbox bars; a 1.1×
    // base scale pushes them out of the 16:10 tile exactly.
    const zoom =
      kind === 'image'
        ? hoverable
          ? 'group-hover:scale-105'
          : ''
        : `scale-110 ${hoverable ? 'group-hover:scale-[1.15]' : ''}`;
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster}
          alt=""
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-500 ${zoom}`}
        />
        {kind !== 'image' && <span className="absolute inset-0 bg-navy/25" />}
      </>
    );
  }
  return (
    <span
      className={`absolute inset-0 grid place-items-center bg-gradient-to-br ${KIND_TILE[kind]}`}
    >
      <Icon width={44} height={44} className="text-foreground/45" />
    </span>
  );
}

/** YouTube / Vimeo get an embed; anything else is played as a plain file. */
function VideoFrame({ item }: { item: MarketingItem }) {
  const embed = videoEmbedUrl(item.url);
  if (embed) {
    return (
      <div className="mx-auto aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-2xl">
        <iframe
          src={embed}
          title={item.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    );
  }
  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      src={item.url}
      poster={item.thumbnail}
      controls
      autoPlay
      playsInline
      className="mx-auto max-h-[70vh] w-full rounded-2xl bg-black shadow-2xl"
    />
  );
}
