import Link from 'next/link';
import { Navbar } from './navbar';
import { Footer } from './footer';
import { FloatingActions } from './floating-actions';
import { BRAND } from '../lib/site-data';

/**
 * Shared shell for the policy pages. Same dark page header as /gallery and
 * /marketing (the navbar is transparent until scrolled, so every non-home route
 * needs a dark band under it), then a single readable prose column.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-navy pb-14 pt-36 text-navy-foreground">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.12),transparent_65%)]" />
          <div className="container-x relative">
            <nav className="text-sm text-white/50">
              <Link href="/" className="transition-colors hover:text-primary">
                Home
              </Link>
              <span className="px-2">/</span>
              <span className="text-white/80">{title}</span>
            </nav>
            <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
              {title}
            </h1>
            <p className="mt-3 text-sm text-white/60">Last updated {updated}</p>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="container-x">
            {/* Not using @tailwindcss/typography — it isn't a dependency here, so
                the handful of elements these pages use are styled directly. */}
            <div
              className="mx-auto max-w-3xl [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:text-muted-foreground [&_p]:mt-4 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:mt-4 [&_ul]:grid [&_ul]:gap-2.5 [&_ul]:pl-5 [&_ul]:[list-style:disc]"
            >
              {children}

              <div className="mt-12 rounded-2xl border border-border bg-card p-6">
                <h2 className="!mt-0 font-display text-xl font-semibold">Contact us</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Questions about this page? Write to{' '}
                  <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a> or call{' '}
                  <a href={BRAND.phoneHref}>{BRAND.phone}</a>. Our office is at {BRAND.address}.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <FloatingActions />
    </>
  );
}
