'use client';

import { motion } from 'framer-motion';

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center,
  light,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  center?: boolean;
  light?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}
    >
      <span className="inline-flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
        {/* Botanical tick — a single leaf-green mark, not an icon set. */}
        <span aria-hidden className="h-px w-6 bg-primary/60" />
        {eyebrow}
        {center && <span aria-hidden className="h-px w-6 bg-primary/60" />}
      </span>
      <h2
        className={`mt-4 font-display text-[2.35rem] font-semibold leading-[1.08] sm:text-5xl lg:text-[3.4rem] ${
          light ? 'text-white' : 'text-foreground'
        }`}
      >
        {title}
      </h2>
      {center && <div className="gold-divider mt-5" />}
      {subtitle && (
        <p className={`mt-4 text-lg ${light ? 'text-white/85' : 'text-muted-foreground'}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
