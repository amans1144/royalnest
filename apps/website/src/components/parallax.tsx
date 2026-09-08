'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';

/**
 * Environmental parallax system.
 *
 * A <ParallaxScene> measures its own scroll progress; every <ParallaxLayer>
 * inside translates by a fraction of it, so layers drift at different speeds
 * and read as depth. Movement is deliberately small — this is architectural
 * atmosphere, not a game backdrop.
 *
 * Three things keep it cheap:
 *   · only `transform` is animated (framer-motion writes translate3d), never
 *     top/left/width/height, so nothing triggers layout
 *   · the scenery is inline SVG, not image files — a handful of paths instead
 *     of megabytes of PNG
 *   · movement scales down on small screens and switches off entirely under
 *     prefers-reduced-motion
 */

const SceneProgress = createContext<MotionValue<number> | null>(null);

/** True below Tailwind's `md`. SSR-safe: starts false, corrects on mount. */
function useIsCompact(): boolean {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  return compact;
}

export function ParallaxScene({
  children,
  className = '',
  id,
  style,
  'aria-hidden': ariaHidden,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  style?: CSSProperties;
  'aria-hidden'?: boolean;
}) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  // Progress runs 0 → 1 across the whole time the section is in view.
  const { scrollYProgress } = useScroll({
    target: ref ? { current: ref } : undefined,
    offset: ['start end', 'end start'],
  });

  return (
    <SceneProgress.Provider value={scrollYProgress}>
      <section
        id={id}
        ref={setRef}
        style={style}
        aria-hidden={ariaHidden}
        className={`relative overflow-hidden ${className}`}
      >
        {children}
      </section>
    </SceneProgress.Provider>
  );
}

/**
 * One depth plane. `speed` is roughly "screens per screen" — 0.02 for sky,
 * 0.12 for foreground foliage. Layers are oversized by the caller (e.g.
 * `-inset-y-[15%]`) so the drift never exposes an edge.
 */
