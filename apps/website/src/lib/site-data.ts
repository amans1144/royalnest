/**
 * Royalnest Realty — site content.
 * Single source of truth for the marketing site copy & data.
 */

export const BRAND = {
  name: 'Royalnest Realty',
  short: 'Royalnest',
  tagline: 'Premium plotted developments across Lucknow',
  /**
   * Phone and WhatsApp are deliberately EMPTY, not placeholders.
   *
   * Publishing a number that does not reach the sales team is worse than
   * publishing none, so every call/WhatsApp affordance on the site is hidden
   * while these are blank (see HAS_PHONE / HAS_WHATSAPP below). Fill all three
   * in and every button, link and JSON-LD telephone comes back at once — no
   * component needs touching.
   */
  phone: '',
  phoneHref: '',
  whatsapp: '',
  email: 'info@royalnestrealty.in',
  address: 'D1-184, Ansal Sushant Golf City, Lucknow',
  hours: 'Mon–Sat, 10:00 AM – 7:00 PM',
  // No `rera` field: the registration number was removed from the site. An
  // unreferenced property here would still be bundled into the page source, so
  // it is deleted rather than merely unused.
  since: 2009,
};

/**
 * Whether the site may advertise a phone / WhatsApp route at all. Components
 * gate their CTAs on these rather than each testing BRAND.phone themselves, so
 * there is exactly one definition of "we have a number".
 */
export const HAS_PHONE = BRAND.phone !== '' && BRAND.phoneHref !== '';
export const HAS_WHATSAPP = BRAND.whatsapp !== '';

/** `short` is what the desktop navbar renders when the full label would crowd
 *  the bar; the footer and mobile menu always show the full label. */
export type NavLink = { label: string; href: string; short?: string };

