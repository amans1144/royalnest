import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '../../components/navbar';
import { Footer } from '../../components/footer';
import { FloatingActions } from '../../components/floating-actions';
import { MarketingBrowser } from '../../components/marketing-browser';
import { BRAND, PROJECT } from '../../lib/site-data';
import { OG_IMAGE, breadcrumbJsonLd, jsonLdScript } from '../../lib/seo';

const DESCRIPTION = `Download brochures, price lists, site plans and walkthrough videos for ${PROJECT.name}, ${PROJECT.locality}, ${PROJECT.city}.`;

export const metadata: Metadata = {
  title: 'Marketing Material',
  description: DESCRIPTION,
  alternates: { canonical: '/marketing' },
  openGraph: {
    type: 'article',
    url: '/marketing',
    title: `Marketing Material — ${PROJECT.name}`,
    description: DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1600, height: 900, alt: `${PROJECT.name} brochure` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Marketing Material — ${PROJECT.name}`,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function MarketingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Marketing Material', path: '/marketing' },
          ]),
        )}
      />
      <Navbar />
      <main>
        {/* ── Page header (dark band keeps the transparent navbar legible) ── */}
        <section className="relative overflow-hidden bg-navy pb-16 pt-36 text-navy-foreground">
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=2000&q=80"
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
              <span className="text-white/80">Marketing Material</span>
            </nav>

            <span className="mt-6 block text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Marketing Material
            </span>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              Brochures, plans &amp; videos
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-white/70">
              Everything you need to evaluate {PROJECT.name} — download the brochure and price
              list, study the site plan, or watch the township walkthrough.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={BRAND.whatsapp}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-xl bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/20 transition-opacity hover:opacity-90"
              >
                Get it on WhatsApp
              </a>
              <a
                href={BRAND.phoneHref}
                className="rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Call {BRAND.phone}
              </a>
            </div>
          </div>
        </section>

        <section className="py-14">
          <div className="container-x">
            <MarketingBrowser />
          </div>
        </section>
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
