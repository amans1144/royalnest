'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@spb/ui';
import { SectionHeading } from './section-heading';
import { MapPin, Phone, Mail, Clock, Check, WhatsApp } from './icons';
import { BRAND, INTEREST_OPTIONS } from '../lib/site-data';

const details = [
  { icon: MapPin, label: 'Office', value: BRAND.address },
  { icon: Phone, label: 'Phone', value: BRAND.phone, href: BRAND.phoneHref },
  { icon: Mail, label: 'Email', value: BRAND.email, href: `mailto:${BRAND.email}` },
  { icon: Clock, label: 'Hours', value: BRAND.hours },
];

const inputCls =
  'w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

export function Contact() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="contact" className="bg-gradient-to-b from-accent/50 via-background to-accent/40 py-24">
      <div className="container-x">
        <SectionHeading
          center
          eyebrow="Contact"
          title="Book Your Site Visit"
          subtitle="Get the price list and live plot availability for Liberty Imperial Greens — our advisors respond within one business day."
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
            <a href={BRAND.whatsapp} target="_blank" rel="noreferrer">
              <Button size="lg" className="w-full bg-[#25D366] text-white hover:bg-[#1fb457]">
                <WhatsApp width={18} height={18} /> Chat on WhatsApp
              </Button>
            </a>
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
                  Thanks for reaching out. A RoyalNest advisor will contact you within one business
                  day.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="mt-6 grid gap-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <input required placeholder="Full name" className={inputCls} />
                  <input required type="tel" placeholder="Phone number" className={inputCls} />
                </div>
                <input type="email" placeholder="Email address" className={inputCls} />
                <select required defaultValue="" className={inputCls}>
                  <option value="" disabled>
                    I'm interested in...
                  </option>
                  {INTEREST_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <textarea rows={4} placeholder="Your message" className={inputCls} />
                <Button type="submit" size="lg" className="w-full">
                  Send Enquiry
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
