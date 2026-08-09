'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@spb/ui';
import { Check, MapPin, CalendarCheck } from './icons';
import { BUDGET_OPTIONS, LOCATION_OPTIONS } from '../lib/site-data';

export function BookingForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="book" className="relative z-10 -mt-16">
      <div className="container-x">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-2xl shadow-navy/10"
        >
          <div className="grid lg:grid-cols-[1.1fr_1.4fr]">
            {/* Left panel */}
            <div className="relative flex flex-col justify-center gap-4 bg-navy p-8 text-navy-foreground sm:p-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.25),transparent_50%)]" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  <CalendarCheck width={15} height={15} /> Free Site Visit
                </span>
                <h3 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
                  Book Your Plot Visit
                </h3>
                <p className="mt-3 max-w-sm text-white/70">
                  Tell us your budget and preferred corridor. A RoyalNest advisor will call within
                  24 hours to arrange a complimentary, no-obligation site visit.
                </p>
                <ul className="mt-6 space-y-2.5 text-sm text-white/80">
                  {['RERA-verified plots only', 'Zero brokerage from buyers', 'Pick-up & drop on request'].map(
                    (t) => (
                      <li key={t} className="flex items-center gap-2.5">
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/20 text-primary">
                          <Check width={13} height={13} />
                        </span>
                        {t}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>

            {/* Right form */}
            <div className="p-8 sm:p-10">
              {submitted ? (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary">
                    <Check width={32} height={32} />
                  </span>
                  <h4 className="mt-5 font-display text-2xl font-semibold">Thank you!</h4>
                  <p className="mt-2 max-w-sm text-muted-foreground">
                    Your visit request has been received. Our team will reach out shortly to confirm
                    your preferred date and time.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitted(true);
                  }}
                  className="grid gap-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full Name">
                      <input required className={inputCls} placeholder="Your name" />
                    </Field>
                    <Field label="Phone Number">
                      <input
                        required
                        type="tel"
                        className={inputCls}
                        placeholder="+91 ..."
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Budget Range">
                      <select required defaultValue="" className={inputCls}>
                        <option value="" disabled>
                          Select budget
                        </option>
                        {BUDGET_OPTIONS.map((b) => (
                          <option key={b}>{b}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Preferred Location">
                      <select required defaultValue="" className={inputCls}>
                        <option value="" disabled>
                          Select corridor
                        </option>
                        {LOCATION_OPTIONS.map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Message (optional)">
                    <textarea
                      rows={3}
                      className={inputCls}
                      placeholder="Tell us what you're looking for..."
                    />
                  </Field>

                  <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <input required type="checkbox" className="mt-0.5 accent-[hsl(var(--primary))]" />
                    <span>
                      I agree to be contacted by RoyalNest Realty and accept the privacy policy.
                    </span>
                  </label>

                  <Button type="submit" size="lg" className="mt-1 w-full">
                    <MapPin width={18} height={18} /> Book My Site Visit
                  </Button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const inputCls =
  'w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
