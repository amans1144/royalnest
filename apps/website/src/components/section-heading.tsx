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
      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
        {eyebrow}
      </span>
      <h2
        className={`mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl ${
          light ? 'text-white' : 'text-foreground'
        }`}
      >
        {title}
      </h2>
      {center && <div className="gold-divider mt-5" />}
      {subtitle && (
        <p className={`mt-4 text-lg ${light ? 'text-white/70' : 'text-muted-foreground'}`}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}