export function ParallaxLayer({
  speed = 0.06,
  className = '',
  children,
  'aria-hidden': ariaHidden = true,
}: {
  speed?: number;
  className?: string;
  children: ReactNode;
  'aria-hidden'?: boolean;
}) {
  const ctx = useContext(SceneProgress);
  const fallback = useMotionValue(0);
  const reduced = useReducedMotion();
  const compact = useIsCompact();

  // Mobile gets 45% of the desktop travel; reduced-motion gets none.
  const factor = reduced ? 0 : compact ? speed * 0.45 : speed;
  // Travel is generous enough to be felt while scrolling; every layer is
  // over-sized by its caller so the drift never exposes an edge.
  const distance = factor * 1000;

  const y = useTransform(ctx ?? fallback, [0, 1], [distance, -distance]);

  return (
    <motion.div
      data-parallax=""
      aria-hidden={ariaHidden}
      style={{ y, willChange: factor === 0 ? undefined : 'transform' }}
      className={`pointer-events-none absolute ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Scenery — inline SVG silhouettes.

   Everything paints with `currentColor` so a single text-* class on the
   wrapper controls the whole layer's tone, and dark mode is one extra class.
   Geometry is hand-placed and deterministic: no Math.random, which would
   produce different markup on server and client and break hydration.
   ══════════════════════════════════════════════════════════════════════════ */

/** Soft rolling horizon. Stretches freely — smooth curves take it well. */
type ArtProps = { className?: string; style?: CSSProperties };

export function Hills({ className = '', style }: ArtProps) {
  return (
    <svg
      viewBox="0 0 1440 220"
      preserveAspectRatio="none"
      className={`h-full w-full ${className}`}
      style={style}
      focusable="false"
    >
      <path
        d="M0 150C120 118 240 104 380 122c130 17 210 54 330 52 118-2 196-46 322-56 108-8 208 12 288 40 44 15 84 34 120 46v58H0z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * A distant treeline read as a continuous canopy mass, not a row of individual
 * trees. Crowns overlap heavily and sit on a low connecting band, which is what
 * stops a silhouette at low opacity from looking like clip-art lollipops.
 */
export function TreeLine({ className = '', style }: ArtProps) {
  // Tight spacing so neighbouring crowns merge. [x, radius, height]
  const trees = [
    [16, 30, 62], [52, 22, 44], [86, 34, 74], [128, 26, 52], [166, 38, 84],
    [212, 24, 46], [248, 31, 66], [292, 36, 78], [338, 23, 44], [372, 33, 70],
    [416, 28, 56], [456, 40, 88], [506, 25, 48], [544, 32, 68], [588, 37, 80],
    [634, 22, 42], [668, 30, 62], [710, 35, 76], [756, 26, 50], [794, 33, 70],
    [838, 39, 86], [886, 24, 46], [922, 31, 64], [964, 36, 78], [1010, 23, 44],
    [1046, 34, 72], [1090, 27, 54], [1130, 38, 84], [1178, 25, 48], [1216, 32, 66],
    [1258, 36, 78], [1304, 23, 44], [1340, 33, 70], [1384, 28, 56], [1424, 35, 74],
  ] as const;

  return (
    <svg
      viewBox="0 0 1440 120"
      preserveAspectRatio="xMidYMax slice"
      className={`h-full w-full ${className}`}
      style={style}
      focusable="false"
    >
      <g fill="currentColor">
        {/* undergrowth band the crowns rise out of */}
        <rect x="0" y="96" width="1440" height="24" />
        {trees.map(([x, r, h]) => {
          const base = 120;
          const crown = base - h;
          return (
            <g key={x}>
              <ellipse cx={x} cy={crown + r * 0.8} rx={r} ry={r * 0.85} />
              <ellipse cx={x - r * 0.6} cy={crown + r * 1.35} rx={r * 0.7} ry={r * 0.62} />
              <ellipse cx={x + r * 0.6} cy={crown + r * 1.3} rx={r * 0.66} ry={r * 0.6} />
              <rect x={x - 2.5} y={crown + r * 1.4} width="5" height={base - crown - r * 1.4} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/**
 * A row of modern township homes — flat-roof and low-pitch masses with
 * setbacks, in the spirit of an architectural elevation rather than a
 * children's-book street.
 */
export function Township({ className = '', style }: ArtProps) {
  // [x, width, height, roof: 0 flat | 1 low pitch]
  const homes = [
    [30, 96, 78, 0], [140, 78, 62, 1], [232, 110, 92, 0], [356, 84, 66, 1],
    [452, 100, 82, 0], [566, 72, 58, 1], [652, 118, 96, 0], [784, 86, 68, 1],
    [882, 104, 84, 0], [1000, 76, 60, 1], [1090, 112, 90, 0], [1216, 82, 64, 1],
    [1310, 98, 80, 0],
  ] as const;

  return (
    <svg
      viewBox="0 0 1440 140"
      preserveAspectRatio="xMidYMax slice"
      className={`h-full w-full ${className}`}
      style={style}
      focusable="false"
    >
      <g fill="currentColor">
        {homes.map(([x, w, h, roof]) => {
          const base = 140;
          const top = base - h;
          return (
            <g key={x}>
              <rect x={x} y={top} width={w} height={h} rx="1.5" />
              {roof === 1 ? (
                <path d={`M${x - 6} ${top}L${x + w / 2} ${top - 16}L${x + w + 6} ${top}Z`} />
              ) : (
                <rect x={x - 5} y={top - 5} width={w + 10} height="5" rx="1" />
              )}
              {/* windows — punched out so the mass reads as a building */}
              {/* Windows lit warm rather than punched white — at silhouette
                  opacity a neutral fill reads as grey blocks, not glass. */}
              <rect x={x + w * 0.18} y={top + h * 0.28} width={w * 0.2} height={h * 0.18} fill="hsl(42 90% 72%)" opacity="0.5" />
              <rect x={x + w * 0.58} y={top + h * 0.28} width={w * 0.2} height={h * 0.18} fill="hsl(42 90% 72%)" opacity="0.32" />
              <rect x={x + w * 0.18} y={top + h * 0.58} width={w * 0.2} height={h * 0.18} fill="hsl(42 90% 72%)" opacity="0.2" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/** Foreground grass and leaf tips, for the very bottom of a scene. */
export function Foliage({ className = '', style }: ArtProps) {
  return (
    <svg
      viewBox="0 0 1440 90"
      preserveAspectRatio="xMidYMax slice"
      className={`h-full w-full ${className}`}
      style={style}
      focusable="false"
    >
      <g fill="currentColor">
        <path d="M0 90V54c34 4 52 20 74 30 18 8 40 6 62-2 26-9 44-28 78-30 30-2 48 14 70 26 20 11 44 12 70 4 30-9 50-30 86-30 32 0 52 18 74 30 20 11 44 10 70 2 30-9 50-28 84-28 32 0 52 16 74 28 20 11 46 12 72 4 30-9 48-30 84-30 30 0 50 16 72 28 20 11 44 12 70 4 28-8 46-26 78-28 26-2 44 10 62 20 16 9 30 14 42 14v18z" />
        {/* individual blades catching the light */}
        <path d="M120 90c-2-18 4-32 14-42-14 6-24 22-24 42zM402 90c-3-22 5-38 18-50-18 7-30 26-30 50zM806 90c-2-20 5-35 16-46-16 7-27 24-27 46zM1180 90c-3-19 4-33 14-43-15 6-25 22-25 43z" />
      </g>
    </svg>
  );
}

/** Warm low sun. Purely atmospheric — sits behind everything. */
export function SunGlow({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-full blur-3xl ${className}`}
      style={{
        backgroundImage:
          'radial-gradient(circle, hsl(45 90% 72% / 0.55) 0%, hsl(45 85% 68% / 0.22) 45%, transparent 70%)',
      }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Full-colour scenery — used in light mode.

   Light mode gets a painted landscape rather than a silhouette: sage hills,
   layered green canopies, warm-walled homes with terracotta and slate roofs,
   sunlit windows. Dark mode keeps the silhouettes above, which is what makes
   the two themes read as genuinely different places rather than one palette
   with the lights turned down.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Shared gradient defs. Ids are document-global, but every instance declares
 * identical stops, so duplicates are harmless.
 */
function SceneDefs() {
  return (
    <defs>
      <linearGradient id="lig-hill-far" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(158 20% 88%)" />
        <stop offset="100%" stopColor="hsl(150 22% 80%)" />
      </linearGradient>
      <linearGradient id="lig-hill-near" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(148 22% 79%)" />
        <stop offset="100%" stopColor="hsl(144 24% 70%)" />
      </linearGradient>
      <linearGradient id="lig-wall" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(40 18% 96%)" />
        <stop offset="100%" stopColor="hsl(36 14% 86%)" />
      </linearGradient>
      <linearGradient id="lig-wall-alt" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(28 12% 88%)" />
        <stop offset="100%" stopColor="hsl(26 10% 78%)" />
      </linearGradient>
      <linearGradient id="lig-glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="hsl(196 26% 74%)" />
        <stop offset="55%" stopColor="hsl(200 20% 60%)" />
        <stop offset="100%" stopColor="hsl(204 18% 52%)" />
      </linearGradient>
      <linearGradient id="lig-canopy-far" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(146 20% 62%)" />
        <stop offset="100%" stopColor="hsl(150 22% 50%)" />
      </linearGradient>
      <linearGradient id="lig-canopy-mid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(142 26% 48%)" />
        <stop offset="100%" stopColor="hsl(148 30% 36%)" />
      </linearGradient>
      <linearGradient id="lig-canopy-near" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(138 30% 38%)" />
        <stop offset="100%" stopColor="hsl(146 34% 26%)" />
      </linearGradient>
      <linearGradient id="lig-ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(130 24% 44%)" />
        <stop offset="100%" stopColor="hsl(136 28% 32%)" />
      </linearGradient>

      {/* Ragged foliage edges. Displacing the smooth crowns with fractal noise
          is what stops a canopy reading as a stack of ellipses. */}
      <filter id="lig-leaf" x="-12%" y="-12%" width="124%" height="124%">
        <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="3" seed="7" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="11" xChannelSelector="R" yChannelSelector="G" />
      </filter>

      {/* Fine grain over rendered surfaces — concrete and plaster are never flat. */}
      <filter id="lig-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="g" />
        <feColorMatrix in="g" type="saturate" values="0" result="gray" />
        <feComponentTransfer in="gray" result="soft">
          <feFuncA type="linear" slope="0.5" intercept="0" />
        </feComponentTransfer>
        <feBlend in="SourceGraphic" in2="soft" mode="multiply" />
      </filter>

      <linearGradient id="lig-road" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(40 6% 74%)" />
        <stop offset="100%" stopColor="hsl(40 5% 66%)" />
      </linearGradient>
      <linearGradient id="lig-water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(192 52% 68%)" />
        <stop offset="100%" stopColor="hsl(198 46% 52%)" />
      </linearGradient>

      {/* One heavy blur, applied to a duplicate of the whole lighting layer —
          that's what turns discrete shapes into bulbs that actually bloom. */}
      <filter id="lig-bloom" x="-25%" y="-25%" width="150%" height="150%">
        <feGaussianBlur stdDeviation="9" />
      </filter>

      {/* Beams fall off ALONG their direction of throw, so they need linear
          gradients oriented down (lamps) or forward (headlights) — a radial
          glow can't express "bright at the lamp, gone by the road". */}
      <linearGradient id="lig-beam-down" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(47 100% 90%)" stopOpacity="0.92" />
        <stop offset="40%" stopColor="hsl(45 98% 80%)" stopOpacity="0.4" />
        <stop offset="100%" stopColor="hsl(43 92% 68%)" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="lig-beam-fwd" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="hsl(50 100% 94%)" stopOpacity="1" />
        <stop offset="30%" stopColor="hsl(47 98% 84%)" stopOpacity="0.5" />
        <stop offset="100%" stopColor="hsl(45 94% 72%)" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="lig-beam-red" x1="1" y1="0" x2="0" y2="0">
        <stop offset="0%" stopColor="hsl(6 98% 68%)" stopOpacity="0.8" />
        <stop offset="100%" stopColor="hsl(4 92% 56%)" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="lig-beam-cool" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(188 96% 90%)" stopOpacity="0.8" />
        <stop offset="45%" stopColor="hsl(190 86% 78%)" stopOpacity="0.34" />
        <stop offset="100%" stopColor="hsl(194 76% 62%)" stopOpacity="0" />
      </linearGradient>
      {/* Beams are softened separately from the bulb bloom — a hard-edged cone
          is the single thing that makes stage lighting look like clip art. */}
      <filter id="lig-beam-blur" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.4" />
      </filter>

      {/* Bulb glows. Radial gradients rather than blur filters — a filter on
          every lamp would rasterise dozens of regions for the same look. */}
      <radialGradient id="lig-glow-warm">
        <stop offset="0%" stopColor="hsl(46 100% 86%)" stopOpacity="0.95" />
        <stop offset="28%" stopColor="hsl(44 96% 72%)" stopOpacity="0.5" />
        <stop offset="100%" stopColor="hsl(42 90% 62%)" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="lig-glow-cool">
        <stop offset="0%" stopColor="hsl(186 92% 82%)" stopOpacity="0.9" />
        <stop offset="35%" stopColor="hsl(190 80% 62%)" stopOpacity="0.42" />
        <stop offset="100%" stopColor="hsl(196 70% 52%)" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="lig-glow-red">
        <stop offset="0%" stopColor="hsl(6 96% 70%)" stopOpacity="0.9" />
        <stop offset="100%" stopColor="hsl(4 90% 56%)" stopOpacity="0" />
      </radialGradient>

      {/* Dappled light through the canopy. */}
      <linearGradient id="lig-canopy-shade" x1="0" y1="0" x2="0.3" y2="1">
        <stop offset="0%" stopColor="hsl(80 40% 70%)" stopOpacity="0.5" />
        <stop offset="55%" stopColor="hsl(140 30% 40%)" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="lig-glass-sheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
        <stop offset="42%" stopColor="#fff" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

/** Layered hills receding into haze. */
export function HillsColor({ className = '', style }: ArtProps) {
  return (
    <svg viewBox="0 0 1440 220" preserveAspectRatio="none" className={`h-full w-full ${className}`} style={style} focusable="false">
      <SceneDefs />
      <path d="M0 168C160 132 300 120 460 140c150 19 250 58 400 52 140-6 230-48 380-56 90-5 160 10 200 26v66H0z" fill="url(#lig-hill-far)" />
      <path d="M0 186C140 158 280 150 430 166c160 17 260 44 420 38 130-5 220-36 350-42 100-5 180 8 240 22v44H0z" fill="url(#lig-hill-near)" />
    </svg>
  );
}

/**
 * Tree masses built from irregular overlapping crowns rather than a single
 * circle — that irregularity, plus a slim tapered trunk and a gradient, is the
 * difference between a planting scheme and a lollipop.
 */
export function TreeLineColor({ className = '', style }: ArtProps) {
  // Offsets are fractions of the crown radius: [dx, dy, scale]
  const puffs = [
    [0, -0.18, 1], [-0.62, 0.12, 0.72], [0.6, 0.08, 0.75],
    [-0.32, -0.5, 0.6], [0.36, -0.46, 0.62], [-0.05, 0.42, 0.66],
  ] as const;

  const rows = [
    { grad: 'url(#lig-canopy-far)', trunk: 'hsl(30 12% 58%)', y: 4, scale: 0.85, step: 68, off: 0, slim: 4 },
    { grad: 'url(#lig-canopy-mid)', trunk: 'hsl(28 14% 46%)', y: 18, scale: 1.0, step: 78, off: 34, slim: 5 },
    { grad: 'url(#lig-canopy-near)', trunk: 'hsl(26 16% 34%)', y: 34, scale: 1.2, step: 92, off: 12, slim: 6 },
  ];

  return (
    <svg viewBox="0 0 1440 150" preserveAspectRatio="xMidYMax slice" className={`h-full w-full ${className}`} style={style} focusable="false">
      <SceneDefs />
      {rows.map((row, ri) => (
        <g key={ri} className="lig-leaf-tex">
          {Array.from({ length: Math.ceil(1500 / row.step) + 1 }, (_, i) => {
            const x = row.off + i * row.step;
            const r = (22 + ((i * 13 + ri * 7) % 10)) * row.scale;
            const h = (62 + ((i * 19 + ri * 11) % 30)) * row.scale;
            const base = 150 - row.y;
            const crown = base - h;
            // Every nth tree is a tall slender specimen — breaks the rhythm.
            const slender = i % row.slim === 0;
            return (
              <g key={x}>
                <rect x={x - r * 0.07} y={crown + r * 0.6} width={Math.max(2, r * 0.14)} height={base - crown - r * 0.6} fill={row.trunk} />
                {slender ? (
                  <>
                    <ellipse cx={x} cy={crown + r * 0.5} rx={r * 0.5} ry={r * 1.25} fill={row.grad} />
                    <ellipse cx={x - r * 0.12} cy={crown + r * 0.3} rx={r * 0.3} ry={r * 0.85} fill="url(#lig-canopy-shade)" />
                  </>
                ) : (
                  <>
                    {puffs.map(([dx, dy, sc], k) => (
                      <ellipse key={k} cx={x + dx * r} cy={crown + r * 0.85 + dy * r} rx={r * sc} ry={r * sc * 0.86} fill={row.grad} />
                    ))}
                    {/* shaded underside gives the crown volume */}
                    <ellipse cx={x + r * 0.1} cy={crown + r * 1.5} rx={r * 0.95} ry={r * 0.45} fill="hsl(150 30% 20%)" opacity="0.22" />
                    {/* sunlit crest */}
                    <ellipse cx={x - r * 0.2} cy={crown + r * 0.35} rx={r * 0.62} ry={r * 0.45} fill="url(#lig-canopy-shade)" />
                  </>
                )}
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

/**
 * Contemporary township villas: flat roofs, horizontal massing, recessed upper
 * volumes, cantilevers and full-height glazing. Deliberately not gabled
 * cottages with punched windows — that reads as a storybook, not a render.
 */
export function TownshipColor({ className = '', style }: ArtProps) {
  // [x, width, height, variant]
  const homes = [
    [24, 128, 78, 1], [176, 96, 58, 0], [292, 150, 92, 2], [462, 104, 64, 0],
    [586, 138, 84, 1], [744, 92, 56, 0], [856, 158, 96, 2], [1034, 100, 62, 0],
    [1154, 134, 80, 1], [1308, 108, 66, 0], [1436, 120, 74, 2],
  ] as const;

  return (
    <svg viewBox="0 0 1440 170" preserveAspectRatio="xMidYMax slice" className={`h-full w-full ${className}`} style={style} focusable="false">
      <SceneDefs />
      {/* ground plane */}
      <rect x="0" y="152" width="1440" height="18" fill="hsl(90 10% 82%)" />
      <rect x="0" y="152" width="1440" height="2" fill="hsl(90 8% 74%)" />

      {homes.map(([x, w, h, variant], i) => {
        const base = 152;
        const top = base - h;
        const wall = i % 3 === 1 ? 'url(#lig-wall-alt)' : 'url(#lig-wall)';
        return (
          <g key={x}>
            {/* contact shadow grounds the mass */}
            <ellipse cx={x + w / 2} cy={base + 2} rx={w * 0.6} ry={5} fill="hsl(150 12% 40%)" opacity="0.18" />

            {/* main volume, with a grain pass so the plaster isn't flat */}
            <g className="lig-grain-tex">
              <rect x={x} y={top} width={w} height={h} fill={wall} />
            </g>
            {/* panel joints — horizontal shadow gaps between cladding courses */}
            <rect x={x} y={top + h * 0.34} width={w} height="1" fill="hsl(30 10% 58%)" opacity="0.35" />
            <rect x={x} y={top + h * 0.67} width={w} height="1" fill="hsl(30 10% 58%)" opacity="0.28" />
            {/* the wall turns away from the light on its right-hand third */}
            <rect x={x + w * 0.72} y={top} width={w * 0.28} height={h} fill="hsl(210 12% 40%)" opacity="0.12" />
            {/* thin parapet / fascia */}
            <rect x={x - 4} y={top - 4} width={w + 8} height={4} fill="hsl(30 8% 66%)" />

            {/* full-height glazing band with mullions */}
            <rect x={x + w * 0.12} y={top + h * 0.3} width={w * 0.5} height={h * 0.52} fill="url(#lig-glass)" />
            <rect x={x + w * 0.28} y={top + h * 0.3} width={1.6} height={h * 0.52} fill="hsl(30 8% 70%)" opacity="0.8" />
            <rect x={x + w * 0.45} y={top + h * 0.3} width={1.6} height={h * 0.52} fill="hsl(30 8% 70%)" opacity="0.8" />
            {/* raking reflection across the glazing */}
            <rect x={x + w * 0.12} y={top + h * 0.3} width={w * 0.5} height={h * 0.52} fill="url(#lig-glass-sheen)" />
            {/* slim balcony rail */}
            <rect x={x + w * 0.1} y={top + h * 0.62} width={w * 0.54} height="1.5" fill="hsl(30 8% 62%)" opacity="0.75" />

            {variant === 1 && (
              <>
                {/* recessed upper storey, set back from the facade */}
                <rect x={x + w * 0.22} y={top - h * 0.42} width={w * 0.68} height={h * 0.42} fill="url(#lig-wall-alt)" />
                <rect x={x + w * 0.18} y={top - h * 0.46} width={w * 0.76} height={4} fill="hsl(30 8% 66%)" />
                <rect x={x + w * 0.3} y={top - h * 0.3} width={w * 0.42} height={h * 0.2} fill="url(#lig-glass)" />
              </>
            )}

            {variant === 2 && (
              <>
                {/* cantilevered wing over a shaded undercroft */}
                <rect x={x + w * 0.55} y={top - h * 0.3} width={w * 0.58} height={h * 0.3} fill="url(#lig-wall)" />
                <rect x={x + w * 0.55} y={top - h * 0.34} width={w * 0.58} height={4} fill="hsl(30 8% 66%)" />
                <rect x={x + w * 0.62} y={top - h * 0.24} width={w * 0.4} height={h * 0.16} fill="url(#lig-glass)" />
                <rect x={x + w * 0.72} y={top} width={w * 0.3} height={h} fill="hsl(30 10% 72%)" opacity="0.35" />
              </>
            )}

            {/* clipped hedge and a pair of planters along the boundary */}
            <rect x={x - 8} y={base - 12} width={w + 16} height={12} rx="2" fill="hsl(128 26% 46%)" opacity="0.65" />
            <ellipse cx={x + w * 0.16} cy={base - 14} rx={w * 0.09} ry={7} fill="hsl(134 30% 38%)" opacity="0.8" />
            <ellipse cx={x + w * 0.84} cy={base - 15} rx={w * 0.08} ry={8} fill="hsl(134 30% 34%)" opacity="0.75" />
          </g>
        );
      })}
    </svg>
  );
}

/** Foreground planting: layered, soft-edged, no outlines. */
export function FoliageColor({ className = '', style }: ArtProps) {
  return (
    <svg viewBox="0 0 1440 90" preserveAspectRatio="xMidYMax slice" className={`h-full w-full ${className}`} style={style} focusable="false">
      <SceneDefs />
      <path d="M0 90V54c34 4 52 20 74 30 18 8 40 6 62-2 26-9 44-28 78-30 30-2 48 14 70 26 20 11 44 12 70 4 30-9 50-30 86-30 32 0 52 18 74 30 20 11 44 10 70 2 30-9 50-28 84-28 32 0 52 16 74 28 20 11 46 12 72 4 30-9 48-30 84-30 30 0 50 16 72 28 20 11 44 12 70 4 28-8 46-26 78-28 26-2 44 10 62 20 16 9 30 14 42 14v18z" fill="url(#lig-ground)" opacity="0.85" />
      <path d="M0 90V70c40 6 70 14 104 14 40 0 70-14 112-14 44 0 74 16 118 16 46 0 76-16 122-16 44 0 74 14 118 14 46 0 76-14 120-14 44 0 76 16 120 16 44 0 74-16 118-16 40 0 70 12 108 14v16z" fill="hsl(140 30% 26%)" opacity="0.9" />
    </svg>
  );
}


/* ══════════════════════════════════════════════════════════════════════════
   Township panorama — the showpiece scene.

   Composed deliberately across a wide viewBox rather than tiled from one
   repeating unit: a boulevard with kerbs and lane markings, street lights and
   cars, villas, a club with a pool, a sports court and a park. That variety is
   what stops it reading as wallpaper. Everything sits fully above the baseline
   so nothing is ever clipped by the band's bottom edge.
   ══════════════════════════════════════════════════════════════════════════ */

const GROUND = 300; // baseline every object stands on
const ROAD_TOP = 246;

/** A contemporary villa: base volume, recessed upper storey, glazing, hedge. */
function Villa({ x, w, h, tone = 0 }: { x: number; w: number; h: number; tone?: number }) {
  const top = GROUND - 46 - h;
  const wall = tone === 1 ? 'url(#lig-wall-alt)' : 'url(#lig-wall)';
  return (
    <g>
      <ellipse cx={x + w / 2} cy={GROUND - 44} rx={w * 0.62} ry={6} fill="hsl(150 14% 38%)" opacity="0.16" />
      <g className="lig-grain-tex">
        <rect x={x} y={top} width={w} height={h} fill={wall} />
      </g>
      <rect x={x - 5} y={top - 5} width={w + 10} height={5} fill="hsl(30 9% 64%)" />
      <rect x={x} y={top + h * 0.4} width={w} height="1" fill="hsl(30 10% 56%)" opacity="0.3" />
      {/* upper storey set back from the facade */}
      <rect x={x + w * 0.24} y={top - h * 0.5} width={w * 0.66} height={h * 0.5} fill="url(#lig-wall-alt)" />
      <rect x={x + w * 0.2} y={top - h * 0.54} width={w * 0.74} height={4} fill="hsl(30 9% 64%)" />
      <rect x={x + w * 0.32} y={top - h * 0.36} width={w * 0.4} height={h * 0.22} fill="url(#lig-glass)" />
      {/* ground-floor glazing with mullions and a raking sheen */}
      <rect x={x + w * 0.1} y={top + h * 0.14} width={w * 0.52} height={h * 0.56} fill="url(#lig-glass)" />
      <rect x={x + w * 0.27} y={top + h * 0.14} width="1.6" height={h * 0.56} fill="hsl(30 8% 72%)" opacity="0.8" />
      <rect x={x + w * 0.44} y={top + h * 0.14} width="1.6" height={h * 0.56} fill="hsl(30 8% 72%)" opacity="0.8" />
      <rect x={x + w * 0.1} y={top + h * 0.14} width={w * 0.52} height={h * 0.56} fill="url(#lig-glass-sheen)" />
      <rect x={x + w * 0.74} y={top} width={w * 0.26} height={h} fill="hsl(210 12% 40%)" opacity="0.1" />
      {/* boundary hedge */}
      <rect x={x - 8} y={GROUND - 56} width={w + 16} height={12} rx="3" fill="hsl(130 28% 44%)" opacity="0.75" />
    </g>
  );
}

/** Club building with a pool terrace in front. */
function ClubAndPool({ x }: { x: number }) {
  const top = GROUND - 46 - 96;
  return (
    <g>
      <ellipse cx={x + 130} cy={GROUND - 44} rx={160} ry={7} fill="hsl(150 14% 38%)" opacity="0.16" />
      <g className="lig-grain-tex">
        <rect x={x} y={top} width={190} height={96} fill="url(#lig-wall)" />
      </g>
      <rect x={x - 6} y={top - 6} width={202} height={6} fill="hsl(30 9% 62%)" />
      {/* colonnade */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={x + 16 + i * 36} y={top + 40} width={9} height={56} fill="hsl(36 12% 82%)" />
      ))}
      <rect x={x + 12} y={top + 16} width={166} height={22} fill="url(#lig-glass)" />
      <rect x={x + 12} y={top + 16} width={166} height={22} fill="url(#lig-glass-sheen)" />
      {/* pool terrace */}
      <rect x={x + 6} y={GROUND - 44} width={230} height={26} rx="3" fill="hsl(40 16% 90%)" />
      <rect x={x + 22} y={GROUND - 39} width={198} height={17} rx="8" fill="url(#lig-water)" />
      <path d={`M${x + 36} ${GROUND - 32}q14 -4 28 0t28 0t28 0t28 0t28 0`} stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" fill="none" />
      <path d={`M${x + 40} ${GROUND - 27}q14 -4 28 0t28 0t28 0t28 0`} stroke="#fff" strokeOpacity="0.35" strokeWidth="1.4" fill="none" />
      {/* parasols */}
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x={x + 236 + i * 26} y={GROUND - 56} width="2" height="14" fill="hsl(30 10% 58%)" />
          <path d={`M${x + 228 + i * 26} ${GROUND - 56}h18l-9 -9z`} fill="hsl(14 40% 62%)" />
        </g>
      ))}
    </g>
  );
}

/** Fenced sports court with a net and line markings. */
function SportsCourt({ x }: { x: number }) {
  const y = GROUND - 44;
  return (
    <g>
      <rect x={x} y={y - 46} width={210} height={46} rx="2" fill="hsl(150 26% 52%)" opacity="0.85" />
      <rect x={x + 10} y={y - 38} width={190} height={30} fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.4" />
      <rect x={x + 104} y={y - 44} width="1.6" height={40} fill="hsl(30 8% 45%)" />
      <path d={`M${x + 105} ${y - 40}h0`} />
      <rect x={x + 76} y={y - 34} width={58} height={22} fill="#fff" opacity="0.28" />
      {/* perimeter fence posts */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={x + 4 + i * 34} y={y - 52} width="1.6" height={52} fill="hsl(150 10% 50%)" opacity="0.6" />
      ))}
      <rect x={x} y={y - 52} width={210} height="1.4" fill="hsl(150 10% 50%)" opacity="0.55" />
    </g>
  );
}

/** Park: lawn, path, benches, a lamp and specimen planting. */
function Park({ x }: { x: number }) {
  const y = GROUND - 44;
  return (
    <g>
      <rect x={x} y={y - 40} width={230} height={40} rx="4" fill="hsl(126 32% 52%)" opacity="0.75" />
      <path d={`M${x + 10} ${y - 4}q60 -26 110 -18t100 -12`} stroke="hsl(40 20% 88%)" strokeWidth="7" fill="none" opacity="0.9" />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x={x + 44 + i * 120} y={y - 16} width={30} height="3.5" rx="1.5" fill="hsl(28 26% 46%)" />
          <rect x={x + 46 + i * 120} y={y - 13} width="3" height="9" fill="hsl(28 20% 38%)" />
          <rect x={x + 69 + i * 120} y={y - 13} width="3" height="9" fill="hsl(28 20% 38%)" />
        </g>
      ))}
      {[30, 96, 170].map((dx, i) => (
        <g key={dx}>
          <rect x={x + dx} y={y - 34} width="3" height={22} fill="hsl(28 22% 40%)" />
          <ellipse cx={x + dx + 1.5} cy={y - 40} rx={14 + i * 2} ry={13 + i} fill="url(#lig-canopy-near)" />
        </g>
      ))}
    </g>
  );
}

/** Boulevard street light — pole, arm, lamp head and a soft pool of light. */
function StreetLight({ x }: { x: number }) {
  const base = GROUND - 44;
  return (
    <g>
      <rect x={x} y={base - 78} width="3" height={78} fill="hsl(150 8% 46%)" />
      <path d={`M${x + 1.5} ${base - 78}q0 -12 14 -12h10`} stroke="hsl(150 8% 46%)" strokeWidth="3" fill="none" />
      <rect x={x + 21} y={base - 92} width={14} height="4.5" rx="2" fill="hsl(150 10% 40%)" />
      <ellipse cx={x + 28} cy={base - 84} rx={10} ry={7} fill="hsl(46 90% 76%)" opacity="0.45" />
    </g>
  );
}

/** A car on the boulevard. */
function Car({ x, hue }: { x: number; hue: string }) {
  const y = GROUND - 16;
  return (
    <g>
      <ellipse cx={x + 26} cy={y + 7} rx={30} ry={3.5} fill="hsl(150 14% 30%)" opacity="0.22" />
      <path d={`M${x} ${y}h52a5 5 0 0 0 5 -5v-6a6 6 0 0 0 -5 -6l-12 -1 -9 -7h-18l-7 8 -8 1a5 5 0 0 0 -3 5v6a5 5 0 0 0 5 5z`} fill={hue} />
      <path d={`M${x + 16} ${y - 12}h14l6 6h-24z`} fill="hsl(200 24% 82%)" opacity="0.9" />
      <circle cx={x + 13} cy={y} r="5" fill="hsl(150 8% 24%)" />
      <circle cx={x + 43} cy={y} r="5" fill="hsl(150 8% 24%)" />
    </g>
  );
}


/* ══════════════════════════════════════════════════════════════════════════
   Night lighting.

   Dark mode doesn't just dim the daytime scene — the structure is darkened,
   then this layer paints back everything that would actually be emitting after
   dusk: lamp heads, lit windows, headlights and tail lights, floodlit courts
   and an underlit pool. Drawn on top of the darkening filter so the glows stay
   bright instead of being crushed with the rest of the image.
   ══════════════════════════════════════════════════════════════════════════ */

/** A bulb: soft halo plus a hot core. */
function Glow({ x, y, r, tone = 'warm', core = 2 }: { x: number; y: number; r: number; tone?: 'warm' | 'cool' | 'red'; core?: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={r} ry={r} fill={`url(#lig-glow-${tone})`} />
      {core > 0 && (
        <ellipse cx={x} cy={y} rx={core} ry={core} fill={tone === 'red' ? 'hsl(6 100% 78%)' : tone === 'cool' ? 'hsl(186 100% 90%)' : 'hsl(48 100% 92%)'} />
      )}
    </g>
  );
}

/** Warm rectangle of light behind a window opening. */
function LitPane({ x, y, w, h, tone = 'warm' }: { x: number; y: number; w: number; h: number; tone?: 'warm' | 'cool' }) {
  return (
    <g>
      <ellipse cx={x + w / 2} cy={y + h / 2} rx={w * 1.15} ry={h * 1.7} fill={`url(#lig-glow-${tone})`} opacity="0.9" />
      <rect x={x} y={y} width={w} height={h} rx="1" fill={tone === 'cool' ? 'hsl(190 86% 80%)' : 'hsl(46 98% 80%)'} opacity="0.72" />
    </g>
  );
}

/** Lamp head plus the cone of light it throws onto the carriageway. */
function LampLight({ x }: { x: number }) {
  const base = GROUND - 44;
  return (
    <g>
      {/* the cone of light, soft-edged and fading before it reaches the road */}
      <g filter="url(#lig-beam-blur)">
        <path
          d={`M${x + 23} ${base - 84}L${x + 86} ${base + 8}H${x - 30}Z`}
          fill="url(#lig-beam-down)"
        />
      </g>
      {/* elliptical throw on the carriageway, brightest under the lamp */}
      <ellipse cx={x + 28} cy={base + 2} rx={52} ry={9} fill="url(#lig-glow-warm)" opacity="0.5" />
      <ellipse cx={x + 28} cy={base + 2} rx={22} ry={4.5} fill="hsl(46 98% 84%)" opacity="0.3" />
      <Glow x={x + 28} y={base - 85} r={26} core={3.6} />
    </g>
  );
}

function VillaLights({ x, w, h }: { x: number; w: number; h: number }) {
  const top = GROUND - 46 - h;
  return (
    <g>
      <LitPane x={x + w * 0.1} y={top + h * 0.14} w={w * 0.52} h={h * 0.56} />
      <LitPane x={x + w * 0.32} y={top - h * 0.36} w={w * 0.4} h={h * 0.22} />
      <Glow x={x + w * 0.86} y={top + h * 0.5} r={9} core={1.6} />
    </g>
  );
}

function ClubLights({ x }: { x: number }) {
  const top = GROUND - 46 - 96;
  return (
    <g>
      <LitPane x={x + 12} y={top + 16} w={166} h={22} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Glow key={i} x={x + 20 + i * 36} y={top + 46} r={7} core={1.3} />
      ))}
      {/* pool lit from below the waterline */}
      <ellipse cx={x + 121} cy={GROUND - 30} rx={104} ry={16} fill="url(#lig-glow-cool)" opacity="0.75" />
      <rect x={x + 22} y={GROUND - 39} width={198} height={17} rx="8" fill="hsl(188 80% 62%)" opacity="0.42" />
    </g>
  );
}

function CourtLights({ x }: { x: number }) {
  const y = GROUND - 44;
  return (
    <g>
      {[10, 100, 190].map((dx) => (
        <g key={dx}>
          <g filter="url(#lig-beam-blur)">
            <path d={`M${x + dx} ${y - 60}L${x + dx + 44} ${y + 4}H${x + dx - 44}Z`} fill="url(#lig-beam-cool)" />
          </g>
          <ellipse cx={x + dx} cy={y + 1} rx={40} ry={7} fill="url(#lig-glow-cool)" opacity="0.32" />
          <Glow x={x + dx} y={y - 62} r={15} tone="cool" core={2.8} />
        </g>
      ))}
      <rect x={x + 10} y={y - 38} width={190} height={30} fill="hsl(186 60% 70%)" opacity="0.12" />
    </g>
  );
}

function GymLights({ x }: { x: number }) {
  const top = GROUND - 46 - 88;
  return <LitPane x={x + 14} y={top + 18} w={162} h={54} tone="cool" />;
}

function CarLights({ x }: { x: number }) {
  const y = GROUND - 16;
  return (
    <g>
      <g filter="url(#lig-beam-blur)">
        {/* twin beams, splayed, fading out well before the frame edge */}
        <path d={`M${x + 54} ${y - 7}L${x + 246} ${y - 34}L${x + 246} ${y + 8}Z`} fill="url(#lig-beam-fwd)" />
        <path d={`M${x + 54} ${y - 2}L${x + 206} ${y + 4}L${x + 206} ${y + 20}Z`} fill="url(#lig-beam-fwd)" opacity="0.8" />
        {/* tail lamps wash the road behind */}
        <path d={`M${x + 2} ${y - 4}L${x - 62} ${y - 14}L${x - 62} ${y + 8}Z`} fill="url(#lig-beam-red)" />
      </g>
      {/* light spilling onto the tarmac ahead of the car */}
      <ellipse cx={x + 140} cy={y + 13} rx={92} ry={8} fill="url(#lig-glow-warm)" opacity="0.42" />
      <Glow x={x + 55} y={y - 4} r={11} core={2.2} />
      <Glow x={x + 2} y={y - 4} r={7} tone="red" core={1.5} />
    </g>
  );
}

/** All the lights of the main township panorama. */
export function TownshipNightLights() {
  const lights = (
    <>
      {[[40, 150, 92], [478, 128, 74], [906, 142, 86], [1320, 134, 78], [1740, 156, 96], [2196, 140, 82]].map(
        ([x, w, h]) => <VillaLights key={x} x={x!} w={w!} h={h!} />,
      )}
      <ClubLights x={640} />
      <ClubLights x={1926} />
      <CourtLights x={1080} />
      {[120, 400, 700, 980, 1260, 1540, 1820, 2100, 2360].map((x) => <LampLight key={x} x={x} />)}
      {[250, 820, 1430, 2010].map((x) => <CarLights key={x} x={x} />)}
    </>
  );
  return (
    <g>
      <g filter="url(#lig-bloom)" opacity="0.95">{lights}</g>
      {lights}
    </g>
  );
}

/** All the lights of the amenity belt. */
export function AmenitiesNightLights() {
  const lights = (
    <>
      <ClubLights x={60} />
      <ClubLights x={1420} />
      <CourtLights x={450} />
      <CourtLights x={1700} />
      <GymLights x={720} />
      <GymLights x={2060} />
      {[250, 640, 900, 1360, 1660, 1900, 2250].map((x) => <LampLight key={x} x={x} />)}
      {[340, 1950].map((x) => <Glow key={x} x={x + 34} y={GROUND - 78} r={14} core={2.4} />)}
    </>
  );
  return (
    <g>
      <g filter="url(#lig-bloom)" opacity="0.95">{lights}</g>
      {lights}
    </g>
  );
}

/**
 * The full scene. The wide viewBox means a desktop crops in on part of it
 * rather than scaling one narrow strip up until everything looks oversized.
 */
export function TownshipPanorama({ className = '', style, night = false }: ArtProps & { night?: boolean }) {
  return (
    <svg
      viewBox="0 0 2400 348"
      preserveAspectRatio="xMidYMax slice"
      className={`h-full w-full ${className}`}
      style={style}
      focusable="false"
    >
      <SceneDefs />
      <g className={night ? 'brightness-[0.20] saturate-[0.55]' : undefined}>

      {/* ── the boulevard ── */}
      <rect x="0" y={GROUND - 46} width="2400" height="10" fill="hsl(96 16% 76%)" />
      <rect x="0" y={ROAD_TOP} width="2400" height={348 - ROAD_TOP} fill="url(#lig-road)" />
      <rect x="0" y={ROAD_TOP} width="2400" height="2.5" fill="hsl(40 10% 84%)" />
      {Array.from({ length: 40 }, (_, i) => (
        <rect key={i} x={i * 62} y={GROUND + 16} width="34" height="3" fill="#fff" opacity="0.7" />
      ))}

      {/* ── buildings and grounds, left to right ── */}
      <Villa x={40} w={150} h={92} tone={0} />
      <Park x={224} />
      <Villa x={478} w={128} h={74} tone={1} />
      <ClubAndPool x={640} />
      <Villa x={906} w={142} h={86} tone={0} />
      <SportsCourt x={1080} />
      <Villa x={1320} w={134} h={78} tone={1} />
      <Park x={1484} />
      <Villa x={1740} w={156} h={96} tone={0} />
      <ClubAndPool x={1926} />
      <Villa x={2196} w={140} h={82} tone={1} />

      {/* ── street furniture along the kerb ── */}
      {[120, 400, 700, 980, 1260, 1540, 1820, 2100, 2360].map((x) => (
        <StreetLight key={x} x={x} />
      ))}

      {/* ── traffic ── */}
      <Car x={250} hue="hsl(206 22% 58%)" />
      <Car x={820} hue="hsl(150 18% 46%)" />
      <Car x={1430} hue="hsl(14 30% 56%)" />
      <Car x={2010} hue="hsl(40 14% 74%)" />
      </g>
      {night && <TownshipNightLights />}
    </svg>
  );
}


/** Fitness block — full-height glazing with equipment silhouettes inside. */
function GymBlock({ x }: { x: number }) {
  const h = 88;
  const top = GROUND - 46 - h;
  return (
    <g>
      <ellipse cx={x + 95} cy={GROUND - 44} rx={118} ry={6} fill="hsl(150 14% 38%)" opacity="0.16" />
      <g className="lig-grain-tex">
        <rect x={x} y={top} width={190} height={h} fill="url(#lig-wall)" />
      </g>
      <rect x={x - 6} y={top - 6} width={202} height={6} fill="hsl(30 9% 62%)" />
      <rect x={x + 14} y={top + 18} width={162} height={h - 34} fill="url(#lig-glass)" />
      <rect x={x + 14} y={top + 18} width={162} height={h - 34} fill="url(#lig-glass-sheen)" />
      {/* treadmills and a rack, read as dark shapes through the glass */}
      {[0, 1, 2].map((i) => (
        <g key={i} opacity="0.42">
          <rect x={x + 32 + i * 46} y={top + h - 44} width={22} height="4" rx="2" fill="hsl(150 12% 26%)" />
          <rect x={x + 50 + i * 46} y={top + h - 62} width="3" height={18} fill="hsl(150 12% 26%)" />
          <rect x={x + 44 + i * 46} y={top + h - 64} width={14} height="3" rx="1.5" fill="hsl(150 12% 26%)" />
        </g>
      ))}
      <rect x={x + 68} y={top + 4} width={54} height="7" rx="3" fill="hsl(150 24% 44%)" opacity="0.75" />
      <rect x={x - 8} y={GROUND - 56} width={206} height={12} rx="3" fill="hsl(130 28% 44%)" opacity="0.7" />
    </g>
  );
}

/** Children's play area — frame swings and a slide. */
function PlayArea({ x }: { x: number }) {
  const y = GROUND - 44;
  return (
    <g>
      <rect x={x} y={y - 34} width={168} height={34} rx="4" fill="hsl(38 42% 78%)" opacity="0.7" />
      {/* swing frame */}
      <path d={`M${x + 18} ${y}l16 -40 16 40`} stroke="hsl(150 12% 46%)" strokeWidth="3" fill="none" />
      <rect x={x + 16} y={y - 42} width={40} height="3" fill="hsl(150 12% 46%)" />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x={x + 26 + i * 16} y={y - 39} width="1.6" height={20} fill="hsl(150 10% 52%)" />
          <rect x={x + 22 + i * 16} y={y - 20} width={10} height="3" rx="1.5" fill="hsl(14 42% 56%)" />
        </g>
      ))}
      {/* slide */}
      <rect x={x + 104} y={y - 36} width="3" height={36} fill="hsl(150 12% 46%)" />
      <rect x={x + 96} y={y - 40} width={22} height="4" rx="2" fill="hsl(196 40% 58%)" />
      <path d={`M${x + 118} ${y - 36}L${x + 146} ${y}`} stroke="hsl(196 40% 58%)" strokeWidth="5" strokeLinecap="round" fill="none" />
    </g>
  );
}

