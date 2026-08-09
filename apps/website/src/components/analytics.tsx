'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { fetchSiteSettings } from '../lib/use-site-settings';

/**
 * Google Analytics 4 (and optionally Tag Manager).
 *
 * The measurement ID comes from NEXT_PUBLIC_GA_ID at build time when set, and
 * otherwise from the settings the admin publishes at runtime — so the ID can be
 * changed without a redeploy. Nothing is injected until an ID exists, so no
 * analytics requests fire on a site that hasn't been configured.
 */
const ENV_GA = process.env.NEXT_PUBLIC_GA_ID ?? '';
const ENV_GTM = process.env.NEXT_PUBLIC_GTM_ID ?? '';

// GA4 IDs look like G-XXXXXXXXXX; GTM containers like GTM-XXXXXXX.
const isGaId = (v: string) => /^G-[A-Z0-9]{4,}$/i.test(v);
const isGtmId = (v: string) => /^GTM-[A-Z0-9]{4,}$/i.test(v);

/** Add/refresh a verification <meta> tag, or remove it when cleared. */
function upsertMeta(name: string, content?: string) {
  const existing = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!content) {
    existing?.remove();
    return;
  }
  if (existing) {
    existing.content = content;
    return;
  }
  const el = document.createElement('meta');
  el.name = name;
  el.content = content;
  document.head.appendChild(el);
}

export function Analytics() {
  const [gaId, setGaId] = useState(ENV_GA);
  const [gtmId, setGtmId] = useState(ENV_GTM);
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    // Shared with the hero background, so the settings are fetched once a page.
    fetchSiteSettings().then((s) => {
      if (cancelled) return;
      // Env vars win — a baked-in ID shouldn't be overridable at runtime.
      if (!ENV_GA && s.gaMeasurementId) setGaId(s.gaMeasurementId);
      if (!ENV_GTM && s.gtmId) setGtmId(s.gtmId);
      upsertMeta('google-site-verification', s.googleSiteVerification);
      upsertMeta('facebook-domain-verification', s.facebookDomainVerification);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // App Router client navigations don't trigger a GA page_view on their own.
  useEffect(() => {
    if (!isGaId(gaId)) return;
    const w = window as unknown as { gtag?: (...a: unknown[]) => void };
    w.gtag?.('config', gaId, { page_path: pathname });
  }, [pathname, gaId]);

  return (
    <>
      {isGaId(gaId) && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());gtag('config','${gaId}',{send_page_view:true});`}
          </Script>
        </>
      )}

      {isGtmId(gtmId) && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})
(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}
    </>
  );
}
