import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RoyalNest Realty — Admin Console',
  description: 'Projects, interactive plot editor, bookings, CRM, and reports.',
  robots: { index: false, follow: false },
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