export const NAV_LINKS: NavLink[] = [
  { label: 'Home', href: '/#home' },
  { label: 'Why Invest', href: '/#why-invest' },
  { label: 'Amenities', href: '/#amenities' },
  { label: 'Plot Map', href: '/#availability' },
  { label: 'Location', href: '/#location' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Marketing Material', href: '/marketing', short: 'Marketing' },
  { label: 'Contact', href: '/#contact' },
];

export const HERO_STATS = [
  { value: 48, suffix: '+', label: 'Projects Delivered' },
  { value: 12, suffix: 'K+', label: 'Happy Investors' },
  { value: 100, suffix: '%', label: 'RERA Approved' },
];

/* ══════════════════════════════════════════════════════════════════════════
   LIBERTY IMPERIAL GREENS — flagship township
   ══════════════════════════════════════════════════════════════════════════ */

export const PROJECT = {
  name: 'Liberty Imperial Greens',
  tagline: 'A Vacation-Themed Township',
  pitch:
    'A township designed around nature, wellness, recreation and modern living — on the Lucknow–Sultanpur growth corridor.',
  locality: 'Nizampur, Gosaiganj–Barabanki Road',
  city: 'Lucknow',
  highway: 'Lucknow–Sultanpur NH-731',
  status: 'New Launch',
  offerNote: 'Limited period launch offer',
  sportsArea: '40,000+ Sq.Ft.',
  plantSpecies: '30+',
};

export const THEME_GARDENS = [
  { icon: 'Flower', name: 'Rose Garden' },
  { icon: 'Leaf', name: 'Medicinal & Herbal Garden' },
  { icon: 'Sparkle', name: 'Fragrance Garden' },
  { icon: 'Trees', name: 'Fruits & Mango Garden' },
  { icon: 'Landmark', name: 'Signature Central Park' },
  { icon: 'Trees', name: 'Mini Forest with Adventure Trail' },
  { icon: 'Toy', name: 'Fairy & Dinosaur Garden' },
  { icon: 'Flower', name: '12-Month Bloom Garden & Floral Tunnel' },
  { icon: 'Dog', name: 'Dog Park' },
  { icon: 'Temple', name: 'Spiritual Gods Park' },
  { icon: 'Flower', name: 'Botanical Garden' },
];

export const HERO_HIGHLIGHTS = [
  { icon: 'Road', label: '30, 40 & 45 Ft. Roads' },
  { icon: 'Trees', label: `${THEME_GARDENS.length} Theme Gardens` },
  { icon: 'Trophy', label: '40,000+ Sq.Ft. Sports Zone' },
  { icon: 'Landmark', label: 'Club Imperial' },
];

/**
 * Plot categories. Deliberately carries NO figures: pricing is shared by an
 * advisor on request, so no rate should exist in the public bundle at all —
 * hiding a number in the UI still ships it in the page source.
 */
export type PriceTier = {
  type: 'Residential' | 'Commercial';
  icon: string;
  note: string;
};

export const PRICE_TIERS: PriceTier[] = [
  {
    type: 'Residential',
    icon: 'Home',
    note: 'Residential plots ranging from approximately 1,000 to 2,100 sq. ft., thoughtfully planned along 30, 40 and 45 ft. roads with multiple sizes, locations and facing options.',
  },
  {
    type: 'Commercial',
    icon: 'Building',
    note: 'Strategically planned commercial plots and spaces within the township, suitable for retail outlets, offices and essential neighbourhood services.',
  },
];

export const INVEST_REASONS = [
  {
    icon: 'Percent',
    title: 'Introductory Launch Price',
    text: 'Book at the current introductory rate. Speak to an advisor for the applicable rate — future pricing is subject to revision.',
  },
  {
    icon: 'Rocket',
    title: 'Government Growth Engine',
    text: 'LDA IT City (3,500 ac), LDA Wellness City (1,500 ac) and LDA Knowledge City (2,200+ ac) are all coming up around the site.',
  },
  {
    icon: 'Route',
    title: 'Six Highways & Expressways',
    text: 'NH-731, NH-230, Purvanchal & Greenfield Expressways, plus a proposed six-lane masterplan road and Green Corridor to Gomti Nagar Extension.',
  },
  {
    icon: 'Building',
    title: 'Proven Developer Belt',
    text: 'Shalimar, Emaar, Ansal API, Omaxe, Ekana Sportz City and Excella all operate within a 5–15 minute drive.',
  },
  {
    icon: 'Trees',
    title: '1,000+ Acres of Greenbelt',
    text: 'A protected green corridor, the 37-acre LDA Wetland and C.G. City keep the surroundings low-density and premium.',
  },
  {
    icon: 'Train',
    title: 'Metro & SCR Expansion',
    text: 'Metro line proposed up to Gosaiganj and State Capital Region expansion put the site squarely in Lucknow’s next chapter.',
  },
];

export const PAYMENT_PLAN = [
  { pct: '10%', title: 'Booking Amount', text: 'Block your preferred plot at the launch rate.' },
  { pct: '40%', title: 'Within 30 Days', text: 'Second instalment on allotment confirmation.' },
  { pct: '50%', title: 'Within 45 Days', text: 'Balance payment — then registry and possession.' },
];

/* ── Amenities ──────────────────────────────────────────────────────────── */

export type AmenityGroup = {
  title: string;
  icon: string;
  items: { icon: string; label: string }[];
};

export const AMENITY_GROUPS: AmenityGroup[] = [
  {
    title: 'Infrastructure',
    icon: 'Road',
    items: [
      { icon: 'Gate', label: 'Grand Entrance Gate & Circular Fountain' },
      { icon: 'Road', label: '30, 40 and 45 Ft. Planned Roads' },
      { icon: 'Droplet', label: 'Underground Sewerage & Drainage' },
      { icon: 'Zap', label: 'Electrification & Modern Streetlights' },
      { icon: 'Car', label: 'Visitor Parking' },
      { icon: 'Waves', label: 'Rainwater Harvesting' },
    ],
  },
  {
    title: 'Sports & Wellness',
    icon: 'Trophy',
    items: [
      { icon: 'Trophy', label: '40,000+ Sq.Ft. Sports Area' },
      { icon: 'Trophy', label: 'Cricket Practice Nets' },
      { icon: 'Dumbbell', label: 'Indoor & Outdoor Gym' },
      { icon: 'Yoga', label: 'Yoga & Meditation Zone' },
    ],
  },
  {
    title: 'Green & Leisure',
    icon: 'Trees',
    items: [
      { icon: 'Flower', label: '12-Month Bloom Garden' },
      { icon: 'Flower', label: 'Floral Tunnel' },
      { icon: 'Leaf', label: 'Medicinal & Herbal Garden' },
      { icon: 'Sparkle', label: 'Fragrance & Rose Garden' },
      { icon: 'Flower', label: 'Botanical Garden' },
      { icon: 'Trees', label: 'Fruits & Mango Orchard' },
      { icon: 'Toy', label: 'Dinosaur Garden' },
      { icon: 'Dog', label: 'Dedicated Dog Park' },
      { icon: 'Trees', label: 'Mini Forest & Adventure Trail' },
      { icon: 'Users', label: 'Senior Citizen Park' },
      { icon: 'Leaf', label: 'Organic Farming Garden' },
    ],
  },
  {
    title: 'Community & Security',
    icon: 'Shield',
    items: [
      { icon: 'Landmark', label: 'Premium Clubhouse' },
      { icon: 'Toy', label: "Kids' Play Area" },
      { icon: 'Temple', label: 'Temple (Spiritual Area)' },
      { icon: 'Camera', label: 'CCTV Surveillance & Security' },
      { icon: 'Handshake', label: 'Maintenance Office' },
      { icon: 'Building', label: 'Commercial Complex' },
    ],
  },
];



/* ── Location ───────────────────────────────────────────────────────────── */

export const LOCATION_STATS = [
  { value: 20, suffix: ' min', label: 'Current Drive from Shaheed Path' },
  { value: 12, suffix: ' min', label: 'After Masterplan Road Upgrade' },
  { value: 1000, suffix: '+ ac', label: 'Greenbelt & Parks' },
];

export type LocationGroup = {
  title: string;
  icon: string;
  items: string[];
};

export const LOCATION_GROUPS: LocationGroup[] = [
  {
    title: 'Roads & Expressways',
    icon: 'Route',
    items: [
      'Adjoining 4-lane, 80 m Gosaiganj–Satrikh NH-230',
      'Upcoming 45 m road right beside the project',
      '100 m, 8-lane widening of Lucknow–Sultanpur NH-731',
      'Purvanchal Expressway to Eastern Uttar Pradesh',
      'Greenfield Expressway linking Purvanchal & Agra Expressway',
      '6-lane future connectivity to Gomti Nagar Extension',
      'New Jail Road NH connecting Gosaiganj to Raebareli & Kanpur NH',
      '6-lane Green Corridor to New and Old Lucknow',
    ],
  },
  {
    title: 'Government Mega Projects',
    icon: 'Landmark',
    items: [
      'LDA IT City Yojana — 3,500 acres',
      '188-acre Central Park & Golf Course inside IT City',
      'LDA Wellness City Yojana — 1,500 acres',
      'LDA Knowledge City — 2,200+ acres',
      'UPAVP Saumitra Vihar Yojana — 560 acres',
      'LDA CG Wetland City — 37-acre urban oasis, 200+ bird species',
      'State Capital Region (SCR) expansion',
      'Government mega townships within a 5–7 km radius',
    ],
  },
  {
    title: 'Institutional & Social Infra',
    icon: 'GraduationCap',
    items: [
      'LDA Knowledge Park — 350+ acres',
      'International schools, engineering & medical colleges',
      'Universities, institutes, training & coaching centres',
      '150-acre Healthcare Zone with hospitals & medical college',
      'Wellness centres, yoga and naturopathy facilities',
      'Proposed ISBT Bus Stand and Transport Nagar',
      'Metro line proposed up to Gosaiganj',
    ],
  },
  {
    title: 'Neighbourhood & Developers',
    icon: 'Building',
    items: [
      'Surrounded by LDA residential zone & approved townships',
      'Shalimar Corp and Emaar India within 5–15 minutes',
      'Ansal API, Omaxe and Amrawati Group nearby',
      'Pintail Group and Excella developments close by',
      'Ekana Sportz City a short drive away',
      '1,000+ acres of greenbelt and parks around the corridor',
    ],
  },
];

export const LOCATION_NOTE =
  'Just as Gomti Nagar, Indira Nagar, Sushant Golf City and Vrindavan Yojana shaped Lucknow over the past 20–25 years, the upcoming government mega townships on this corridor are set to define the city’s next chapter.';

export const BUDGET_OPTIONS = [
  '₹10L – ₹25L',
  '₹25L – ₹40L',
  '₹40L – ₹60L',
  '₹60L – ₹1Cr',
  '₹1Cr +',
];

export const LOCATION_OPTIONS = [
  'Sultanpur Road',
  'Shaheed Path',
  'Gomti Nagar Extension',
  'Faizabad Road',
  'Sitapur Road',
  'Amar Shaheed Path',
  'Raebareli Road',
  'Kanpur Road',
];

export type Project = {
  name: string;
  location: string;
  price: string;
  sizes: string;
  status: 'Ready to Register' | 'Selling Fast' | 'New Launch';
  rera: string;
  image: string;
  highlights: string[];
};

export const PROJECTS: Project[] = [
  {
    name: 'Royal Greens Enclave',
    location: 'Sultanpur Road',
    price: '₹28.5L',
    sizes: '1000 – 2400 sq.ft',
    status: 'Ready to Register',
    rera: 'UPRERAPRJ458201',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    highlights: ['Gated township', '40 ft internal roads', '30% open green space'],
  },
  {
    name: 'Royal Golden Meadows',
    location: 'Shaheed Path',
    price: '₹42.9L',
    sizes: '1200 – 3600 sq.ft',
    status: 'Selling Fast',
    rera: 'UPRERAPRJ471908',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    highlights: ['Clubhouse & pool', 'Corner plots available', 'Bank loan approved'],
  },
  {
    name: 'Royal Vrindavan Heights',
    location: 'Gomti Nagar Extension',
    price: '₹35L',
    sizes: '1500 – 3000 sq.ft',
    status: 'New Launch',
    rera: 'UPRERAPRJ483677',
    image:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    highlights: ['Metro corridor', 'Landscaped parks', 'Ready infrastructure'],
  },
];

export type Corridor = {
  name: string;
  growth: 'Very High' | 'High' | 'Rising' | 'Stable';
  note: string;
};

export const CORRIDORS: Corridor[] = [
  { name: 'Shaheed Path', growth: 'Very High', note: 'Ring-road connectivity & commercial hubs' },
  { name: 'Sultanpur Road', growth: 'High', note: 'Airport-facing, expressway access' },
  { name: 'Gomti Nagar Extension', growth: 'High', note: 'Premium residential, metro corridor' },
  { name: 'Amar Shaheed Path', growth: 'High', note: 'IT City & institutional belt' },
  { name: 'Faizabad Road', growth: 'Rising', note: 'Established township corridor' },
  { name: 'Sitapur Road', growth: 'Rising', note: 'Affordable entry, high upside' },
  { name: 'Raebareli Road', growth: 'Stable', note: 'Industrial & education zone' },
  { name: 'Kanpur Road', growth: 'Stable', note: 'Defence corridor connectivity' },
];

export const WHY_LUCKNOW = [
  {
    icon: 'Landmark',
    title: 'Smart City Status',
    text: 'Lucknow is a flagship Smart City with world-class civic upgrades underway.',
  },
  {
    icon: 'TrendingUp',
    title: 'Expressway Network',
    text: 'Purvanchal, Agra & Ganga expressways put the whole state within reach.',
  },
  {
    icon: 'Plane',
    title: 'Airport Expansion',
    text: 'New Terminal 3 dramatically boosts capacity and land value nearby.',
  },
  {
    icon: 'Cpu',
    title: '600-Acre IT City',
    text: 'A dedicated IT City is drawing corporates, jobs and housing demand.',
  },
  {
    icon: 'Shield',
    title: 'Defence Corridor',
    text: 'Lucknow is a key node on the UP Defence Industrial Corridor.',
  },
  {
    icon: 'Train',
    title: 'Metro Phase-2',
    text: 'Metro Phase-2 planning extends fast transit into growth corridors.',
  },
  {
    icon: 'Award',
    title: '18–24% Avg CAGR',
    text: 'Premium corridors have delivered 18–24% average annual appreciation.',
  },
  {
    icon: 'Home',
    title: 'Affordable Entry',
    text: 'Plot pricing remains attractive versus metros — early-mover advantage.',
  },
];

export const WHY_CHOOSE_US = [
  { icon: 'BadgeCheck', title: '100% Verified Projects', text: 'Every project is title-checked before we list it.' },
  { icon: 'Shield', title: 'RERA Compliant', text: 'All developments carry valid RERA registration.' },
  { icon: 'FileText', title: 'Clear Titles', text: 'Independent legal verification on every plot.' },
  { icon: 'CreditCard', title: 'Bank Loan Assistance', text: 'Tie-ups with leading banks for easy financing.' },
  { icon: 'MapPin', title: 'Free Site Visits', text: 'Complimentary, no-obligation guided site tours.' },
  { icon: 'Scale', title: 'Legal Support', text: 'End-to-end documentation & registry support.' },
  { icon: 'Handshake', title: 'Flexible EMI Plans', text: 'Custom instalment plans to suit your budget.' },
  { icon: 'TrendingUp', title: 'Transparent Pricing', text: 'No hidden charges — every rupee accounted for.' },
];

export const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Choose Your Plot',
    text: 'Browse curated, RERA-approved plots matched to your budget and goals.',
  },
  {
    step: '02',
    title: 'Book a Site Visit',
    text: 'Schedule a complimentary guided visit — we handle the logistics.',
  },
  {
    step: '03',
    title: 'Documentation',
    text: 'Our legal team verifies titles and prepares clean paperwork.',
  },
  {
    step: '04',
    title: 'Registration & Allotment',
    text: 'Complete registry and receive your allotment with full support.',
  },
];

