import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Mail } from './icons';
import { TreeLine } from './parallax';
import { BRAND, NAV_LINKS, PROJECT, THEME_GARDENS } from '../lib/site-data';

export function Footer() {
  return (
    <footer className="on-forest relative overflow-hidden bg-navy text-navy-foreground">
      {/* A treeline along the very base of the page, closing the landscape. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28" aria-hidden>
        <TreeLine className="text-black" style={{ opacity: 0.16, filter: 'blur(2.5px)' }} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--primary)/0.12),transparent_65%)]" />
      <div className="container-x relative grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-white/10">
              <Image
                src="/royal-nest-logo.png"
                alt="RoyalNest Realty"
                width={44}
                height={44}
                className="h-10 w-10 object-contain"
              />
            </span>
            <div className="leading-none">
              <div className="font-display text-lg font-bold text-white">RoyalNest</div>
              <div className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-primary">
                Realty
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm text-white/80">{BRAND.tagline}.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/85">
            RERA Reg. No. {BRAND.rera}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
            Quick Links
          </h4>
          {/* Inline links here were ~17px tall — well under a comfortable touch
              target. The anchors are blocks with their own padding (and the list
              loses the gap that padding now provides), so the row is easy to hit
              on a phone while looking unchanged on desktop. */}
          <ul className="mt-2 grid text-sm text-white/80">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="-mx-2 block rounded-lg px-2 py-2 transition-colors hover:text-primary"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Project */}
        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
            {PROJECT.name}
          </h4>
          <ul className="mt-4 grid gap-2.5 text-sm text-white/80">
            <li>{PROJECT.tagline}</li>
            <li>{PROJECT.locality}</li>
            <li>On {PROJECT.highway}</li>
            <li>{THEME_GARDENS.length} theme-based gardens</li>
            <li>{PROJECT.sportsArea} sports area</li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
            Get in Touch
          </h4>
          <ul className="mt-4 grid gap-3 text-sm text-white/80">
            <li className="flex items-start gap-2.5">
              <MapPin width={16} height={16} className="mt-0.5 shrink-0 text-primary" />
              {BRAND.address}
            </li>
            {/* The two actionable rows get padding so tapping them on a phone
                is reliable; the address above stays plain text. */}
            <li className="flex items-center gap-2.5">
              <Phone width={16} height={16} className="shrink-0 text-primary" />
              <a href={BRAND.phoneHref} className="-my-1.5 break-all py-1.5 hover:text-primary">
                {BRAND.phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail width={16} height={16} className="shrink-0 text-primary" />
              <a
                href={`mailto:${BRAND.email}`}
                className="-my-1.5 break-all py-1.5 hover:text-primary"
              >
                {BRAND.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-white/75 sm:flex-row sm:gap-3">
          {/* Rendered on the server at request/build time, so the notice can
              never sit on a stale hard-coded year. */}
          <p>© {new Date().getFullYear()} RoyalNest Realty. All rights reserved.</p>
          {/* Generous vertical padding gives these a real tap target on a phone
              without changing how the row looks on desktop. */}
          <div className="-mx-2 flex flex-wrap justify-center gap-x-2 gap-y-1">
            <Link href="/privacy" className="rounded px-2 py-2 hover:text-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="rounded px-2 py-2 hover:text-primary">
              Terms &amp; Conditions
            </Link>
            <a href="/sitemap.xml" className="rounded px-2 py-2 hover:text-primary">
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
