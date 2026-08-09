'use client';

import { motion } from 'framer-motion';
import { Button } from '@spb/ui';
import { SectionHeading } from './section-heading';
import { Check } from './icons';
import { PLOT_TYPES } from '../lib/site-data';

const ROWS: { key: keyof (typeof PLOT_TYPES)[number]; label: string }[] = [
  { key: 'price', label: 'Starting Price' },
  { key: 'size', label: 'Plot Size' },
  { key: 'facing', label: 'Facing' },
  { key: 'corner', label: 'Corner Plot' },
  { key: 'road', label: 'Road Width' },
  { key: 'loan', label: 'Loan Eligibility' },
  { key: 'registry', label: 'Registry' },
  { key: 'status', label: 'Development' },
];

export function PlotComparison() {
  return (
    <section className="py-24">
      <div className="container-x">
        <SectionHeading
          center
          eyebrow="Compare Plots"
          title="Find the Right Fit"
          subtitle="A side-by-side look at our most popular plot configurations."
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="mt-14 overflow-x-auto"
        >
          <table className="w-full min-w-[640px] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 bg-background p-4 text-left align-bottom text-sm font-medium text-muted-foreground">
                  Specification
                </th>
                {PLOT_TYPES.map((p) => (
                  <th
                    key={p.name}
                    className={`p-4 text-center ${
                      p.featured
                        ? 'rounded-t-2xl bg-navy text-navy-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {p.featured && (
                      <span className="mb-2 inline-block rounded-full bg-primary px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary-foreground">
                        Most Popular
                      </span>
                    )}
                    <div className="font-display text-lg font-semibold">{p.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, ri) => (
                <tr key={row.key}>
                  <td className="sticky left-0 bg-background p-4 text-sm font-medium text-muted-foreground">
                    {row.label}
                  </td>
                  {PLOT_TYPES.map((p) => {
                    const val = p[row.key] as string;
                    const positive = ['Eligible', 'Ready', 'Yes', 'Developed'].includes(val);
                    return (
                      <td
                        key={p.name}
                        className={`border-t border-border/60 p-4 text-center text-sm ${
                          p.featured ? 'bg-navy/[0.03] font-medium dark:bg-white/[0.03]' : ''
                        } ${ri === ROWS.length - 1 && p.featured ? 'rounded-b-2xl' : ''}`}
                      >
                        {positive ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                            <Check width={15} height={15} /> {val}
                          </span>
                        ) : (
                          val
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td className="bg-background p-4" />
                {PLOT_TYPES.map((p) => (
                  <td key={p.name} className="p-4 text-center">
                    <a href="#book">
                      <Button size="sm" variant={p.featured ? 'primary' : 'outline'}>
                        Enquire
                      </Button>
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
