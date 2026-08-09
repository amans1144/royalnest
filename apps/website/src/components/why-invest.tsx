'use client';

import { motion } from 'framer-motion';
import { SectionHeading } from './section-heading';
import { Icon } from './icon-map';
import { ArrowRight, Check, TrendingUp, Wallet, Percent } from './icons';
import {
  INVEST_REASONS,
  PAYMENT_PLAN,
  PLC_CHARGES,
  PRICE_TIERS,
  priceUpliftPct,
} from '../lib/site-data';

/** Shared card shell: layered gradient surface that lifts and lights up on hover. */
const cardBase =
  'group relative overflow-hidden rounded-3xl border border-white/10 ' +
  'bg-gradient-to-b from-white/[0.08] to-white/[0.02] backdrop-blur ' +
  'transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 ' +
  'hover:shadow-2xl hover:shadow-primary/10';

/** Hairline that ignites along the top edge on hover. */
function TopAccent() {
  return (
    <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
  );
}

/** Soft spotlight that blooms behind the card contents on hover. */
function Spotlight({ className = 'right-0 top-0' }: { className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute ${className} h-40 w-40 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
    />
  );
}

export function WhyInvest() {
  return (
    <section
      id="why-invest"
      className="relative overflow-hidden py-24 text-navy-foreground"
      /* Lighter slate→teal band rather than flat navy. Sits around 32%
         lightness, so white body copy still clears ~7:1 contrast. */
      style={{
        backgroundImage:
          'linear-gradient(135deg, hsl(206 38% 36%) 0%, hsl(214 38% 30%) 45%, hsl(190 34% 32%) 100%)',
      }}
    >
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,hsl(var(--primary)/0.18),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_70%,hsl(var(--primary)/0.1),transparent_40%)]" />

      <div className="container-x relative">
        <SectionHeading
          center
          light
          eyebrow="Why Invest"
          title="Buy Before RERA. Gain From Day One."
          subtitle="A pre-RERA entry price on a corridor backed by 5,000+ acres of planned government development."
        />

        {/* ══ Price cards ══ */}
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {PRICE_TIERS.map((t, i) => {
            const uplift = priceUpliftPct(t);
            return (
              <motion.article
                key={t.type}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`${cardBase} p-7 sm:p-8`}
              >
                <TopAccent />
                <Spotlight />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2.5">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 text-primary ring-1 ring-primary/25">
                        <Icon name={t.icon} width={20} height={20} />
                      </span>
                      <span className="text-sm font-semibold uppercase tracking-[0.15em] text-white">
                        {t.type}
                      </span>
                    </span>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-primary">
                      Pre-RERA
                    </span>
                  </div>

                  {/* Today → After RERA */}
                  <div className="mt-7 flex flex-wrap items-end gap-x-5 gap-y-4">
                    <div>
                      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary/80">
                        Book today
                      </div>
                      <div className="mt-1 font-display text-5xl font-bold leading-none text-gradient-gold sm:text-6xl">
                        {t.now}
                      </div>
                    </div>

                    <span className="mb-2 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-primary ring-1 ring-white/15">
                      <ArrowRight width={16} height={16} />
                    </span>

                    <div className="mb-1">
                      <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/40">
                        After RERA
                      </div>
                      <div className="mt-1 font-display text-3xl font-semibold leading-none text-white/45 line-through decoration-primary/60 decoration-2">
                        {t.after}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-white/55">{t.unit}</div>

                  {/* Uplift bar */}
                  <div className="mt-6 rounded-2xl border border-white/10 bg-navy/50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2 font-medium text-white/80">
                        <TrendingUp width={16} height={16} className="text-primary" />
                        Price revision on approval
                      </span>
                      <span className="font-display text-xl font-bold text-primary">
                        +{uplift}%
                      </span>
                    </div>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min(100, uplift * 3)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-primary"
                      />
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-relaxed text-white/60">{t.note}</p>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* ══ Fundamentals ══ */}
        <div className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                The Fundamentals
              </span>
              <h3 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
                Strong Fundamentals for High Appreciation
              </h3>
            </div>
            <span className="hidden text-sm text-white/50 sm:block">
              {INVEST_REASONS.length} structural drivers
            </span>
          </div>

          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {INVEST_REASONS.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
                className={`${cardBase} p-6`}
              >
                <TopAccent />
                <Spotlight />

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/5 text-primary ring-1 ring-primary/25 transition-transform duration-300 group-hover:scale-110">
                      <Icon name={f.icon} width={26} height={26} />
                    </span>
                    <span className="font-display text-3xl font-bold leading-none text-white/10 transition-colors duration-300 group-hover:text-primary/40">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h4 className="mt-5 font-display text-xl font-semibold text-white">
                    {f.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{f.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ══ Payment plan + PLC ══ */}
        <div className="mt-20 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className={`${cardBase} p-7 sm:p-8`}
          >
            <TopAccent />
            <div className="relative">
              <h3 className="inline-flex items-center gap-2.5 font-display text-2xl font-semibold text-white">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/5 text-primary ring-1 ring-primary/25">
                  <Wallet width={18} height={18} />
                </span>
                Flexible Payment Plan
              </h3>

              <ol className="mt-7 grid gap-4 sm:grid-cols-3">
                {PAYMENT_PLAN.map((s, i) => (
                  <li
                    key={s.pct}
                    className="relative rounded-2xl border border-white/10 bg-navy/50 p-5 text-center transition-colors hover:border-primary/30"
                  >
                    {/* Connector between steps on wide screens */}
                    {i < PAYMENT_PLAN.length - 1 && (
                      <span className="absolute -right-2 top-1/2 z-10 hidden h-px w-4 bg-gradient-to-r from-primary/50 to-transparent sm:block" />
                    )}
                    <span className="inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white/60">
                      Step {i + 1}
                    </span>
                    <div className="mt-3 font-display text-4xl font-bold text-gradient-gold">
                      {s.pct}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-white">{s.title}</div>
                    <p className="mt-1.5 text-xs leading-relaxed text-white/55">{s.text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`${cardBase} p-7 sm:p-8`}
          >
            <TopAccent />
            <div className="relative">
              <h3 className="inline-flex items-center gap-2.5 font-display text-2xl font-semibold text-white">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/5 text-primary ring-1 ring-primary/25">
                  <Percent width={18} height={18} />
                </span>
                PLC &amp; Charges
              </h3>
              <p className="mt-1.5 text-xs text-white/45">Preferential Location Charges</p>

              <ul className="mt-6 grid gap-3">
                {PLC_CHARGES.map((c) => (
                  <li
                    key={c}
                    className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-navy/40 px-3.5 py-3 text-sm text-white/70"
                  >
                    <Check width={16} height={16} className="mt-0.5 shrink-0 text-primary" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
