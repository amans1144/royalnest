'use client';

import { motion } from 'framer-motion';
import { formatINR, type Project } from '../lib/mock-data';
import { viewProjectMap } from '../lib/map-store';
import { ArrowRight, MapPin } from './icons';

const statusStyles: Record<Project['status'], string> = {
  Ongoing: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  'Ready to Move': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  Upcoming: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'Sold Out': 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-2xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.image}
          alt={project.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[project.status]}`}
        >
          {project.status}
        </span>
        {project.investment && (
          <span className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Investment
          </span>
        )}
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-sm text-white">
          <MapPin width={15} height={15} />
          {project.location}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold">{project.name}</h3>
          <span className="whitespace-nowrap rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {project.type}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {project.tags.map((t) => (
            <span key={t} className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground">
              {t}
            </span>
          ))}
        </div>

        <button
          onClick={() => viewProjectMap(project.slug)}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          <MapPin width={16} height={16} /> View interactive plot map
        </button>

        <div className="mt-4 flex items-end justify-between pt-4">
          <div>
            <div className="text-xs text-muted-foreground">Starting from</div>
            <div className="font-display text-2xl font-semibold text-primary">
              {formatINR(project.priceFrom)}
            </div>
            <div className="text-xs text-muted-foreground">{project.areaFrom} onwards</div>
          </div>
          <button
            onClick={() => viewProjectMap(project.slug)}
            aria-label="View plot map"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:translate-x-1"
          >
            <ArrowRight width={18} height={18} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
