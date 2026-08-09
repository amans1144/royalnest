import Image from 'next/image';
import { MapPin, Phone, Mail } from './icons';
import { BRAND, NAV_LINKS, PROJECT, THEME_GARDENS } from '../lib/site-data';

export function Footer() {
  return (
    <footer className="bg-navy text-navy-foreground">
      <div className="container-x grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
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
          <p className="mt-4 max-w-xs text-sm text-white/60">{BRAND.tagline}.</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70">
            RERA Reg. No. {BRAND.rera}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
            Quick Links
          </h4>
          <ul className="mt-4 grid gap-2.5 text-sm text-white/60">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="transition-colors hover:text-primary">
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
          <ul className="mt-4 grid gap-2.5 text-sm text-white/60">
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
          <ul className="mt-4 grid gap-3 text-sm text-white/60">
            <li className="flex items-start gap-2.5">
              <MapPin width={16} height={16} className="mt-0.5 shrink-0 text-primary" />
              {BRAND.address}
            </li>
            <li className="flex items-center gap-2.5">
              <Phone width={16} height={16} className="shrink-0 text-primary" />
              <a href={BRAND.phoneHref} className="hover:text-primary">
                {BRAND.phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail width={16} height={16} className="shrink-0 text-primary" />
              <a href={`mailto:${BRAND.email}`} className="hover:text-primary">
                {BRAND.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/50 sm:flex-row">
          <p>© {BRAND.since === 2009 ? 2026 : BRAND.since} RoyalNest Realty. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-primary">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-primary">
              Terms &amp; Conditions
            </a>
            <a href="#" className="hover:text-primary">
              Sitemap
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