/** Garden gazebo with a shingled roof. */
function Gazebo({ x }: { x: number }) {
  const y = GROUND - 44;
  return (
    <g>
      <ellipse cx={x + 34} cy={y} rx={44} ry={5} fill="hsl(150 14% 38%)" opacity="0.15" />
      <path d={`M${x - 6} ${y - 38}L${x + 34} ${y - 66}L${x + 74} ${y - 38}Z`} fill="hsl(20 30% 46%)" />
      <rect x={x - 6} y={y - 40} width={80} height="4" rx="2" fill="hsl(20 24% 40%)" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={x + 2 + i * 22} y={y - 36} width="3.5" height={36} fill="hsl(28 22% 52%)" />
      ))}
      <rect x={x - 2} y={y - 12} width={72} height="3" fill="hsl(28 22% 46%)" opacity="0.8" />
    </g>
  );
}

/**
 * The amenity belt shown behind the plot map: club and pool, gym, courts,
 * play area, gazebos and planting — the facilities the section is about,
 * rather than a generic treeline.
 */
export function AmenitiesPanorama({ className = '', style, night = false }: ArtProps & { night?: boolean }) {
  return (
    <svg
      viewBox="0 0 2400 348"
      preserveAspectRatio="xMidYMax slice"
      className={`h-full w-full ${className}`}
      style={style}
      focusable="false"
    >
      <SceneDefs />
      <g className={night ? 'brightness-[0.20] saturate-[0.55]' : undefined}>
      {/* landscaped ground and a jogging loop threading the amenities */}
      <rect x="0" y={GROUND - 46} width="2400" height={348 - GROUND + 46} fill="hsl(112 30% 72%)" opacity="0.55" />
      <path
        d={`M0 ${GROUND + 6}q300 -26 600 -4t600 4 600 -18 600 6`}
        stroke="hsl(28 34% 70%)"
        strokeWidth="9"
        fill="none"
        opacity="0.75"
      />

      <ClubAndPool x={60} />
      <Gazebo x={340} />
      <SportsCourt x={450} />
      <GymBlock x={720} />
      <PlayArea x={950} />
      <Park x={1150} />
      <ClubAndPool x={1420} />
      <SportsCourt x={1700} />
      <Gazebo x={1950} />
      <GymBlock x={2060} />
      <PlayArea x={2280} />

      {[250, 640, 900, 1360, 1660, 1900, 2250].map((x) => (
        <StreetLight key={x} x={x} />
      ))}
      </g>
      {night && <AmenitiesNightLights />}
    </svg>
  );
}

