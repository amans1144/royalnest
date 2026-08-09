import type { PlotStatus } from '@spb/types';
import { PLOT_STATUS_COLOR, PLOT_STATUS_LABEL } from '@spb/types';

const ORDER: PlotStatus[] = ['AVAILABLE', 'RESERVED', 'BOOKED', 'SOLD', 'BLOCKED'];

interface PlotLegendProps {
  counts?: Partial<Record<PlotStatus, number>>;
  className?: string;
}

/** Legend for the interactive plot map — colors sourced from the shared status map. */
export function PlotLegend({ counts, className }: PlotLegendProps) {
  return (
    <div className={className}>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {ORDER.map((status) => (
          <li key={status} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: PLOT_STATUS_COLOR[status] }}
            />
            <span className="text-muted-foreground">{PLOT_STATUS_LABEL[status]}</span>
            {counts?.[status] != null && (
              <span className="font-semibold tabular-nums">{counts[status]}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
