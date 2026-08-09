'use client';

import { useState } from 'react';
import { Button } from '@spb/ui';
import { Phone, Sparkle } from './icons';

export function ContactCta() {
  const [sent, setSent] = useState(false);

  return (
    <section id="contact" className="py-24">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[2rem] bg-neutral-950 px-6 py-16 text-white sm:px-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm">
                <Sparkle width={16} height={16} className="text-amber-300" /> Book a private tour
              </span>
              <h2 className="mt-6 font-display text-4xl font-semibold leading-tight sm:text-5xl">
                Let’s find your next address.
              </h2>
              <p className="mt-4 max-w-md text-white/70">
                Share your details and a relationship manager will curate options that match your
                budget and preferences — usually within a few hours.
              </p>
              <a
                href="tel:+911800000000"
                className="mt-8 inline-flex items-center gap-3 text-lg font-medium"
              >
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white/10">
                  <Phone width={18} height={18} />
                </span>
                +91 1800 000 000
              </a>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
              className="rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl sm:p-8"
            >
              {sent ? (
                <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/20 text-emerald-400">
                    ✓
                  </div>
                  <h3 className="mt-4 font-display text-2xl font-semibold">Thank you!</h3>
                  <p className="mt-2 text-white/70">
                    Your enquiry is in. Our team will reach out shortly.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Field label="Full name" placeholder="Your name" />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Phone" placeholder="+91 …" type="tel" />
                    <Field label="Email" placeholder="you@email.com" type="email" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-white/70">Interested in</label>
                    <select className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm outline-none [&>option]:text-black">
                      <option>Luxury Villa</option>
                      <option>Residential Plot</option>
                      <option>Apartment</option>
                      <option>Commercial Space</option>
                    </select>
                  </div>
                  <Button type="submit" size="lg" className="w-full">
                    Request a callback
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  placeholder,
  type = 'text',
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-white/70">{label}</label>
      <input
        type={type}
        required
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm outline-none transition-colors placeholder:text-white/40 focus:border-primary"
      />
    </div>
  );
}
