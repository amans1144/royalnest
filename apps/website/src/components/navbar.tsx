'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@spb/ui';
import { ThemeToggle } from './theme-toggle';
import { Menu, X, Phone, WhatsApp } from './icons';
import { BRAND, NAV_LINKS } from '../lib/site-data';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-border/60 bg-background/85 py-2 shadow-sm backdrop-blur-xl'
          : 'bg-transparent py-3'
      }`}
    >
      <nav className="container-x flex items-center justify-between">
        {/* Logo mark is 2.5× its old 44px at rest on desktop (110px). It steps
            down on mobile and again once scrolled, so the header never eats the
            viewport on small screens. */}
        <a href="/#home" className="flex shrink-0 items-center gap-2.5 sm:gap-3.5">
          <span
            className={`relative grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-navy shadow-lg transition-all duration-300 ${
              scrolled
                ? 'h-11 w-11 sm:h-14 sm:w-14 lg:h-16 lg:w-16'
                : 'h-14 w-14 sm:h-20 sm:w-20 lg:h-[110px] lg:w-[110px]'
            }`}
          >
            <Image
              src="/royal-nest-logo.png"
              alt="RoyalNest Realty"
              width={110}
              height={110}
              sizes="110px"
              className="h-[85%] w-[85%] object-contain"
              priority
            />
          </span>
          <span className="flex flex-col leading-none">
            <span
              className={`font-display font-bold tracking-tight transition-all duration-300 ${
                scrolled ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl lg:text-3xl'
              } ${scrolled ? 'text-foreground' : 'text-white drop-shadow'}`}
            >
              RoyalNest
            </span>
            <span
              className={`font-semibold uppercase tracking-[0.28em] transition-all duration-300 ${
                scrolled ? 'text-[0.6rem]' : 'text-[0.6rem] sm:text-xs lg:text-sm'
              } ${scrolled ? 'text-primary' : 'text-primary/90'}`}
            >
              Realty
            </span>
          </span>
        </a>

        {/* The full link set only fits alongside the logo and the two CTAs from
            xl up — below that it collided with both, so those widths get the
            menu button instead. gap widens again at 2xl where there's room. */}
        <ul
          className={`hidden items-center gap-4 text-sm font-medium xl:flex 2xl:gap-6 ${
            scrolled ? 'text-foreground/80' : 'text-white/90'
          }`}
        >
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="whitespace-nowrap transition-colors hover:text-primary">
                {l.short ?? l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a href={BRAND.phoneHref} className="hidden sm:block">
            <Button
              size="sm"
              variant="outline"
              className={
                scrolled ? '' : 'border-white/40 text-white hover:bg-white/10 hover:text-white'
              }
            >
              <Phone width={16} height={16} /> Call Now
            </Button>
          </a>
          <a href={BRAND.whatsapp} target="_blank" rel="noreferrer" className="hidden md:block">
            <Button
              size="sm"
              className="bg-[#25D366] text-white shadow-[#25D366]/30 hover:bg-[#1fb457]"
            >
              <WhatsApp width={16} height={16} /> WhatsApp
            </Button>
          </a>
          <button
            className={`grid h-10 w-10 place-items-center rounded-full xl:hidden ${
              scrolled ? 'text-foreground' : 'text-white'
            }`}
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="container-x mt-3 xl:hidden">
          <ul className="grid gap-1 rounded-2xl border border-border/60 bg-background/95 p-3 backdrop-blur-xl">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-accent"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="mt-2 grid grid-cols-2 gap-2">
              <a href={BRAND.phoneHref}>
                <Button size="sm" variant="outline" className="w-full">
                  <Phone width={16} height={16} /> Call
                </Button>
              </a>
              <a href={BRAND.whatsapp} target="_blank" rel="noreferrer">
                <Button size="sm" className="w-full bg-[#25D366] text-white hover:bg-[#1fb457]">
                  <WhatsApp width={16} height={16} /> WhatsApp
                </Button>
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
