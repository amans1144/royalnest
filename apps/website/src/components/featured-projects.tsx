'use client';

import { motion } from 'framer-motion';
import { Button } from '@spb/ui';
import { SectionHeading } from './section-heading';
import { MapPin, ArrowRight, BadgeCheck, Ruler } from './icons';
import { PROJECTS, type Project } from '../lib/site-data';

const statusStyles: Record<Project['status'], string> = {
  'Ready to Register': 'bg-emerald-500/90',
  'Selling Fast': 'bg-rose-500/90',
  'New Launch': 'bg-primary',
};

export function FeaturedProjects() {
  return (
    <section id="projects" className="py-24">
      <div className="container-x">
        <SectionHeading
          center
          eyebrow="Featured Projects"
          title="Signature Plotted Developments"
          subtitle="Hand-picked, RERA-approved townships in Lucknow's most promising corridors."
        />

        <div className="mt-14 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((p, i) => (
            <motion.article
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="card-hover group overflow-hidden rounded-3xl border border-border/70 bg-card shadow-lg shadow-navy/5"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={p.image}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/60 to-transparent" />
                <span
                  className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold text-white ${statusStyles[p.status]}`}
                >
                  {p.status}
                </span>
                <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-navy backdrop-blur">
                  <BadgeCheck width={13} height={13} className="text-primary" /> RERA
                </span>
                <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-sm font-medium text-white">
                  <MapPin width={15} height={15} className="text-primary" /> {p.location}
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Starting at</span>
                    <div className="font-display text-2xl font-bold text-primary">{p.price}</div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
                    <Ruler width={14} height={14} /> {p.sizes}
                  </div>
                </div>

                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {p.highlights.map((h) => (
                    <li
                      key={h}
                      className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground"
                    >
                      {h}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                  <span className="text-[0.7rem] font-medium text-muted-foreground">
                    RERA: {p.rera}
                  </span>
                  <a href="#availability">
                    <Button size="sm" variant="ghost" className="text-primary hover:text-primary">
                      View Plot Map <ArrowRight width={15} height={15} />
                    </Button>
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
