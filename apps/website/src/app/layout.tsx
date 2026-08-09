import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Analytics } from '../components/analytics';
import {
  OG_IMAGE,
  SITE_URL,
  jsonLdScript,
  organizationJsonLd,
  projectJsonLd,
} from '../lib/seo';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-playfair',
  display: 'swap',
});

const TITLE = 'Liberty Imperial Greens — Vacation-Themed Township, Gosaiganj, Lucknow';
const DESCRIPTION =
  'Liberty Imperial Greens, Nizampur, Gosaiganj–Satrikh Road, Lucknow. Pre-RERA launch at ₹1,799/sq.ft. — 50 ft. roads, 10 theme gardens, Club Imperial and a 40,000+ sq.ft. sports zone on NH-731.';

export const metadata: Metadata = {
  // Resolves every relative URL below (OG images, canonicals) to an absolute one.
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s | Liberty Imperial Greens' },
  description: DESCRIPTION,
  applicationName: 'Liberty Imperial Greens',
  authors: [{ name: 'RoyalNest Realty' }],
  creator: 'RoyalNest Realty',
  publisher: 'RoyalNest Realty',
  category: 'real estate',
  keywords: [
    'Liberty Imperial Greens',
    'Gosaiganj plots',
    'Lucknow Sultanpur Road plots',
    'NH-731 township',
    'pre-RERA plots Lucknow',
    'residential plots Lucknow',
    'commercial plots Lucknow',
    'plots near Shaheed Path',
    'LDA approved township Lucknow',
    'RoyalNest Realty',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'Liberty Imperial Greens',
    title: 'Liberty Imperial Greens — A Vacation-Themed Township in Lucknow',
    description:
      'Pre-RERA launch at ₹1,799/sq.ft. + AC. Nizampur, Gosaiganj–Satrikh Road on Lucknow–Sultanpur NH-731.',
    images: [
      {
        url: OG_IMAGE,
        width: 1600,
        height: 900,
        alt: 'Monument entrance gate at Liberty Imperial Greens',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Liberty Imperial Greens — A Vacation-Themed Township in Lucknow',
    description:
      'Pre-RERA launch at ₹1,799/sq.ft. + AC. Nizampur, Gosaiganj–Satrikh Road, Lucknow.',
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: { telephone: true, address: true, email: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fdfcf7' },
    { media: '(prefers-color-scheme: dark)', color: '#141d2b' },
  ],
};

// Set the theme before paint to avoid a flash of the wrong color scheme.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {/* Structured data — describes the selling agent and the township so
            search engines can render rich results for both. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(organizationJsonLd())}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(projectJsonLd())}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
