import type { SVGProps } from 'react';

const b = (p: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...p,
});

export const X = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
export const Plus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const Pencil = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
);
export const Trash = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" /></svg>
);
export const Grid = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
);
export const Building = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M4 22V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v18M15 9h4a1 1 0 0 1 1 1v12M8 7h3M8 11h3M8 15h3" /></svg>
);
export const Map = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2zM9 3v16M15 5v16" /></svg>
);
export const Receipt = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1zM8 7h8M8 11h8M8 15h5" /></svg>
);
export const Users = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
export const User = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);
export const Chart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M3 3v18h18M7 15l3-4 3 3 4-6" /></svg>
);
export const Clock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>
);
export const Image = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>
);
export const Settings = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9 2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2 2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9z" /></svg>
);
export const Bell = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
);
export const Search = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
);
export const Logout = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
);
export const Menu = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);
export const Sun = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const Moon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
);
export const Up = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M7 14l5-5 5 5" /></svg>
);
export const Down = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M7 10l5 5 5-5" /></svg>
);
export const Lock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);
export const Mail = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></svg>
);
export const Megaphone = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="m3 11 15-7v16L3 13zM3 11H2.5a1.5 1.5 0 0 0 0 5H3M7 12.5V19a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-4.5" /></svg>
);
export const FileText = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></svg>
);
export const Film = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><rect x="2.5" y="4" width="19" height="16" rx="2" /><path d="M7 4v16M17 4v16M2.5 12h19M2.5 8h4.5M17 8h4.5M2.5 16h4.5M17 16h4.5" /></svg>
);
export const LinkIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
);
export const External = (p: SVGProps<SVGSVGElement>) => (
  <svg {...b(p)}><path d="M14 4h6v6M20 4 10 14M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>
);
