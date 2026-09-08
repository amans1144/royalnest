'use client';

import { motion } from 'framer-motion';
import { SectionHeading } from './section-heading';
import { ParallaxScene, TownshipScene } from './parallax';
import { Icon } from './icon-map';
import { Check, Phone, WhatsApp, Wallet, Percent } from './icons';
import { BRAND, INVEST_REASONS, PAYMENT_PLAN, PLC_CHARGES, PRICE_TIERS } from '../lib/site-data';

/** Shared card shell: layered gradient surface that lifts and lights up on hover. */
/**
 * Shared card shell. These sit directly over the environmental scene, so the
 * surface has to be opaque enough to read against moving foliage — the old
 * white/[0.08] glass let the township show straight through the copy.
 */
const cardBase =
  'group relative overflow-hidden rounded-3xl border border-white/20 ' +
  'bg-[hsl(var(--band-1)/0.9)] shadow-cinematic backdrop-blur-xl ' +
  'transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 ' +
  'hover:shadow-2xl hover:shadow-primary/10';

/** Hairline that ignites along the top edge on hover. */
function TopAccent() {
  return (
    <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
  );
}

export function WhyInvest() {
  return (
    <ParallaxScene
      id="why-invest"
      /* `on-forest` re-scopes --primary to a light leaf green for everything
         inside, so every text-primary accent stays legible on this dark band. */
      className="band-forest on-forest py-24 text-navy-foreground"
    >
      {/* Environmental depth — township silhouettes drifting behind the copy. */}
      <TownshipScene tone="forest" intensity={0.4} showSun={false} />

      {/* Ambient light bloom */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,hsl(var(--primary)/0.14),transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_70%,hsl(var(--primary)/0.08),transparent_40%)]" />

      <div className="container-x relative">
        <SectionHeading
          center
          light
          eyebrow="Why Invest"
          title="Plots at a Pre-RERA Launch Advantage"
          subtitle="A pre-RERA launch on a corridor backed by 5,000+ acres of planned government development. Speak to an advisor for current rates and availability."
        />

        {/* ══ Price cards ══ */}
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {PRICE_TIERS.map((t, i) => {
            return (
              <motion.article
                key={t.type}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                /* Ivory brochure card on the forest band — the contrast is what
                   makes the pricing read as the page's most important object. */
                className="on-ivory group relative overflow-hidden rounded-3xl border border-white/70 bg-[hsl(var(--ivory))] dark:border-white/10 p-7 text-foreground shadow-cinematic transition-transform duration-500 ease-out-soft hover:-translate-y-1.5 sm:p-9"
              >
                {/* Botanical hairline along the top edge */}
                <span className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary via-[hsl(var(--leaf))] to-transparent" />
                <span className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[hsl(var(--leaf)/0.14)] blur-2xl" />

                <div className="relative">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2.5">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                        <Icon name={t.icon} width={20} height={20} />
                      </span>
                      <span className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground">
                        {t.type}
                      </span>
                    </span>
                    <span className="rounded-full border border-primary/25 bg-primary/[0.07] px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-primary">
                      Pre-RERA
                    </span>
                  </div>

                  {/* No rate is published. Pricing moves with the launch stage, so
                      it is shared by an advisor rather than printed here. */}
                  <div className="mt-8 rounded-2xl border border-border bg-[hsl(var(--secondary))] p-5">
                    <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Current rate
                    </div>
                    <div className="mt-1.5 font-display text-3xl font-semibold leading-tight text-primary sm:text-4xl">
                      Available on request
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Sizes, facings and the applicable rate are confirmed by our team.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2.5">
                      <a
                        href={BRAND.whatsapp}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#25D366]/25 transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <WhatsApp width={16} height={16} /> Enquire on WhatsApp
                      </a>
                      <a
                        href={BRAND.phoneHref}
                        className="inline-flex items-center gap-2 rounded-xl border border-primary/40 px-4 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/[0.06]"
                      >
                        <Phone width={16} height={16} /> Call Now
                      </a>
                    </div>
                  </div>

                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{t.note}</p>
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
            <span className="hidden text-sm text-white/70 sm:block">
              {INVEST_REASONS.length} structural drivers
            </span>
          </div>

          {/* Editorial treatment rather than a wall of cards: a hairline rule
              draws itself in, then the number, heading and copy arrive in
              sequence. Generous gutters do the work boxes used to do. */}
          <div className="mt-12 grid gap-x-12 gap-y-11 sm:grid-cols-2 lg:grid-cols-3">
            {INVEST_REASONS.map((f, i) => (
              <motion.div
                key={f.title}
                initial="rest"
                whileInView="in"
                viewport={{ once: true, margin: '-60px' }}
                transition={{ staggerChildren: 0.09, delayChildren: (i % 3) * 0.07 }}
                className="group relative pt-7"
              >
                <motion.span
                  aria-hidden
                  variants={{ rest: { scaleX: 0 }, in: { scaleX: 1 } }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-white/55 via-white/20 to-transparent"
                />

                <motion.div
                  variants={{ rest: { opacity: 0, y: 14 }, in: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-4"
                >
                  <span className="font-display text-4xl font-bold leading-none text-white/70 transition-colors duration-500 group-hover:text-primary">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 transition-transform duration-500 ease-out-soft group-hover:scale-110">
                    <Icon name={f.icon} width={22} height={22} />
                  </span>
                </motion.div>

                <motion.h4
                  variants={{ rest: { opacity: 0, y: 14 }, in: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-5 font-display text-xl font-semibold text-white"
                >
                  {f.title}
                </motion.h4>
                <motion.p
                  variants={{ rest: { opacity: 0, y: 14 }, in: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-2.5 text-sm leading-relaxed text-white/80"
                >
                  {f.text}
                </motion.p>
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

              {/* Journey: a vertical rail on mobile, a horizontal one from sm up.
                  The rail is drawn once behind the markers rather than as
                  per-item connectors, so it stays continuous at any width. */}
              <ol className="relative mt-9 grid gap-8 sm:grid-cols-3 sm:gap-6">
                <span
                  aria-hidden
                  className="absolute left-[1.4rem] top-4 h-[calc(100%-2rem)] w-px bg-gradient-to-b from-primary/70 via-primary/40 to-primary/5 sm:left-[16.6%] sm:right-[16.6%] sm:top-[1.4rem] sm:h-px sm:w-auto sm:bg-gradient-to-r sm:from-primary/60 sm:via-primary/40 sm:to-primary/10"
                />
                {PAYMENT_PLAN.map((s, i) => (
                  <motion.li
                    key={s.pct}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex gap-4 sm:block sm:text-center"
                  >
                    <span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border border-primary/45 bg-[hsl(var(--band-2))] font-display text-base font-bold text-primary shadow-[0_0_0_6px_hsl(var(--band-2))] sm:mx-auto">
                      {i + 1}
                    </span>
                    <div className="min-w-0 sm:mt-5">
                      <span className="inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-white/80">
                        Step {i + 1}
                      </span>
                      <div className="mt-3 font-display text-5xl font-bold leading-none text-gradient-gold">
                        {s.pct}
                      </div>
                      <div className="mt-2.5 text-sm font-semibold text-white">{s.title}</div>
                      <p className="mt-1.5 text-xs leading-relaxed text-white/75">{s.text}</p>
                    </div>
                  </motion.li>
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
              <p className="mt-1.5 text-xs text-white/65">Preferential Location Charges</p>

              <ul className="mt-6 grid gap-3">
                {PLC_CHARGES.map((c) => (
                  <li
                    key={c}
                    className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/[0.07] px-3.5 py-3 text-sm text-white/90"
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
    </ParallaxScene>
  );
}
