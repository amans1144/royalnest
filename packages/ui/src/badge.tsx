import * as React from 'react';
import type { PlotStatus } from '@spb/types';
import { PLOT_STATUS_COLOR, PLOT_STATUS_LABEL } from '@spb/types';
import { cn } from './lib/cn';

export const Badge = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      className,
    )}
    {...props}
  />
);

/** Status pill for a plot — color derived from the shared PLOT_STATUS_COLOR map. */
export function PlotStatusBadge({ status }: { status: PlotStatus }) {
  const color = PLOT_STATUS_COLOR[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {PLOT_STATUS_LABEL[status]}
    </span>
  );
}
