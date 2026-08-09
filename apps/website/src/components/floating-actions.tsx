'use client';

import { Phone, WhatsApp } from './icons';
import { BRAND } from '../lib/site-data';

export function FloatingActions() {
  return (
    /* Smaller and tighter to the corner on phones so they intrude less on the
       content underneath; full size from sm up. */
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2.5 sm:bottom-5 sm:right-5 sm:gap-3">
      <a
        href={BRAND.whatsapp}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat on WhatsApp"
        className="grid h-12 w-12 place-items-center rounded-full bg-[#25D366] text-white shadow-xl shadow-[#25D366]/40 transition-transform hover:scale-110 sm:h-14 sm:w-14"
      >
        <WhatsApp width={22} height={22} className="sm:h-[26px] sm:w-[26px]" />
      </a>
      <a
        href={BRAND.phoneHref}
        aria-label="Call now"
        className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/40 transition-transform hover:scale-110 sm:h-14 sm:w-14"
      >
        <Phone width={20} height={20} className="sm:h-6 sm:w-6" />
      </a>
    </div>
  );
}
