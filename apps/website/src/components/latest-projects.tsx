'use client';

import { motion } from 'framer-motion';
import { projects } from '../lib/mock-data';
import { ProjectCard } from './project-card';
import { SectionHeading } from './section-heading';

export function LatestProjects() {
  return (
    <section className="bg-muted/40 py-24">
      <div className="container-x">
        <SectionHeading
          eyebrow="New & Investment"
          title="Latest opportunities"
          subtitle="Freshly launched and high-appreciation projects, curated for smart buyers."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: (i % 3) * 0.08, duration: 0.5 }}
            >
              <ProjectCard project={p} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