/** Parallax backdrop composing the amenity belt with hills and a treeline. */
export function AmenitiesScene({ intensity = 1 }: { intensity?: number }) {
  const o = (v: number) => Math.min(1, v * intensity);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <ParallaxLayer speed={0.03} className="inset-x-[-10%] bottom-[26%] h-[26%]">
        <HillsColor style={{ opacity: o(0.34), filter: 'blur(2.5px)' }} className="dark:hidden" />
        <Hills className="hidden text-black dark:block" style={{ opacity: o(0.22), filter: 'blur(3px)' }} />
      </ParallaxLayer>
      <ParallaxLayer speed={0.06} className="inset-x-[-8%] bottom-[15%] h-[26%]">
        <TreeLineColor style={{ opacity: o(0.42), filter: 'blur(0.8px)' }} className="dark:hidden" />
        <TreeLine className="hidden text-black dark:block" style={{ opacity: o(0.28), filter: 'blur(2px)' }} />
      </ParallaxLayer>
      {/* the amenities themselves, sitting on the bottom edge */}
      <ParallaxLayer speed={0.1} className="inset-x-[-6%] bottom-[-2%] h-[34%]">
        <AmenitiesPanorama style={{ opacity: o(0.5) }} className="dark:hidden" />
        <AmenitiesPanorama night className="hidden dark:block" style={{ opacity: 0.85 }} />
      </ParallaxLayer>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Composed scenes — drop one into any section as its background.
   Light mode renders the painted landscape; dark mode the silhouettes.
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * The signature backdrop: hills, treeline, township and foreground planting,
 * each on its own depth plane. `intensity` scales how present it is; content
 * always stays dominant.
 */
export function TownshipScene({
  intensity = 1,
  showSun = true,
}: {
  tone?: 'light' | 'forest';
  intensity?: number;
  showSun?: boolean;
}) {
  const o = (v: number) => Math.min(1, v * intensity);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {showSun && (
        <ParallaxLayer speed={0.02} className="left-[8%] top-[-14%] h-[45vh] w-[45vh]">
          <SunGlow className="h-full w-full opacity-70 dark:opacity-25" />
        </ParallaxLayer>
      )}

      {/* ── Light mode: painted landscape ── */}
      <div className="dark:hidden">
        <ParallaxLayer speed={0.035} className="inset-x-[-10%] bottom-[14%] h-[30%]">
          <HillsColor style={{ opacity: o(0.5), filter: 'blur(1.5px)' }} />
        </ParallaxLayer>
        <ParallaxLayer speed={0.06} className="inset-x-[-8%] bottom-[8%] h-[22%]">
          <TreeLineColor style={{ opacity: o(0.55), filter: 'blur(0.8px)' }} />
        </ParallaxLayer>
        <ParallaxLayer speed={0.09} className="inset-x-[-6%] bottom-[3%] h-[18%]">
          <TownshipColor style={{ opacity: o(0.62) }} />
        </ParallaxLayer>
        <ParallaxLayer speed={0.14} className="inset-x-[-12%] bottom-[-6%] h-[16%]">
          <FoliageColor style={{ opacity: o(0.6) }} />
        </ParallaxLayer>
      </div>

      {/* ── Dark mode: silhouettes against the forest night ── */}
      <div className="hidden dark:block">
        <ParallaxLayer speed={0.035} className="inset-x-[-10%] bottom-[14%] h-[30%]">
          <Hills className="text-black" style={{ opacity: o(0.3), filter: 'blur(3px)' }} />
        </ParallaxLayer>
        <ParallaxLayer speed={0.06} className="inset-x-[-8%] bottom-[8%] h-[22%]">
          <TreeLine className="text-black" style={{ opacity: o(0.4), filter: 'blur(2px)' }} />
        </ParallaxLayer>
        <ParallaxLayer speed={0.09} className="inset-x-[-6%] bottom-[3%] h-[18%]">
          <Township className="text-black" style={{ opacity: o(0.45), filter: 'blur(1px)' }} />
        </ParallaxLayer>
        <ParallaxLayer speed={0.14} className="inset-x-[-12%] bottom-[-6%] h-[16%]">
          <Foliage className="text-black" style={{ opacity: o(0.5) }} />
        </ParallaxLayer>
      </div>
    </div>
  );
}

