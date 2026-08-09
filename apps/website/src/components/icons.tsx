import type { SVGProps } from 'react';

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const Sun = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const Moon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

export const Search = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const MapPin = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const ArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 5l7 7-7 7" />
  </svg>
);

export const Menu = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const X = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const Star = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ fill: 'currentColor', stroke: 'none', ...p })}>
    <path d="M12 2l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.8 5.9 20.5l1.4-6.8L2.2 9l6.9-.7z" />
  </svg>
);

export const Building = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 22V4a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v18M15 9h4a1 1 0 0 1 1 1v12M8 7h3M8 11h3M8 15h3" />
  </svg>
);

export const Shield = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const Phone = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  </svg>
);

export const Plus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Sparkle = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
  </svg>
);

export const Check = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export const BadgeCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 2.5l2.3 1.7 2.8-.2 1 2.7 2.4 1.5-.8 2.8.8 2.8-2.4 1.5-1 2.7-2.8-.2L12 21.5l-2.3-1.7-2.8.2-1-2.7-2.4-1.5.8-2.8-.8-2.8 2.4-1.5 1-2.7 2.8.2z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const ChevronDown = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const WhatsApp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ fill: 'currentColor', stroke: 'none', ...p })}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 1.8c2.16 0 4.19.84 5.72 2.37a8.03 8.03 0 0 1 2.37 5.72c0 4.47-3.63 8.11-8.1 8.11a8.13 8.13 0 0 1-4.13-1.13l-.3-.18-3.12.82.83-3.04-.19-.31a8.03 8.03 0 0 1-1.24-4.29c0-4.47 3.64-8.11 8.16-8.11zM8.53 7.35c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.02s.87 2.34 1 2.5c.12.16 1.7 2.6 4.14 3.64.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.43-.58 1.63-1.15.2-.56.2-1.05.14-1.15-.06-.1-.22-.16-.46-.28s-1.43-.71-1.65-.79c-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06s-1.01-.37-1.93-1.19c-.71-.63-1.2-1.42-1.34-1.66-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.46-.39-.4-.54-.41z" />
  </svg>
);

export const Home = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
    <path d="M9 21v-6h6v6" />
  </svg>
);

export const Award = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="9" r="6" />
    <path d="M8.2 13.9 7 22l5-3 5 3-1.2-8.1" />
  </svg>
);

export const TrendingUp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m3 17 6-6 4 4 8-8" />
    <path d="M17 7h4v4" />
  </svg>
);

export const Ruler = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M16.5 3 21 7.5 7.5 21 3 16.5z" />
    <path d="M9 8l1.5 1.5M12 5l1.5 1.5M6 11l1.5 1.5M15 8l-1 1" />
  </svg>
);

export const FileText = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
    <path d="M14 3v6h6M9 13h6M9 17h6" />
  </svg>
);

export const Clock = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const Mail = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

export const Users = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 20v-2a4 4 0 0 0-3-3.9M16 3.1A4 4 0 0 1 16 11" />
  </svg>
);

export const Handshake = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m11 17 2 2a1 1 0 0 0 1.4 0l3.6-3.6a2 2 0 0 0 0-2.8L14 8.5" />
    <path d="m18 15 2-2a2 2 0 0 0 0-2.8l-3.5-3.5a2 2 0 0 0-2.8 0L11 9l-2.5-1.5a2 2 0 0 0-2.2.3L2 11" />
    <path d="m5 14 3 3M9 12l3 3" />
  </svg>
);

export const CreditCard = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20M6 15h4" />
  </svg>
);

export const Scale = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3v18M6 21h12M3 8l3-4 3 4M15 8l3-4 3 4" />
    <path d="M3 8a3 3 0 0 0 6 0M15 8a3 3 0 0 0 6 0" />
  </svg>
);

export const Train = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="5" y="3" width="14" height="14" rx="2" />
    <path d="M5 10h14M9 3v7M15 3v7M8 21l2-4M16 21l-2-4" />
    <circle cx="8.5" cy="13.5" r=".6" fill="currentColor" />
    <circle cx="15.5" cy="13.5" r=".6" fill="currentColor" />
  </svg>
);

