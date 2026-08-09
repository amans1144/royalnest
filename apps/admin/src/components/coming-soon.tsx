'use client';

import { Shell } from './shell';

export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <Shell title={title}>
      <div className="grid min-h-[60vh] place-items-center">
        <div className="max-w-md rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <span className="text-2xl">✦</span>
          </div>
          <h2 className="mt-4 text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{note}</p>
          <span className="mt-4 inline-block rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Ships in an upcoming phase
          </span>
        </div>
      </div>
    </Shell>
  );
}
