'use client';

import { motion } from 'framer-motion';
import { SectionHeading } from './section-heading';
import { Icon } from './icon-map';
import { WHY_CHOOSE_US } from '../lib/site-data';

export function WhyChooseUs() {
  return (
    <section className="py-24">
      <div className="container-x">
        <SectionHeading
          center
          eyebrow="Why Choose RoyalNest"
          title="Trust, Built Into Every Plot"
          subtitle="From title verification to registry, we protect your investment at every step."
        />

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_CHOOSE_US.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: (i % 4) * 0.07 }}
              className="card-hover flex gap-4 rounded-2xl border border-border/70 bg-card p-5"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon name={f.icon} width={20} height={20} />
              </span>
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
