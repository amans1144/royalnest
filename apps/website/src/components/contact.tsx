'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@spb/ui';
import { SectionHeading } from './section-heading';
import { ParallaxScene, HorizonScene } from './parallax';
import { MapPin, Phone, Mail, Check, WhatsApp } from './icons';
import { BRAND, HAS_PHONE, HAS_WHATSAPP, INTEREST_OPTIONS } from '../lib/site-data';

const details = [
  { icon: MapPin, label: 'Office', value: BRAND.address },
  // The phone card is omitted entirely rather than rendered empty while there
  // is no published number.
  ...(HAS_PHONE
    ? [{ icon: Phone, label: 'Phone', value: BRAND.phone, href: BRAND.phoneHref }]
    : []),
  { icon: Mail, label: 'Email', value: BRAND.email, href: `mailto:${BRAND.email}` },
];

/* Spacious, quiet fields with an unmistakable green focus state (§14). */
const inputCls =
  'w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition-all duration-200 ' +
  'placeholder:text-muted-foreground/70 hover:border-primary/35 ' +
  'focus:border-primary focus:ring-4 focus:ring-primary/12';

export function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError(null);

    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? 'Something went wrong. Please email us instead.');
        return;
      }
      setSubmitted(true);
    } catch {
      // Offline, DNS, blocked request — the enquiry never left the browser.
      setError('Could not reach the server. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <ParallaxScene
      id="contact"
      className="bg-gradient-to-b from-[hsl(var(--cream))] via-background to-[hsl(var(--cream))] py-24"
    >
      {/* A quiet garden edge under the form — warmth without distraction. */}
      <HorizonScene tone="light" />
      <div className="container-x relative">
        <SectionHeading
          center
          eyebrow="Contact"
          title="Book Your Site Visit"
          subtitle="Get complete project details and current availability for Liberty Imperial Greens — our advisors respond within one business day."
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="flex min-w-0 flex-col gap-4"
          >
            {details.map((d) => (
              <div
                key={d.label}
                className="flex min-w-0 items-start gap-4 rounded-2xl border border-border/70 bg-card p-4 sm:p-5"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <d.icon width={20} height={20} />
                </span>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {d.label}
                  </div>
                  {d.href ? (
                    <a href={d.href} className="break-words font-medium hover:text-primary">
                      {d.value}
                    </a>
                  ) : (
                    <div className="break-words font-medium">{d.value}</div>
                  )}
                </div>
              </div>
            ))}
            {HAS_WHATSAPP && (
              <a href={BRAND.whatsapp} target="_blank" rel="noreferrer">
                <Button size="lg" className="w-full bg-[#25D366] text-white hover:bg-[#1fb457]">
                  <WhatsApp width={18} height={18} /> Chat on WhatsApp
                </Button>
              </a>
            )}
          </motion.div>

          {/* Enquiry form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6 }}
            className="min-w-0 rounded-3xl border border-border/70 bg-card p-6 shadow-lg shadow-navy/5 sm:p-8"
          >
            <h3 className="font-display text-2xl font-semibold">Quick Enquiry</h3>
            {submitted ? (
              <div className="mt-8 flex flex-col items-center justify-center py-10 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check width={32} height={32} />
                </span>
                <h4 className="mt-4 font-display text-xl font-semibold">Message sent!</h4>
                <p className="mt-2 max-w-sm text-muted-foreground">
                  Thanks for reaching out. A Royalnest advisor will contact you within one business
                  day.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Full name"
                    className={inputCls}
                  />
                  <input
                    name="phone"
                    required
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="Phone number"
                    className={inputCls}
                  />
                </div>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email address"
                  className={inputCls}
                />
                <select name="interest" required defaultValue="" className={inputCls}>
                  <option value="" disabled>
                    I’m interested in…
                  </option>
                  {INTEREST_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <textarea
                  name="message"
                  rows={4}
                  placeholder="Your message"
                  className={inputCls}
                />

                {/* Honeypot — hidden from people, irresistible to bots. Off-screen
                    rather than display:none, which some bots skip, and
                    aria-hidden + tabIndex keep it away from screen readers and
                    keyboard users. */}
                <input
                  name="_hp"
                  tabIndex={-1}
                  aria-hidden
                  autoComplete="off"
                  className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
                />

                {error && (
                  <p role="alert" className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}

                {/* `loading` both disables the button and renders the spinner. */}
                <Button type="submit" size="lg" className="w-full" loading={sending}>
                  {sending ? 'Sending…' : 'Send Enquiry'}
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </ParallaxScene>
  );
}
