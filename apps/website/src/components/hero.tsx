'use client';

import { motion } from 'framer-motion';
import { Button } from '@spb/ui';
import { Icon } from './icon-map';
import { HeroBackground } from './hero-background';
import {
  ParallaxScene,
  ParallaxLayer,
  TreeLine,
  Foliage,
  TreeLineColor,
  FoliageColor,
  SunGlow,
} from './parallax';
import { ArrowRight, MapPin, WhatsApp, Sparkle } from './icons';
import { BRAND, PROJECT, HERO_HIGHLIGHTS } from '../lib/site-data';

export function Hero() {
  return (
    <ParallaxScene id="home" className="min-h-screen">
      {/* ── Layer 1 — sky / distant background ────────────────────────────
          The published media drifts slowest. Travel is only ~17px, so the
          readability washes it carries stay effectively pinned under the
          navbar while still giving the frame a sense of depth. */}
      <ParallaxLayer speed={0.04} className="inset-[-6%]">
        {/* Background — the entrance gate render, or whatever image/video the
            admin has published under Settings → Hero background. */}
        <HeroBackground />
      </ParallaxLayer>

      {/* ── Colour grade ──────────────────────────────────────────────────
          A whisper of forest green in the shadows and warm sun from the upper
          left. Low alphas throughout: this should read as daylight and air,
          never as a green filter laid over the render. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(165deg, hsl(150 55% 30% / 0.14) 0%, transparent 46%, hsl(150 50% 22% / 0.14) 100%)',
        }}
      />
      <ParallaxLayer speed={0.02} className="left-[-10%] top-[-18%] h-[70vh] w-[70vh]">
        <SunGlow className="h-full w-full opacity-70" />
      </ParallaxLayer>
      {/* Atmospheric haze — pushes the horizon back and softens the hand-off
          into the section below. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{
          backgroundImage:
            'linear-gradient(to top, hsl(var(--background) / 0.55), hsl(150 40% 60% / 0.06) 45%, transparent)',
        }}
      />

      {/* ── Layers 2–4 — treeline and foreground planting ─────────────────
          Silhouettes only, anchored to the bottom edge, so they frame the
          composition without ever crossing the copy panel. */}
      <div className="dark:hidden">
        <ParallaxLayer speed={0.09} className="inset-x-[-8%] bottom-[-3%] h-[22%]">
          <TreeLineColor style={{ opacity: 0.5, filter: 'blur(1.2px)' }} />
        </ParallaxLayer>
        <ParallaxLayer speed={0.15} className="inset-x-[-12%] bottom-[-6%] h-[14%]">
          <FoliageColor style={{ opacity: 0.55 }} />
        </ParallaxLayer>
      </div>
      <div className="hidden dark:block">
        <ParallaxLayer speed={0.09} className="inset-x-[-8%] bottom-[-3%] h-[22%]">
          <TreeLine className="text-forest-deep" style={{ opacity: 0.3, filter: 'blur(2.5px)' }} />
        </ParallaxLayer>
        <ParallaxLayer speed={0.15} className="inset-x-[-12%] bottom-[-6%] h-[14%]">
          <Foliage className="text-forest-deep" style={{ opacity: 0.34, filter: 'blur(1px)' }} />
        </ParallaxLayer>
      </div>

      {/* Content is bottom-weighted so the gate's own signage stays readable
          above it rather than being covered by the copy panel. */}
      {/* Bottom-anchored on sm+, so trimming the bottom padding shifts the whole
          block down — 50px lower than the previous 96px.
          On mobile the stacked content is taller than the viewport, so
          justify-end has nothing to distribute and the bottom padding is inert:
          position there is driven by pt, kept tight enough that the chips clear
          the floating WhatsApp / call buttons. */}
      <div className="container-x relative flex min-h-screen flex-col items-center justify-end pb-24 pt-24 text-center sm:pb-[46px] sm:pt-36">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          /* Fixed 700×400 panel from lg up; fluid height below so the copy
             never clips on narrow screens. Children are centred with a gap
             rather than stacked margins so they distribute inside the box. */
          className="on-forest flex w-full max-w-[700px] flex-col items-center justify-center gap-4 rounded-3xl border border-white/15 bg-navy/60 p-6 shadow-2xl shadow-navy/40 backdrop-blur-md sm:p-7 lg:h-[400px]"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/15 px-3.5 py-1.5 text-xs font-medium text-primary sm:text-sm">
            <Sparkle width={14} height={14} /> {PROJECT.status} · {PROJECT.tagline}
          </span>

          <h1 className="font-display text-3xl font-bold leading-[1.06] text-white sm:text-4xl lg:text-5xl">
            Liberty Imperial
            <br />
            <span className="text-gradient-gold">Greens</span>
          </h1>

          <p className="flex items-start justify-center gap-2.5 text-sm text-white sm:text-base">
            <MapPin width={18} height={18} className="mt-0.5 shrink-0 text-primary" />
            <span>
              {PROJECT.locality}, {PROJECT.city}
              <span className="block text-xs text-white/75 sm:text-sm">
                On {PROJECT.highway}
              </span>
            </span>
          </p>

          <p className="mx-auto max-w-xl text-sm leading-relaxed text-white/85">
            {PROJECT.pitch}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <a href="#contact">
              <Button>
                Book Site Visit <ArrowRight width={16} height={16} />
              </Button>
            </a>
            <a href="#availability">
              <Button variant="glass">
                <MapPin width={16} height={16} /> View Plot Map
              </Button>
            </a>
            <a href={BRAND.whatsapp} target="_blank" rel="noreferrer noopener">
              <Button
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 hover:text-white"
              >
                <WhatsApp width={16} height={16} /> Enquire Now
              </Button>
            </a>
          </div>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="on-forest mt-4 grid w-full max-w-3xl grid-cols-2 gap-2.5 sm:grid-cols-4"
        >
          {HERO_HIGHLIGHTS.map((h) => (
            <li
              key={h.label}
              className="flex items-center gap-2 rounded-2xl border border-white/15 bg-navy/55 px-3 py-2.5 text-left backdrop-blur-md"
            >
              <Icon name={h.icon} width={18} height={18} className="shrink-0 text-primary" />
              <span className="text-[0.7rem] font-medium leading-snug text-white/90">
                {h.label}
              </span>
            </li>
          ))}
        </motion.ul>

        <motion.a
          href="#availability"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-5"
        >
          <Button size="lg">
            {/* Live pulse carried over from the availability panel */}
            <span className="relative mr-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-foreground" />
            </span>
            Check Availability <ArrowRight width={18} height={18} />
          </Button>
        </motion.a>
      </div>
    </ParallaxScene>
  );
}
