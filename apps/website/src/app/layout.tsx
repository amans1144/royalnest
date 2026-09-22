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
  'Liberty Imperial Greens, Nizampur, Gosaiganj–Barabanki Road, Lucknow. A new-launch township — 30, 40 and 45 ft. roads, 11 theme gardens, Club Imperial and a 40,000+ sq.ft. sports zone on NH-731.';

export const metadata: Metadata = {
  // Resolves every relative URL below (OG images, canonicals) to an absolute one.
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: '%s | Liberty Imperial Greens' },
  description: DESCRIPTION,
  applicationName: 'Liberty Imperial Greens',
  authors: [{ name: 'Royalnest Realty' }],
  creator: 'Royalnest Realty',
  publisher: 'Royalnest Realty',
  category: 'real estate',
  keywords: [
    'Liberty Imperial Greens',
    'Gosaiganj plots',
    'Lucknow Sultanpur Road plots',
    'NH-731 township',
    'residential plots Lucknow',
    'commercial plots Lucknow',
    'plots near Shaheed Path',
    'LDA approved township Lucknow',
    'Royalnest Realty',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'Liberty Imperial Greens',
    title: 'Liberty Imperial Greens — A Vacation-Themed Township in Lucknow',
    description:
      'A new-launch township at Nizampur, Gosaiganj–Barabanki Road on Lucknow–Sultanpur NH-731.',
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
      'A new-launch township at Nizampur, Gosaiganj–Barabanki Road, Lucknow.',
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
  // Single value, not per-scheme: the site now renders light regardless of the
  // device setting (see themeScript), so a dark chrome colour keyed to
  // prefers-color-scheme would band against a light page.
  themeColor: '#f3f9f0',
};

/**
 * Set the theme before paint to avoid a flash of the wrong colour scheme.
 *
 * Light is the deliberate default: a first-time visitor always gets the light
 * green brand palette even if their device is set to dark, because that is the
 * designed presentation of the project. The system preference is no longer
 * consulted — only an explicit choice the visitor has made with the toggle,
 * which is remembered in localStorage.
 */
const themeScript = `(function(){try{document.documentElement.classList.toggle('dark',localStorage.getItem('theme')==='dark');}catch(e){}})();`;

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
