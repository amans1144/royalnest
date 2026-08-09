'use client';

import { motion } from 'framer-motion';
import { SectionHeading } from './section-heading';
import { AnimatedCounter } from './animated-counter';
import { Icon } from './icon-map';
import { Check, MapPin } from './icons';
import { LOCATION_GROUPS, LOCATION_NOTE, LOCATION_STATS, PROJECT } from '../lib/site-data';

export function Locations() {
  return (
    <section id="location" className="bg-gradient-to-b from-secondary via-background to-secondary py-24">
      <div className="container-x">
        <SectionHeading
          center
          eyebrow="Location"
          title="At the Centre of Lucknow's Next Chapter"
          subtitle="Nizampur, Gosaiganj – Satrikh Road, on the Lucknow–Sultanpur NH-731 corridor, ringed by planned government townships."
        />

        {/* ── Address + drive-time stats ── */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl border border-border/70 bg-card p-7"
          >
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <MapPin width={22} height={22} />
            </span>
            <h3 className="mt-4 font-display text-xl font-semibold">{PROJECT.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {PROJECT.locality}
              <br />
              {PROJECT.city} — on {PROJECT.highway}
            </p>
            <div className="mt-5 grid gap-2.5 text-sm">
              {[
                'Adjoining the 4-lane Gosaiganj–Satrikh NH-230',
                'Opposite the LDA residential zone',
                '15–20 minutes from Shaheed Path today',
              ].map((t) => (
                <div key={t} className="flex items-start gap-2.5">
                  <Check width={16} height={16} className="mt-0.5 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{t}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4"
          >
            {LOCATION_STATS.map((s) => (
              <div
                key={s.label}
                className="flex flex-col justify-center rounded-3xl border border-border/70 bg-card p-6 text-center"
              >
                <div className="whitespace-nowrap font-display text-3xl font-bold text-primary">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </div>
                <div className="mt-2 text-[0.7rem] font-medium uppercase leading-snug tracking-wide text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Growth drivers ── */}
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {LOCATION_GROUPS.map((g, i) => (
            <motion.div
              key={g.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: (i % 2) * 0.08 }}
              className="card-hover rounded-3xl border border-border/70 bg-card p-7"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon name={g.icon} width={20} height={20} />
                </span>
                <h3 className="font-display text-lg font-semibold">{g.title}</h3>
              </div>
              <ul className="mt-5 grid gap-2.5">
                {g.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-10 max-w-3xl border-l-2 border-primary pl-5 text-sm italic leading-relaxed text-muted-foreground"
        >
          {LOCATION_NOTE}
        </motion.p>
      </div>
    </section>
  );
}