export type PlotType = {
  name: string;
  price: string;
  size: string;
  facing: string;
  corner: string;
  road: string;
  loan: string;
  registry: string;
  status: string;
  featured?: boolean;
};

export const PLOT_TYPES: PlotType[] = [
  {
    name: 'Smart Plot',
    price: '₹28.5L',
    size: '1000 sq.ft',
    facing: 'East',
    corner: 'No',
    road: '30 ft',
    loan: 'Eligible',
    registry: 'Ready',
    status: 'Developed',
  },
  {
    name: 'Premium Plot',
    price: '₹45.0L',
    size: '1800 sq.ft',
    facing: 'North-East',
    corner: 'Optional',
    road: '40 ft',
    loan: 'Eligible',
    registry: 'Ready',
    status: 'Developed',
    featured: true,
  },
  {
    name: 'Signature Plot',
    price: '₹68.5L',
    size: '2400 sq.ft',
    facing: 'Corner',
    corner: 'Yes',
    road: '60 ft',
    loan: 'Eligible',
    registry: 'Ready',
    status: 'Developed',
  },
];

/** Categories & the image shape live in @spb/types so the admin's Media Library
 *  and this site can never disagree. Re-exported for existing importers. */
export { GALLERY_CATEGORIES, type GalleryCategory } from '@spb/types';

