'use client';

import { motion } from 'framer-motion';
import { categories } from '../lib/mock-data';
import { SectionHeading } from './section-heading';
import { ArrowRight } from './icons';

export function Categories() {
  return (
    <section className="py-24">
      <div className="container-x">
        <SectionHeading
          center
          eyebrow="Explore by category"
          title="Find your kind of space"
          subtitle="From gated plotted communities to grade-A commercial towers."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c, i) => (
            <motion.a
              key={c.key}
              href="#projects"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.55 }}
              className="group relative flex h-72 flex-col justify-end overflow-hidden rounded-3xl p-6"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image}
                alt={c.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="relative text-white">
                <div className="text-sm text-white/70">{c.count} listings</div>
                <div className="mt-1 flex items-center justify-between">
                  <h3 className="font-display text-2xl font-semibold">{c.title}</h3>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 backdrop-blur transition-transform group-hover:translate-x-1">
                    <ArrowRight width={16} height={16} />
                  </span>
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
