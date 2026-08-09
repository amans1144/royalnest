'use client';

import { motion } from 'framer-motion';
import { Button } from '@spb/ui';
import { Icon } from './icon-map';
import { HeroBackground } from './hero-background';
import { ArrowRight, MapPin, FileText, Sparkle } from './icons';
import { PROJECT, HERO_HIGHLIGHTS } from '../lib/site-data';

export function Hero() {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden">
      {/* Background — the entrance gate render, or whatever image/video the
          admin has published under Settings → Hero background. */}
      <HeroBackground />

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
          className="flex w-full max-w-[700px] flex-col items-center justify-center gap-4 rounded-3xl border border-white/15 bg-navy/60 p-6 shadow-2xl shadow-navy/40 backdrop-blur-md sm:p-7 lg:h-[400px]"
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
            <a href="#contact">
              <Button
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 hover:text-white"
              >
                <FileText width={16} height={16} /> Price List
              </Button>
            </a>
          </div>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-4 grid w-full max-w-3xl grid-cols-2 gap-2.5 sm:grid-cols-4"
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
    </section>
  );
}
