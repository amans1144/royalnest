'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

/** Count up to `value` when scrolled into view. */
export function AnimatedCounter({
  value,
  suffix = '',
  duration = 1.8,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();

  /**
   * `null` means "not counting" — and then the REAL value is what renders.
   * Starting from a literal 0 meant that until the scroll observer fired, the
   * page published "0 km" and "0 min" as if they were the figures. Anything
   * that never triggers the observer — reduced motion, a crawler, a
   * screenshot, an element already past on load — showed zeroes as fact.
   * The count-up is now a progressive enhancement over the true number.
   */
  const [display, setDisplay] = useState<number | null>(null);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.floor(v)),
      onComplete: () => setDisplay(value),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref}>
      {(display ?? value).toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}