export const Plane = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.9.9 0 0 0-.8.3l-.9.9 6 3.2-2.5 2.5-2.4-.4-.9.9 3 1.8 1.8 3 .9-.9-.4-2.4 2.5-2.5 3.2 6 .9-.9c.2-.2.3-.5.3-.8z" />
  </svg>
);

export const Cpu = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
  </svg>
);

export const Leaf = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M11 20c-4 0-7-3-7-7 0-5 4-9 16-9 0 12-4 16-9 16z" />
    <path d="M8 17c3-4 6-6 10-7" />
  </svg>
);

export const CalendarCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 9h18M8 3v4M16 3v4M9 15l2 2 4-4" />
  </svg>
);

export const Quote = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ fill: 'currentColor', stroke: 'none', ...p })}>
    <path d="M7.5 6C5 6 3 8 3 10.6 3 13 4.8 15 7.2 15c.2 0 .5 0 .7-.1-.5 1.6-1.9 2.8-3.6 3.2-.3 0-.5.4-.4.7l.4 1c.1.3.4.5.7.4C7.9 19.4 11 16 11 11.5 11 8.5 9.4 6 7.5 6zm11 0C16 6 14 8 14 10.6c0 2.4 1.8 4.4 4.2 4.4.2 0 .5 0 .7-.1-.5 1.6-1.9 2.8-3.6 3.2-.3 0-.5.4-.4.7l.4 1c.1.3.4.5.7.4C18.9 19.4 22 16 22 11.5 22 8.5 20.4 6 18.5 6z" />
  </svg>
);

export const ArrowUpRight = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

export const Landmark = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 22h18M4 10h16M12 2 3 7h18zM6 10v9M10 10v9M14 10v9M18 10v9" />
  </svg>
);

/* ── Township amenity & location icons ──────────────────────────────────── */

export const Road = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 21 8 3M20 21 16 3M12 4v3M12 10.5v3M12 17v3" />
  </svg>
);

export const Droplet = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 2.7 6.9 9.2a7 7 0 1 0 10.2 0z" />
  </svg>
);

export const Zap = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
  </svg>
);

export const Flower = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="9" r="2.2" />
    <path d="M12 6.8c0-1.6-.9-2.8-2.2-2.8S7.6 5.2 7.6 6.8c0 1 .6 1.8 1.6 2.2-1 .4-1.6 1.2-1.6 2.2 0 1.6 1 2.8 2.2 2.8s2.2-1.2 2.2-2.8M12 6.8c0-1.6.9-2.8 2.2-2.8s2.2 1.2 2.2 2.8c0 1-.6 1.8-1.6 2.2 1 .4 1.6 1.2 1.6 2.2 0 1.6-1 2.8-2.2 2.8s-2.2-1.2-2.2-2.8M12 14v8" />
  </svg>
);

export const Trees = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M8 2 4 8h2.5L4 12h8l-2.5-4H12zM8 12v9" />
    <path d="M17 8.5c1.9 0 3.5 1.6 3.5 3.5S18.9 15.5 17 15.5 13.5 13.9 13.5 12 15.1 8.5 17 8.5zM17 15.5V21" />
  </svg>
);

export const Dumbbell = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M2 12h2M20 12h2M6.5 8v8M17.5 8v8M9.5 6v12M14.5 6v12M9.5 12h5" />
  </svg>
);

export const Waves = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M2 7c2.4-2 4-2 6 0s3.6 2 6 0 3.6-2 6 0M2 13c2.4-2 4-2 6 0s3.6 2 6 0 3.6-2 6 0M2 19c2.4-2 4-2 6 0s3.6 2 6 0 3.6-2 6 0" />
  </svg>
);

export const Trophy = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0zM7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M12 14v4M8.5 21h7l-1-3h-5z" />
  </svg>
);

