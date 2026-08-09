import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '../../components/navbar';
import { Footer } from '../../components/footer';
import { FloatingActions } from '../../components/floating-actions';
import { GalleryBrowser } from '../../components/gallery-browser';
import { PROJECT } from '../../lib/site-data';
import { OG_IMAGE, breadcrumbJsonLd, jsonLdScript } from '../../lib/seo';

const DESCRIPTION = `Photo gallery of ${PROJECT.name}, ${PROJECT.locality}, ${PROJECT.city} — township views, amenities, theme gardens, sports zone and Club Imperial.`;

export const metadata: Metadata = {
  title: 'Gallery',
  description: DESCRIPTION,
  alternates: { canonical: '/gallery' },
  openGraph: {
    type: 'article',
    url: '/gallery',
    title: `Gallery — ${PROJECT.name}`,
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1600, height: 900, alt: `Inside ${PROJECT.name}` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Gallery — ${PROJECT.name}`,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function GalleryPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Gallery', path: '/gallery' },
          ]),
        )}
      />
      <Navbar />
      <main>
        {/* ── Page header (dark band keeps the transparent navbar legible) ── */}
        <section className="relative overflow-hidden bg-navy pb-16 pt-36 text-navy-foreground">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=2000&q=80"
              alt=""
              aria-hidden
              className="h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-navy/80 via-navy/85 to-navy" />
          </div>

          <div className="container-x relative">
            <nav className="text-sm text-white/50">
              <Link href="/" className="transition-colors hover:text-primary">
                Home
              </Link>
              <span className="px-2">/</span>
              <span className="text-white/80">Gallery</span>
            </nav>

            <span className="mt-6 block text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Gallery
            </span>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Inside {PROJECT.name}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/70">
              Township infrastructure, amenities, theme gardens, the sports zone and Club
              Imperial.
            </p>
          </div>
        </section>

        <section className="py-14">
          <div className="container-x">
            <GalleryBrowser />
          </div>
        </section>
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
