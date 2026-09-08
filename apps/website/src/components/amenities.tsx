'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeading } from './section-heading';
import { Icon } from './icon-map';
import { ParallaxScene, ParallaxLayer, TownshipScene, LeafMark, TreeLine } from './parallax';
import { AMENITY_GROUPS, THEME_GARDENS } from '../lib/site-data';

export function Amenities() {
  const [active, setActive] = useState(0);
  const group = AMENITY_GROUPS[active]!;

  return (
    <ParallaxScene
      id="amenities"
      className="bg-gradient-to-b from-[hsl(var(--secondary))] via-background to-[hsl(var(--cream))] py-24"
    >
      {/* A township living behind the content — kept at a whisper so the
          amenity copy always dominates (§9: 5–10% presence). */}
      <TownshipScene tone="light" intensity={0.55} />

      <div className="container-x relative">
        <SectionHeading
          center
          eyebrow="Amenities"
          title="World-Class Lifestyle Amenities"
          subtitle="Everything a vacation-themed township should have — infrastructure, sport, greenery and community, all inside the gates."
        />

        {/* ── Category tabs ── */}
        <div className="mt-12 flex flex-wrap justify-center gap-2.5">
          {AMENITY_GROUPS.map((g, i) => (
            <button
              key={g.title}
              onClick={() => setActive(i)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300 ease-out-soft ${
                active === i
                  ? 'border-primary bg-primary text-primary-foreground shadow-premium'
                  : 'border-border bg-card/80 backdrop-blur hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card'
              }`}
            >
              <Icon name={g.icon} width={16} height={16} />
              {g.title}
              <span
                className={`rounded-full px-1.5 text-[0.65rem] font-semibold ${
                  active === i ? 'bg-black/15' : 'bg-muted text-muted-foreground'
                }`}
              >
                {g.items.length}
              </span>
            </button>
          ))}
        </div>

        {/* ── Amenity grid ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {group.items.map((a, i) => (
              <motion.div
                key={a.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                className="surface surface-lift group flex items-start gap-3.5 bg-card/90 p-5 backdrop-blur-sm"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/[0.09] text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon name={a.icon} width={20} height={20} />
                </span>
                <span className="pt-1 text-sm font-medium leading-snug">{a.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* ══ Ten theme-based gardens ══════════════════════════════════════
            A forest-dark garden room: the botanical set piece of the page. */}
        <div className="on-forest relative mt-24 overflow-hidden rounded-3xl bg-navy p-8 text-navy-foreground shadow-cinematic sm:p-12">
          {/* Layered planting inside the panel */}
          <ParallaxLayer speed={0.05} className="inset-x-[-4%] bottom-0 h-[42%]">
            <TreeLine className="text-black" style={{ opacity: 0.16, filter: 'blur(2.5px)' }} />
          </ParallaxLayer>
          <div className="pointer-events-none absolute -inset-x-12 -top-24 h-64 bg-[radial-gradient(circle_at_30%_0%,hsl(var(--primary)/0.2),transparent_60%)]" />
          <LeafMark className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rotate-[18deg] text-primary/[0.07]" />

          <div className="relative grid gap-10 lg:grid-cols-[0.85fr_1.6fr]">
            {/* Intro */}
            <div className="max-w-xl">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Exclusive
              </span>
              <h3 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
                Ten Theme-Based Gardens
              </h3>
              <div className="rule-leaf mt-5 max-w-[10rem]" />
              <p className="mt-5 text-white/65">
                From a rose garden and a fragrance walkway to a mini forest with an adventure trail
                — every park in the township has its own identity.
              </p>

              <LeafMark className="mt-8 hidden h-16 w-16 text-primary/40 lg:block" />
            </div>

            {/* Garden tiles */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {THEME_GARDENS.map((g, i) => (
                <motion.div
                  key={g.name}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.55, delay: (i % 3) * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 backdrop-blur transition-all duration-500 ease-out-soft hover:-translate-y-1 hover:border-primary/45 hover:bg-white/[0.08]"
                >
                  {/* soft green bloom on hover */}
                  <span className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/25 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                  {/* botanical watermark, unique rotation per tile */}
                  <LeafMark
                    className="pointer-events-none absolute -bottom-5 -right-4 h-20 w-20 text-white/[0.06] transition-transform duration-700 group-hover:scale-110"
                    style={{ transform: `rotate(${(i * 37) % 90}deg)` }}
                  />
                  <div className="relative flex items-center gap-3">
                    <Icon
                      name={g.icon}
                      width={18}
                      height={18}
                      className="shrink-0 text-primary transition-transform duration-500 group-hover:scale-110"
                    />
                    <span className="text-sm font-medium text-white/85">{g.name}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ParallaxScene>
  );
}
