'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { backgroundVideoEmbedUrl, resolveHeroBackground } from '@spb/types';
import { PROJECT } from '../lib/site-data';
import { useSiteSettings } from '../lib/use-site-settings';

/**
 * The hero's full-screen backdrop.
 *
 * The built-in entrance-gate render is painted immediately (it ships with the
 * site, so it's there on the very first frame and during SSR). Whatever the
 * admin has published in Settings then fades in over the top. That ordering is
 * deliberate: the hero is never blank, never black, and never depends on the
 * settings request succeeding.
 *
 * A video always keeps its poster underneath, so a browser that refuses to
 * autoplay — or a visitor who has asked for reduced motion — still sees a
 * complete hero rather than an empty box.
 */
export function HeroBackground() {
  const { settings, loaded } = useSiteSettings();
  const bg = resolveHeroBackground(settings);
  const [reduceMotion, setReduceMotion] = useState(false);

  /**
   * Which source has finished loading, rather than a plain "ready" flag. An
   * effect that resets a boolean on source change loses a race with data: URIs
   * and cached files, whose load event can fire before the effect runs — the
   * media then sits at opacity 0 forever. Comparing against the current source
   * makes a stale ready state impossible to express.
   *
   * The image and the video track separately so that a video still buffering
   * can't pull its own poster out from underneath itself.
   */
  const [imageReadyFor, setImageReadyFor] = useState<string | null>(null);
  const [videoReadyFor, setVideoReadyFor] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const embed = bg.video ? backgroundVideoEmbedUrl(bg.video) : null;
  const showVideo = bg.kind === 'video' && !reduceMotion;
  const imageReady = !!bg.image && imageReadyFor === bg.image;
  const videoReady = !!bg.video && videoReadyFor === bg.video;

  /** An image that decoded before React attached onLoad is already complete. */
  const imageRef = (el: HTMLImageElement | null) => {
    if (el?.complete && el.naturalWidth > 0 && bg.image) setImageReadyFor(bg.image);
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base layer — always present. */}
      <Image
        src="/liberty-imperial-greens-gate.jpg"
        alt={`Monument entrance gate at ${PROJECT.name}, ${PROJECT.city}`}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Admin image (or a video's poster) layered over the default. */}
      {loaded && bg.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={bg.image}
          ref={imageRef}
          src={bg.image}
          alt=""
          aria-hidden
          onLoad={() => setImageReadyFor(bg.image)}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
            imageReady ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Video layer. Sized to cover rather than fit, so it fills the viewport
          at any aspect ratio the same way object-cover would. */}
      {loaded && showVideo && bg.video && (
        <div className="pointer-events-none absolute inset-0">
          {embed ? (
            // scale-[1.35] is what keeps this looking like a backdrop rather
            // than an embed: YouTube still paints its title over the top edge
            // and a "More videos" panel at the bottom, and no player parameter
            // reliably suppresses them. Zooming past the frame pushes both out
            // of view. Paired with pointer-events-none so the hero can never be
            // clicked through to YouTube.
            <iframe
              src={embed}
              title=""
              aria-hidden
              tabIndex={-1}
              allow="autoplay; encrypted-media; picture-in-picture"
              onLoad={() => setVideoReadyFor(bg.video)}
              className={`absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 scale-[1.35] border-0 transition-opacity duration-700 ${
                videoReady ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ) : (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <video
              src={bg.video}
              poster={bg.image ?? undefined}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden
              onCanPlay={() => setVideoReadyFor(bg.video)}
              className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
                videoReady ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </div>
      )}

      {/* Readability washes — the flat dim is admin-tunable because a bright
          video needs more of it than the gate render does. Large screens keep
          the two-thirds lighter treatment the hero has always used: there the
          copy sits on its own glass panel and doesn't need the whole backdrop
          dimmed. At the default setting that is the original 30% / 20%. */}
      <div
        className="absolute inset-0 bg-navy transition-opacity duration-500 lg:hidden"
        style={{ opacity: bg.overlay / 100 }}
      />
      <div
        className="absolute inset-0 hidden bg-navy transition-opacity duration-500 lg:block"
        style={{ opacity: (bg.overlay * 2) / 300 }}
      />
      {/* Strong but short band at the top so the transparent navbar stays
          legible over bright sky, clearing quickly so the media isn't dimmed. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, hsl(var(--navy)/0.72) 0%, hsl(var(--navy)/0.28) 14%, hsl(var(--navy)/0) 34%, hsl(var(--navy)/0) 62%, hsl(var(--navy)/0.55) 100%)',
        }}
      />
    </div>
  );
}
