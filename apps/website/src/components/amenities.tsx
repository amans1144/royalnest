'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionHeading } from './section-heading';
import { Icon } from './icon-map';
import { AMENITY_GROUPS, THEME_GARDENS } from '../lib/site-data';

export function Amenities() {
  const [active, setActive] = useState(0);
  const group = AMENITY_GROUPS[active]!;

  return (
    <section id="amenities" className="bg-gradient-to-b from-secondary via-background to-secondary py-24">
      <div className="container-x">
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
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all ${
                active === i
                  ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-accent'
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
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="card-hover group flex items-start gap-3.5 rounded-2xl border border-border/70 bg-card p-5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon name={a.icon} width={20} height={20} />
                </span>
                <span className="pt-1 text-sm font-medium leading-snug">{a.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* ── Theme gardens ── */}
        <div className="mt-20 overflow-hidden rounded-3xl border border-border/70 bg-navy p-8 text-navy-foreground sm:p-12">
          <div className="relative">
            <div className="absolute -inset-x-12 -top-24 h-64 bg-[radial-gradient(circle_at_30%_0%,hsl(var(--primary)/0.18),transparent_60%)]" />
            <div className="relative max-w-2xl">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Exclusive
              </span>
              <h3 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
                Ten Theme-Based Gardens
              </h3>
              <p className="mt-3 text-white/65">
                From a rose garden and a fragrance walkway to a mini forest with an adventure trail
                — every park in the township has its own identity.
              </p>
            </div>

            <div className="relative mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {THEME_GARDENS.map((g, i) => (
                <motion.div
                  key={g.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.4, delay: (i % 3) * 0.07 }}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur transition-colors hover:border-primary/40 hover:bg-white/[0.09]"
                >
                  <Icon name={g.icon} width={18} height={18} className="shrink-0 text-primary" />
                  <span className="text-sm font-medium text-white/85">{g.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
