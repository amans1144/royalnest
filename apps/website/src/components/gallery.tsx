'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@spb/ui';
import { GALLERY_CATEGORIES } from '@spb/types';
import { SectionHeading } from './section-heading';
import { ArrowRight } from './icons';
import { useGallery } from '../lib/use-gallery';

export function Gallery() {
  const { images } = useGallery();
  // Six tiles — fills exactly 3 rows on mobile (2 cols) and 2 on desktop (3 cols).
  const preview = images.slice(0, 6);
  const categories = new Set(images.map((g) => g.category));

  return (
    <section id="gallery" className="relative bg-background py-24">
      <div className="container-x">
        <SectionHeading
          center
          eyebrow="Gallery"
          title="Life at Liberty Imperial Greens"
          subtitle="Aerial views, the monument entrance, wide roads, theme gardens and Club Imperial."
        />

        <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {preview.map((g, i) => (
            <motion.figure
              key={g.id}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.06 }}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted"
            >
              <img
                src={g.src}
                alt={g.label}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <figcaption className="absolute inset-0 flex flex-col items-start justify-end bg-gradient-to-t from-navy/85 via-navy/10 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-primary">
                  {g.category}
                </span>
                <span className="text-sm font-medium text-white">{g.label}</span>
              </figcaption>
            </motion.figure>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link href="/gallery">
            <Button size="lg">
              View Full Gallery <ArrowRight width={18} height={18} />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground">
            {images.length} photograph{images.length === 1 ? '' : 's'} across{' '}
            {Math.min(categories.size, GALLERY_CATEGORIES.length)} categories
          </p>
        </div>
      </div>
    </section>
  );
}
