import { partners } from '../lib/mock-data';

/** Trust marquee of partner/financier wordmarks. */
export function Partners() {
  const row = [...partners, ...partners];
  return (
    <section className="border-y border-border/60 py-12">
      <div className="container-x">
        <p className="text-center text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Trusted by leading banks & channel partners
        </p>
        <div className="group relative mt-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-16 group-hover:[animation-play-state:paused]">
            {row.map((p, i) => (
              <span
                key={`${p}-${i}`}
                className="whitespace-nowrap font-display text-2xl font-semibold tracking-wide text-muted-foreground/70"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </section>
  );
}
