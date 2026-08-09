'use client';

import { motion } from 'framer-motion';
import { AnimatedCounter } from './animated-counter';
import { Check, Leaf } from './icons';
import { ABOUT_STATS, BRAND } from '../lib/site-data';

const points = [
  'RERA-focused advisory with independent title verification',
  'Direct developer partnerships — no inflated middleman pricing',
  'End-to-end legal, loan and registry support',
  '30% open green space promised in every project',
];

export function About() {
  return (
    <section id="about" className="bg-secondary/40 py-24">
      <div className="container-x grid items-center gap-14 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="overflow-hidden rounded-3xl shadow-2xl shadow-navy/15">
            <img
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80"
              alt="RoyalNest Realty"
              className="h-[420px] w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -right-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-xl sm:-right-6">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary">
              <Leaf width={24} height={24} />
            </span>
            <div>
              <div className="font-display text-xl font-bold">30% Green</div>
              <div className="text-xs text-muted-foreground">Open space, every project</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            About RoyalNest
          </span>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Building Trust in Lucknow Since {BRAND.since}
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            RoyalNest Realty is a RERA-focused plotted-development advisor. For over a decade we
            have helped families and investors own clean-title land in Lucknow&apos;s most promising
            corridors — with transparency at the heart of everything we do.
          </p>

          <ul className="mt-6 grid gap-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check width={13} height={13} />
                </span>
                <span className="text-sm">{p}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
            {ABOUT_STATS.map((s) => (
              <div key={s.label}>
                <div className="font-display text-3xl font-bold text-primary">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-1 text-xs font-medium text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