/** Quieter variant: hills and a treeline only, for text-dense sections. */
export function HorizonScene({ intensity = 1 }: { tone?: 'light' | 'forest'; intensity?: number }) {
  const o = (v: number) => Math.min(1, v * intensity);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="dark:hidden">
        <ParallaxLayer speed={0.03} className="inset-x-[-10%] bottom-[2%] h-[26%]">
          <HillsColor style={{ opacity: o(0.42), filter: 'blur(2px)' }} />
        </ParallaxLayer>
        <ParallaxLayer speed={0.07} className="inset-x-[-8%] bottom-[-4%] h-[17%]">
          <TreeLineColor style={{ opacity: o(0.45), filter: 'blur(1px)' }} />
        </ParallaxLayer>
      </div>
      <div className="hidden dark:block">
        <ParallaxLayer speed={0.03} className="inset-x-[-10%] bottom-[2%] h-[26%]">
          <Hills className="text-black" style={{ opacity: o(0.26), filter: 'blur(3px)' }} />
        </ParallaxLayer>
        <ParallaxLayer speed={0.07} className="inset-x-[-8%] bottom-[-4%] h-[17%]">
          <TreeLine className="text-black" style={{ opacity: o(0.34), filter: 'blur(2px)' }} />
        </ParallaxLayer>
      </div>
    </div>
  );
}

