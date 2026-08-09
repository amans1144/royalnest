'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GALLERY_CATEGORIES, type GalleryCategory } from '@spb/types';
import { X } from './icons';
import { useGallery } from '../lib/use-gallery';

type Filter = GalleryCategory | 'All';

export function GalleryBrowser() {
  const { images } = useGallery();
  const [filter, setFilter] = useState<Filter>('All');
  const [index, setIndex] = useState<number | null>(null);

  const items = useMemo(
    () => (filter === 'All' ? images : images.filter((g) => g.category === filter)),
    [filter, images],
  );

  const open = items[index ?? -1] ?? null;

  const step = useCallback(
    (delta: number) => setIndex((i) => (i === null ? null : (i + delta + items.length) % items.length)),
    [items.length],
  );

  // Keyboard navigation for the lightbox.
  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIndex(null);
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, step]);

  const counts: Record<Filter, number> = useMemo(() => {
    const c = { All: images.length } as Record<Filter, number>;
    for (const cat of GALLERY_CATEGORIES) c[cat] = images.filter((g) => g.category === cat).length;
    return c;
  }, [images]);

  // Categories with nothing in them are hidden rather than shown as empty chips.
  const shownCategories = useMemo(
    () => GALLERY_CATEGORIES.filter((c) => counts[c] > 0),
    [counts],
  );

  return (
    <>
      {/* ── Filters ── */}
      <div className="sticky top-16 z-30 -mx-5 mb-10 bg-background/85 px-5 py-4 backdrop-blur-xl sm:-mx-8 sm:px-8">
        <div className="flex flex-wrap justify-center gap-2.5">
          {(['All', ...shownCategories] as Filter[]).map((c) => (
            <button
              key={c}
              onClick={() => {
                setFilter(c);
                setIndex(null);
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                filter === c
                  ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-accent'
              }`}
            >
              {c}
              <span
                className={`rounded-full px-1.5 text-[0.65rem] font-semibold ${
                  filter === c ? 'bg-black/15' : 'bg-muted text-muted-foreground'
                }`}
              >
                {counts[c]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Masonry-ish grid ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((g, i) => (
          <motion.figure
            key={`${filter}-${g.id}`}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.04 }}
            onClick={() => setIndex(i)}
            className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-2xl bg-muted"
          >
            <img
              src={g.src}
              alt={g.label}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <figcaption className="absolute inset-0 flex flex-col items-start justify-end bg-gradient-to-t from-navy/85 via-navy/10 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
                {g.category}
              </span>
              <span className="text-sm font-medium text-white">{g.label}</span>
            </figcaption>
          </motion.figure>
        ))}
      </div>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/95 p-4 backdrop-blur-sm"
            onClick={() => setIndex(null)}
          >
            <button
              onClick={() => setIndex(null)}
              aria-label="Close"
              className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X width={20} height={20} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label="Previous"
              className="absolute left-3 grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/10 text-2xl text-white transition-colors hover:bg-white/20 sm:left-8"
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label="Next"
              className="absolute right-3 grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-white/10 text-2xl text-white transition-colors hover:bg-white/20 sm:right-8"
            >
              ›
            </button>

            <motion.figure
              key={open.src}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full w-full max-w-5xl"
            >
              <img
                src={open.src.replace('w=1200', 'w=1800')}
                alt={open.label}
                className="mx-auto max-h-[78vh] w-auto rounded-2xl object-contain shadow-2xl"
              />
              <figcaption className="mt-4 text-center">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  {open.category}
                </div>
                <div className="mt-1 font-display text-xl text-white">{open.label}</div>
                <div className="mt-1 text-sm text-white/50">
                  {(index ?? 0) + 1} / {items.length}
                </div>
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
