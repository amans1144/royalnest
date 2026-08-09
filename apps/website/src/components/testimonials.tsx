'use client';

import { motion } from 'framer-motion';
import { SectionHeading } from './section-heading';
import { Star, Quote, BadgeCheck } from './icons';
import { TESTIMONIALS } from '../lib/site-data';

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24">
      <div className="container-x">
        <SectionHeading
          center
          eyebrow="Testimonials"
          title="Investors Who Trust Us"
          subtitle="Real stories from families and investors who found their plot with RoyalNest."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.blockquote
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative flex flex-col rounded-3xl border p-7 ${
                t.featured
                  ? 'border-primary/30 bg-navy text-navy-foreground shadow-2xl shadow-navy/20 lg:scale-[1.03]'
                  : 'border-border/70 bg-card'
              }`}
            >
              <Quote
                width={36}
                height={36}
                className={t.featured ? 'text-primary/70' : 'text-primary/30'}
              />
              <div className="mt-3 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star key={s} width={16} height={16} className="text-primary" />
                ))}
              </div>
              <p className={`mt-4 flex-1 text-[0.95rem] leading-relaxed ${t.featured ? 'text-white/85' : 'text-muted-foreground'}`}>
                “{t.text}”
              </p>
              <footer className="mt-6 flex items-center gap-3">
                <img
                  src={t.avatar}
                  alt={t.name}
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/40"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-semibold">
                    {t.name}
                    <BadgeCheck width={15} height={15} className="text-primary" />
                  </div>
                  <div className={`text-xs ${t.featured ? 'text-white/60' : 'text-muted-foreground'}`}>
                    {t.location} · Verified Buyer
                  </div>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