/** A single botanical leaf, for micro-detail accents. */
export function LeafMark({ className = '', style }: ArtProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="none" focusable="false" aria-hidden>
      <path
        d="M21 3c0 9-5.5 15-13 15H4c0-8.5 5.5-15 13-15 1.5 0 3 0 4 0z"
        fill="currentColor"
        opacity="0.16"
      />
      <path
        d="M21 3c0 9-5.5 15-13 15H4c0-8.5 5.5-15 13-15 1.5 0 3 0 4 0zM4 21c2.5-6 7-10.5 13-13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * A full-width landscape strip used as the transition between sections — the
 * one place the township is meant to be *looked at* rather than merely felt.
 * Section backdrops anchor their scenery to the section's own bottom edge,
 * which on a tall section leaves it far below the fold; this band puts hills,
 * homes and planting at eye level and lets them drift as you scroll past.
 *
 * Decorative only: no content, no landmarks, hidden from assistive tech.
 */
export function LandscapeBand({ className = '' }: { className?: string }) {
  return (
    <ParallaxScene
      className={`h-[300px] w-full sm:h-[360px] lg:h-[420px] ${className}`}
      aria-hidden
    >
      {/* sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(198_54%_93%)] via-[hsl(160_40%_95%)] to-[hsl(var(--background))] dark:from-[hsl(200_30%_9%)] dark:via-[hsl(158_34%_7%)] dark:to-[hsl(var(--background))]" />

      <ParallaxLayer speed={0.02} className="right-[14%] top-[-30%] h-[62%] w-[36%]">
        <SunGlow className="h-full w-full opacity-80 dark:opacity-20" />
      </ParallaxLayer>

      {/* far hills, well above the street so nothing collides */}
      <ParallaxLayer speed={0.045} className="inset-x-[-12%] bottom-[52%] h-[30%]">
        <HillsColor style={{ opacity: 0.55, filter: 'blur(2px)' }} className="dark:hidden" />
        <Hills className="hidden text-black dark:block" style={{ opacity: 0.4, filter: 'blur(3px)' }} />
      </ParallaxLayer>

      {/* treeline behind the rooftops */}
      <ParallaxLayer speed={0.075} className="inset-x-[-10%] bottom-[38%] h-[34%]">
        <TreeLineColor style={{ opacity: 0.8 }} className="dark:hidden" />
        <TreeLine className="hidden text-black dark:block" style={{ opacity: 0.55, filter: 'blur(1.5px)' }} />
      </ParallaxLayer>

      {/* the township itself — anchored to the very bottom so the road and the
          kerb line run off the edge instead of the buildings being clipped */}
      <ParallaxLayer speed={0.12} className="inset-x-[-6%] bottom-0 h-[88%]">
        <TownshipPanorama className="dark:hidden" />
        <TownshipPanorama night className="hidden dark:block" />
      </ParallaxLayer>

      {/* nearest planting — a shallow verge along the bottom edge only */}
      <ParallaxLayer speed={0.2} className="inset-x-[-14%] bottom-[-4%] h-[9%]">
        <FoliageColor style={{ opacity: 0.75 }} className="dark:hidden" />
        <Foliage className="hidden text-black dark:block" style={{ opacity: 0.7 }} />
      </ParallaxLayer>

      {/* haze knocks the scene back into the distance */}
      <div className="pointer-events-none absolute inset-0 bg-[hsl(150_40%_96%)]/12 dark:bg-transparent" />

      {/* feather both edges generously so the band grows out of its neighbours
          rather than sitting between two hard horizontal seams */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[hsl(var(--background))] via-[hsl(var(--background))]/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-[hsl(var(--background))] to-transparent" />
    </ParallaxScene>
  );
}
