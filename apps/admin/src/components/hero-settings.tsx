'use client';

import { useRef, useState } from 'react';
import {
  HERO_MEDIA_TYPES,
  HERO_OVERLAY_MAX,
  backgroundVideoEmbedUrl,
  clampHeroOverlay,
  resolveHeroBackground,
  type HeroMediaType,
  type SiteSettings,
} from '@spb/types';
import { Field, fieldCls } from './modal';
import { Film, Image as ImageIcon, Trash } from './icons';
import { compressImage, formatBytes } from '../lib/gallery';
import { normaliseUrl } from '../lib/marketing';

/** Full-screen backdrop, so it keeps more detail than a gallery thumbnail. */
const HERO_MAX_EDGE = 1920;
const ACCEPT = 'image/png,image/jpeg,image/webp';

const TYPE_LABEL: Record<HeroMediaType, string> = {
  default: 'Built-in render',
  image: 'Image',
  video: 'Video',
};

const TYPE_HINT: Record<HeroMediaType, string> = {
  default: 'The entrance-gate photograph that ships with the site.',
  image: 'Your own photograph, shown full-screen behind the hero copy.',
  video: 'A YouTube, Vimeo or MP4 link, played muted and looping full-screen.',
};

export function HeroSettings({
  form,
  set,
  flash,
}: {
  form: SiteSettings;
  set: <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => void;
  flash: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const bg = resolveHeroBackground(form);
  const embed = form.heroVideoUrl ? backgroundVideoEmbedUrl(form.heroVideoUrl) : null;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      flash('Pick a PNG, JPG or WebP image.');
      return;
    }
    setBusy(true);
    try {
      const { src, width, height } = await compressImage(file, HERO_MAX_EDGE);
      set('heroImageUrl', src);
      set('heroMediaType', 'image');
      flash(`Image ready — ${width}×${height}, ${formatBytes(src.length)}. Publish to go live.`);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'That file could not be read.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  /** URL fields are normalised on blur so typing isn't fought with. */
  const commitUrl = (key: 'heroImageUrl' | 'heroVideoUrl' | 'heroPosterUrl', raw: string) => {
    if (!raw.trim()) {
      set(key, '');
      return;
    }
    if (raw.startsWith('data:')) return; // an upload — already valid
    const { url, ok } = normaliseUrl(raw);
    if (!ok) {
      flash('That link does not look right — use a full https:// address.');
      return;
    }
    set(key, url);
  };

  const isUpload = form.heroImageUrl.startsWith('data:');

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-semibold">Hero background</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        What the homepage shows full-screen behind the headline. A video always keeps its poster
        underneath, so visitors whose browser blocks autoplay still see a complete hero.
      </p>

      {/* Source picker */}
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {HERO_MEDIA_TYPES.map((t) => {
          const active = form.heroMediaType === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => set('heroMediaType', t)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                active ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                    active ? 'border-primary' : 'border-muted-foreground/40'
                  }`}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-primary" />}
                </span>
                {TYPE_LABEL[t]}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">{TYPE_HINT[t]}</span>
            </button>
          );
        })}
      </div>

      {/* ── Image source ── */}
      {form.heroMediaType === 'image' && (
        <div className="mt-5 grid gap-4">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => upload(e.target.files?.[0])}
          />
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              upload(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/30'
            }`}
          >
            {busy ? (
              <p className="text-sm font-medium">Processing…</p>
            ) : (
              <>
                <p className="text-sm font-medium">Drop a photograph here, or click to browse</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  PNG · JPG · WebP — resized to {HERO_MAX_EDGE}px wide automatically. Landscape
                  shots at least 1600px wide look best.
                </p>
              </>
            )}
          </div>

          <Field label="…or paste an image URL">
            <input
              defaultValue={isUpload ? '' : form.heroImageUrl}
              key={form.heroImageUrl}
              onBlur={(e) => commitUrl('heroImageUrl', e.target.value)}
              placeholder={isUpload ? 'Using the uploaded image' : 'https://…'}
              className={fieldCls}
            />
          </Field>
        </div>
      )}

      {/* ── Video source ── */}
      {form.heroMediaType === 'video' && (
        <div className="mt-5 grid gap-4">
          <Field label="Video URL (YouTube, Vimeo or a direct .mp4 / .webm)">
            <input
              defaultValue={form.heroVideoUrl}
              key={form.heroVideoUrl}
              onBlur={(e) => commitUrl('heroVideoUrl', e.target.value)}
              placeholder="https://youtu.be/…"
              className={fieldCls}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              {form.heroVideoUrl
                ? embed
                  ? 'Embedded player — plays muted and loops automatically.'
                  : 'Direct video file — plays muted and loops automatically.'
                : 'Silent, looping drone or walkthrough footage works best.'}
            </span>
          </Field>

          <Field label="Poster image URL (shown while the video loads)">
            <input
              defaultValue={form.heroPosterUrl}
              key={form.heroPosterUrl}
              onBlur={(e) => commitUrl('heroPosterUrl', e.target.value)}
              placeholder="https://… (optional)"
              className={fieldCls}
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Optional but recommended — it&apos;s what visitors see if autoplay is blocked or
              they&apos;ve asked for reduced motion.
            </span>
          </Field>
        </div>
      )}

      {/* ── Overlay ── */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Darkening overlay</span>
          <span className="text-xs font-semibold">{form.heroOverlay}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={HERO_OVERLAY_MAX}
          step={5}
          value={form.heroOverlay}
          onChange={(e) => set('heroOverlay', clampHeroOverlay(e.target.value))}
          aria-label="Darkening overlay"
          className="mt-2 w-full accent-primary"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          More darkening makes the headline easier to read over bright footage. Large screens use a
          third less, since the copy there sits on its own glass panel.
        </p>
      </div>

      {/* ── Preview ── */}
      <div className="mt-5">
        <span className="text-xs font-medium text-muted-foreground">Preview</span>
        <div className="relative mt-2 aspect-[16/7] overflow-hidden rounded-xl bg-muted">
          {bg.kind === 'default' ? (
            <span className="absolute inset-0 grid place-items-center bg-gradient-to-br from-navy/20 to-primary/20 text-center text-xs text-muted-foreground">
              Built-in entrance-gate render
            </span>
          ) : bg.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bg.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="absolute inset-0 grid place-items-center gap-2 bg-gradient-to-br from-navy/30 to-primary/20 text-muted-foreground">
              <Film width={28} height={28} />
            </span>
          )}
          <span className="absolute inset-0 bg-navy" style={{ opacity: bg.overlay / 100 }} />
          <span className="absolute inset-x-0 bottom-0 p-4">
            <span className="block rounded-lg border border-white/15 bg-navy/60 px-3 py-2 text-center font-semibold text-white backdrop-blur-md">
              Liberty Imperial Greens
            </span>
          </span>
          {bg.kind === 'video' && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[0.65rem] font-semibold uppercase text-white">
              <Film width={11} height={11} /> Video {embed ? 'embed' : 'file'}
            </span>
          )}
          {bg.kind === 'image' && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[0.65rem] font-semibold uppercase text-white">
              <ImageIcon width={11} height={11} /> {isUpload ? 'Uploaded' : 'Linked'}
            </span>
          )}
        </div>

        {bg.kind !== 'default' && (
          <button
            type="button"
            onClick={() => {
              set('heroMediaType', 'default');
              set('heroImageUrl', '');
              set('heroVideoUrl', '');
              set('heroPosterUrl', '');
              flash('Reverted to the built-in render — publish to apply.');
            }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-sm font-medium hover:bg-accent"
          >
            <Trash width={14} height={14} /> Reset to the built-in render
          </button>
        )}

        {form.heroMediaType !== 'default' && !bg.image && !bg.video && (
          <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-400">
            No {form.heroMediaType} source set yet — the site keeps showing the built-in render
            until you add one.
          </p>
        )}
      </div>
    </section>
  );
}
