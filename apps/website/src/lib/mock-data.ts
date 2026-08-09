/**
 * Demo content for the marketing site. In production these come from the API
 * (@spb/api) via React Query; here they are static so the site runs standalone.
 */

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export interface Project {
  id: string;
  slug: string;
  name: string;
  location: string;
  type: 'Villa' | 'Plotted' | 'Residential' | 'Commercial';
  status: 'Ongoing' | 'Ready to Move' | 'Upcoming' | 'Sold Out';
  priceFrom: number;
  areaFrom: string;
  image: string;
  tags: string[];
  featured?: boolean;
  investment?: boolean;
}

export const projects: Project[] = [
  {
    id: '1',
    slug: 'liberty-imperial-greens',
    name: 'Liberty Imperial Greens',
    location: 'Nizampur, Gosaiganj – Satrikh Road, Lucknow',
    type: 'Plotted',
    status: 'Ongoing',
    priceFrom: 1_799_000,
    areaFrom: '1000 sq.ft',
    image: img('1500382017468-9049fed747ef'),
    tags: ['Pre-RERA Launch', 'NH-731', '10 Theme Gardens'],
    featured: true,
    investment: true,
  },
];

export interface Category {
  key: string;
  title: string;
  count: number;
  image: string;
}

export const categories: Category[] = [
  { key: 'villa', title: 'Luxury Villas', count: 24, image: img('1600607687939-ce8a6c25118c', 900) },
  { key: 'plot', title: 'Residential Plots', count: 480, image: img('1500382017468-9049fed747ef', 900) },
  {
    key: 'residential',
    title: 'Apartments',
    count: 156,
    image: img('1522708323590-d24dbb6b0267', 900),
  },
  {
    key: 'commercial',
    title: 'Commercial',
    count: 38,
    image: img('1486406146926-c627a92ad1ab', 900),
  },
];

export const stats = [
  { label: 'Projects Delivered', value: 68, suffix: '+' },
  { label: 'Happy Families', value: 12400, suffix: '+' },
  { label: 'Acres Developed', value: 540, suffix: '' },
  { label: 'Years of Trust', value: 23, suffix: '' },
];

export interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  rating: number;
}

export const testimonials: Testimonial[] = [
  {
    name: 'Ananya Reddy',
    role: 'Homeowner, SP Emerald Greens',
    avatar: 'https://i.pravatar.cc/120?img=47',
    quote:
      'Buying our plot was seamless. The live availability map let us pick the exact corner plot we wanted, and the team handled everything transparently.',
    rating: 5,
  },
  {
    name: 'Rohan Malhotra',
    role: 'Investor',
    avatar: 'https://i.pravatar.cc/120?img=12',
    quote:
      'I have invested in three SP Builders projects. Clear titles, on-time possession, and genuinely strong appreciation. A rare combination.',
    rating: 5,
  },
  {
    name: 'Meera Krishnan',
    role: 'Villa Owner, SP Orchard',
    avatar: 'https://i.pravatar.cc/120?img=32',
    quote:
      'The craftsmanship is exceptional. Every detail of our villa reflects the premium quality they promised during the site visit.',
    rating: 5,
  },
];

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readMins: number;
  image: string;
}

export const posts: BlogPost[] = [
  {
    slug: 'why-plotted-developments',
    title: 'Why Plotted Developments Are the Smartest 2026 Investment',
    excerpt: 'Land appreciation, flexibility, and lower entry cost — the case for plots.',
    category: 'Investment',
    date: 'Jul 12, 2026',
    readMins: 6,
    image: img('1560518883-ce09059eeffa', 800),
  },
  {
    slug: 'rera-buyer-guide',
    title: 'A First-Time Buyer’s Guide to RERA Compliance',
    excerpt: 'What every home buyer should verify before signing an agreement.',
    category: 'Guides',
    date: 'Jun 28, 2026',
    readMins: 8,
    image: img('1450101499163-c8848c66ca85', 800),
  },
  {
    slug: 'gurugram-luxury-2026',
    title: 'Inside Gurugram’s Booming Luxury Villa Market',
    excerpt: 'How the Golf Course Extension corridor became a premium destination.',
    category: 'Market',
    date: 'Jun 15, 2026',
    readMins: 5,
    image: img('1512917774080-9991f1c4c750', 800),
  },
];

export const partners = [
  'ADITYA',
  'MERIDIAN',
  'NOVA CAPITAL',
  'HALLMARK',
  'EVERGREEN',
  'ZENITH',
];

export const faqs = [
  {
    q: 'Are all projects RERA registered?',
    a: 'Yes. Every SP Builders project is RERA registered with clear, marketable titles. RERA numbers are listed on each project page.',
  },
  {
    q: 'How does the live plot availability map work?',
    a: 'Each project layout shows real-time plot status — available, reserved, booked, sold, or blocked. The moment our team updates a plot, every visitor sees it change instantly.',
  },
  {
    q: 'Can I book a plot online?',
    a: 'You can reserve a plot online with a booking amount, or schedule a site visit. Our sales team then guides you through agreement and registration.',
  },
  {
    q: 'Do you assist with home loans?',
    a: 'Absolutely. We are empanelled with leading banks and NBFCs and our team helps you with pre-approved loan options and documentation.',
  },
];

export const formatINR = (n: number): string => {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2).replace(/\.00$/, '')} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1).replace(/\.0$/, '')} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};