export type GalleryItem = {
  src: string;
  label: string;
  category: import('@spb/types').GalleryCategory;
};

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/** Fallback photo set, shown until the admin publishes its own gallery. */
export const GALLERY: GalleryItem[] = [
  { src: u('1500382017468-9049fed747ef'), label: 'Aerial Township View', category: 'Township' },
  { src: u('1568605114967-8130f3a36994'), label: 'Monument Entrance Gate', category: 'Township' },
  { src: u('1449844908441-8829872d2607'), label: '30, 40 & 45 Ft. Wide Internal Roads', category: 'Township' },
  { src: u('1512917774080-9991f1c4c750'), label: 'Plotted Layout', category: 'Township' },
  { src: u('1486406146926-c627a92ad1ab'), label: 'Dedicated Commercial Complex', category: 'Township' },
  { src: u('1590725140246-20acdee442be'), label: 'Modern Street Lighting', category: 'Township' },

  { src: u('1416879595882-3373a0480b5b'), label: 'Landscaped Parks', category: 'Amenities' },
  { src: u('1595872018818-97555653a011'), label: 'Green Open Spaces', category: 'Amenities' },
  { src: u('1600585154340-be6161a56a0c'), label: 'Sandwich Park Plots', category: 'Amenities' },
  { src: u('1519046904884-53103b34b206'), label: 'Greek-Style Fountain', category: 'Amenities' },
  { src: u('1558618666-fcd25c85cd64'), label: 'Gazebo Seating Areas', category: 'Amenities' },
  { src: u('1517457373958-b7bdd4587205'), label: 'Grand Temple', category: 'Amenities' },

  { src: u('1490750967868-88aa4486c946'), label: 'Rose Garden', category: 'Gardens' },
  { src: u('1466692476868-aef1dfb1e735'), label: 'Botanical Garden — 30+ Species', category: 'Gardens' },
  { src: u('1441974231531-c6227db76b6e'), label: 'Mini Forest & Adventure Trail', category: 'Gardens' },
  { src: u('1523348837708-15d4a09cfac2'), label: 'Fruits & Mango Garden', category: 'Gardens' },
  { src: u('1470071459604-3b5ec3a7fe05'), label: '12-Month Bloom Garden', category: 'Gardens' },
  { src: u('1518495973542-4542c06a5843'), label: 'Fragrance Garden Walkway', category: 'Gardens' },

  { src: u('1571902943202-507ec2618e8f'), label: 'Swimming Pool', category: 'Sports' },
  { src: u('1534438327276-14e5300c3a48'), label: 'Indoor Gymnasium', category: 'Sports' },
  { src: u('1540497077202-7c8a3999166f'), label: 'Cricket Practice Nets', category: 'Sports' },
  { src: u('1544551763-46a013bb70d5'), label: 'Outdoor Sports Zone', category: 'Sports' },
  { src: u('1545205597-3d9d02c29597'), label: 'Yoga & Meditation Zone', category: 'Sports' },
  { src: u('1566241440091-ec10de8db2e1'), label: "Children's Play Area", category: 'Sports' },

  { src: u('1560448204-e02f11c3d0e2'), label: 'Club Imperial Lounge', category: 'Club Imperial' },
  { src: u('1566073771259-6a8506099945'), label: 'Guest Rooms', category: 'Club Imperial' },
  { src: u('1519167758481-83f550bb49b3'), label: 'Multipurpose Hall', category: 'Club Imperial' },
  { src: u('1554118811-1e0d58224f24'), label: 'Cafeteria', category: 'Club Imperial' },
  { src: u('1626224583764-f87db24ac4ea'), label: 'Badminton Court', category: 'Club Imperial' },
  { src: u('1600585154526-990dced4db0d'), label: 'Indoor Games Room', category: 'Club Imperial' },
];