export const Camera = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 8h3.5l1.6-2.5h7.8L17.5 8H21v11H3z" />
    <circle cx="12" cy="13.5" r="3.4" />
  </svg>
);

export const Lightbulb = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 18h6M10 21h4M12 2a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 2z" />
  </svg>
);

export const Car = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 16v3h3v-3M17 16v3h3v-3M3 16h18v-4l-2-5H5L3 12z" />
    <circle cx="7.5" cy="13.5" r="1" />
    <circle cx="16.5" cy="13.5" r="1" />
  </svg>
);

export const Dog = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 6v6a6 6 0 0 0 6 6h4a6 6 0 0 0 6-6V6l-3 2.5h-4M4 6l3 2.5" />
    <path d="M9.5 12h.01M14.5 12h.01M11 15.5h2" />
  </svg>
);

export const Temple = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 2v2.5M9.5 9 12 4.5 14.5 9zM6 13l3-4h6l3 4zM4 21V13h16v8M10 21v-4.5h4V21" />
  </svg>
);

export const Fountain = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 4v10M8 7c0-1.7 1.8-3 4-3s4 1.3 4 3M4 14h16l-2 7H6z" />
  </svg>
);

export const Gate = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 21V8l9-5 9 5v13M3 21h18M8 21V11h8v10M12 11v10" />
  </svg>
);

export const Yoga = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="4.5" r="2" />
    <path d="M12 7v6M12 10 6.5 8M12 10l5.5-2M8 19l4-6 4 6M5 19h14" />
  </svg>
);

export const Wallet = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 7a2 2 0 0 1 2-2h11v2M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3M3 7h16a2 2 0 0 1 2 2v2h-5a2 2 0 0 0 0 4h5" />
  </svg>
);

export const Percent = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M19 5 5 19" />
    <circle cx="7.5" cy="7.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </svg>
);

export const GraduationCap = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 4 2 9l10 5 10-5zM6 11.5V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5M21 9.5V15" />
  </svg>
);

export const Hospital = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 21V7l8-4 8 4v14M4 21h16M12 8v6M9 11h6M10 21v-4h4v4" />
  </svg>
);

export const Bus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 17V4h14v13M5 9h14M5 17h14M6.5 17v2.5M17.5 17v2.5M3 17h18" />
    <path d="M8 13h.01M16 13h.01" />
  </svg>
);

export const Route = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="6" cy="19" r="2.5" />
    <circle cx="18" cy="5" r="2.5" />
    <path d="M15.5 5H10a3.5 3.5 0 0 0 0 7h4a3.5 3.5 0 0 1 0 7H8.5" />
  </svg>
);

export const Rocket = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 2c3.5 2.5 5 6.5 5 10l-2.5 3h-5L7 12c0-3.5 1.5-7.5 5-10zM9.5 15 8 21l4-2 4 2-1.5-6" />
    <circle cx="12" cy="10" r="1.6" />
  </svg>
);

export const Toy = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3v5M8 5.5h8M4 21v-6a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v6" />
    <path d="M9 15h.01M15 15h.01M10.5 18h3" />
  </svg>
);

export const Utensils = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 2v8a2 2 0 0 0 4 0V2M8 10v12M17 2c-1.5 1.5-2 3.5-2 6v3h4V8c0-2.5-.5-4.5-2-6zM17 11v11" />
  </svg>
);

export const Bird = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M16 5a3 3 0 1 0-3 3h1v2.5c0 4-3 7.5-7 7.5H4l4 3M16 5l4-1M14.5 4.6h.01" />
  </svg>
);

export const Play = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M7 4.5v15l13-7.5-13-7.5z" fill="currentColor" stroke="none" />
  </svg>
);

export const Download = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);

export const Film = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="2.5" y="4" width="19" height="16" rx="2" />
    <path d="M7 4v16M17 4v16M2.5 12h19M2.5 8h4.5M17 8h4.5M2.5 16h4.5M17 16h4.5" />
  </svg>
);

export const ImageIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.8" />
    <path d="m21 15-5-5L5 21" />
  </svg>
);
