'use client';

import { motion } from 'framer-motion';
import { SectionHeading } from './section-heading';
import { PROCESS_STEPS } from '../lib/site-data';

export function BookingProcess() {
  return (
    <section className="bg-secondary/40 py-24">
      <div className="container-x">
        <SectionHeading
          center
          eyebrow="How It Works"
          title="Your Journey to Ownership"
          subtitle="A simple, transparent four-step process — with a RoyalNest advisor beside you throughout."
        />

        <div className="relative mt-16 grid gap-8 md:grid-cols-4">
          {/* connecting line */}
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block" />
          {PROCESS_STEPS.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative text-center"
            >
              <span className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-full border-2 border-primary bg-background font-display text-lg font-bold text-primary shadow-lg shadow-primary/20">
                {s.step}
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