export type Testimonial = {
  name: string;
  location: string;
  avatar: string;
  rating: number;
  text: string;
  featured?: boolean;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Rohit Sharma',
    location: 'Sultanpur Road',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    text: 'Royalnest made everything effortless. I got a 2000 sq.ft plot with a clear title in under 30 days. The team handled the registry and loan end-to-end.',
    featured: true,
  },
  {
    name: 'Anjali Verma',
    location: 'Shaheed Path',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    text: 'Completely transparent pricing and a genuinely helpful team. The free site visit sealed my decision. Highly recommend for first-time investors.',
  },
  {
    name: 'Suresh Kumar',
    location: 'Gomti Nagar Extension',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    rating: 5,
    text: 'Every project they showed me was RERA approved with verified titles. That level of due diligence is rare. My plot has already appreciated well.',
  },
];

export const ABOUT_STATS = [
  { value: 15, suffix: '+', label: 'Years Experience' },
  { value: 48, suffix: '+', label: 'Projects Delivered' },
  { value: 12, suffix: 'K+', label: 'Happy Clients' },
  { value: 30, suffix: '+', label: 'Developer Partners' },
];

export const FAQS = [
  {
    q: 'How do I verify a project is RERA approved?',
    a: 'Every Royalnest project lists its RERA registration number. You can cross-check it on the UP RERA portal, and our team will walk you through the verification during your site visit.',
  },
  {
    q: 'Do you provide home / plot loan assistance?',
    a: 'Yes. We have tie-ups with leading nationalised and private banks. Our team helps you with eligibility, documentation and disbursal so financing is hassle-free.',
  },
  {
    q: 'What is the booking procedure?',
    a: 'Choose a plot, book a free site visit, and pay a nominal token to block it. We then complete title verification, documentation and registry — with support at every step.',
  },
  {
    q: 'Are the plots registry-ready?',
    a: 'Our featured plots are registry-ready with clear, verified titles, so you can register in your name immediately after booking.',
  },
  {
    q: 'Do you offer instalment / EMI options?',
    a: 'Yes, we offer flexible EMI and instalment plans tailored to your budget. Speak to an advisor to design a plan that works for you.',
  },
  {
    q: 'How do I organise a site visit?',
    a: 'Just fill the enquiry form or call us. Site visits are complimentary and we can arrange pick-up and drop for your convenience.',
  },
];

export const INTEREST_OPTIONS = [
  'Residential Plot',
  'Commercial Plot',
  'Investment / Resale',
  'Site Visit Only',
];
