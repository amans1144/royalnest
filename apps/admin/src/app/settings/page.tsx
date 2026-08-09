'use client';

import { useEffect, useRef, useState } from 'react';
import {
  EMPTY_SITE_SETTINGS,
  isGaMeasurementId,
  isGtmContainerId,
  type SiteSettings,
} from '@spb/types';
import { Shell } from '../../components/shell';
import { Field, fieldCls } from '../../components/modal';
import { HeroSettings } from '../../components/hero-settings';
import { logActivity } from '../../lib/activity';
import { publishError, publishHeaders } from '../../lib/publish';
import { WEBSITE_URL } from '../../lib/layouts';

const SETTINGS_API = `${WEBSITE_URL}/api/settings`;

export default function SettingsPage() {
  const [form, setForm] = useState<SiteSettings>(EMPTY_SITE_SETTINGS);
  const [saved, setSaved] = useState<SiteSettings>(EMPTY_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Each message resets the timer, so a quick second toast isn't cut short by
  // the first one's timeout still running.
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (m: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(m);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  // Settings live on the website (it's what serves the tags), so read them back
  // from there rather than keeping a separate admin-side copy that can drift.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(SETTINGS_API, { cache: 'no-store' });
        const s = { ...EMPTY_SITE_SETTINGS, ...((await res.json()) as Partial<SiteSettings>) };
        setForm(s);
        setSaved(s);
      } catch {
        flash(`Could not reach the website at ${WEBSITE_URL}.`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const gaOk = !form.gaMeasurementId || isGaMeasurementId(form.gaMeasurementId);
  const gtmOk = !form.gtmId || isGtmContainerId(form.gtmId);
  const dirty = JSON.stringify({ ...form, updatedAt: null }) !== JSON.stringify({ ...saved, updatedAt: null });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gaOk || !gtmOk) return;
    setSaving(true);
    try {
      const res = await fetch(SETTINGS_API, {
        method: 'POST',
        headers: publishHeaders(),
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        flash(await publishError(res, WEBSITE_URL));
        return;
      }
      const { settings } = (await res.json()) as { settings: SiteSettings };
      setForm(settings);
      setSaved(settings);
      flash('Settings published to the website ✓');
      logActivity({
        action: 'PUBLISH',
        entity: 'Settings',
        label: 'Site settings',
        note: [
          settings.gaMeasurementId ? `GA ${settings.gaMeasurementId}` : 'GA cleared',
          settings.gtmId ? `GTM ${settings.gtmId}` : null,
          `Hero: ${settings.heroMediaType}`,
        ]
          .filter(Boolean)
          .join(' · '),
      });
    } catch {
      flash(`Save failed — is the website running at ${WEBSITE_URL}?`);
    } finally {
      setSaving(false);
    }
  };

  const hint = 'mt-1 block text-xs text-muted-foreground';
  const bad = 'border-destructive focus:border-destructive';

  return (
    <Shell title="Settings">
      {loading ? (
        <div className="grid min-h-[40vh] place-items-center">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <form onSubmit={save} className="max-w-3xl space-y-6">
          {/* ── Hero background ── */}
          <HeroSettings form={form} set={set} flash={flash} />

          {/* ── Analytics ── */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Google Analytics</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste your GA4 measurement ID. Tracking starts on the public site as soon as you
              publish — no redeploy needed. Leave blank to disable analytics entirely.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="GA4 Measurement ID">
                <input
                  value={form.gaMeasurementId}
                  onChange={(e) => set('gaMeasurementId', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className={`${fieldCls} ${gaOk ? '' : bad}`}
                />
                <span className={gaOk ? hint : 'mt-1 block text-xs text-destructive'}>
                  {gaOk
                    ? 'Analytics → Admin → Data streams → your web stream'
                    : 'Must look like G-XXXXXXXXXX'}
                </span>
              </Field>

              <Field label="Google Tag Manager ID (optional)">
                <input
                  value={form.gtmId}
                  onChange={(e) => set('gtmId', e.target.value)}
                  placeholder="GTM-XXXXXXX"
                  className={`${fieldCls} ${gtmOk ? '' : bad}`}
                />
                <span className={gtmOk ? hint : 'mt-1 block text-xs text-destructive'}>
                  {gtmOk ? 'Only if you manage tags through GTM' : 'Must look like GTM-XXXXXXX'}
                </span>
              </Field>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  saved.gaMeasurementId ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                }`}
              />
              {saved.gaMeasurementId ? (
                <span>
                  Live — tracking as <b>{saved.gaMeasurementId}</b>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Not configured — no analytics scripts are loaded on the site.
                </span>
              )}
            </div>
          </section>

          {/* ── Verification ── */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">Site verification</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Verification tokens rendered as meta tags in the site&apos;s &lt;head&gt;.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Google Search Console">
                <input
                  value={form.googleSiteVerification}
                  onChange={(e) => set('googleSiteVerification', e.target.value)}
                  placeholder="google-site-verification token"
                  className={fieldCls}
                />
                <span className={hint}>Search Console → HTML tag method</span>
              </Field>
              <Field label="Meta / Facebook domain">
                <input
                  value={form.facebookDomainVerification}
                  onChange={(e) => set('facebookDomainVerification', e.target.value)}
                  placeholder="facebook-domain-verification token"
                  className={fieldCls}
                />
                <span className={hint}>Business Manager → Brand safety</span>
              </Field>
            </div>
          </section>

          {/* ── SEO overrides ── */}
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold">SEO overrides</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Leave blank to use the site&apos;s built-in title and description.
            </p>
            <div className="mt-5 grid gap-5">
              <Field label="Meta title">
                <input
                  value={form.metaTitle}
                  onChange={(e) => set('metaTitle', e.target.value)}
                  placeholder="Liberty Imperial Greens — Vacation-Themed Township, Gosaiganj, Lucknow"
                  maxLength={120}
                  className={fieldCls}
                />
                <span className={hint}>
                  {form.metaTitle.length}/120 — Google typically shows the first ~60.
                </span>
              </Field>
              <Field label="Meta description">
                <textarea
                  rows={3}
                  value={form.metaDescription}
                  onChange={(e) => set('metaDescription', e.target.value)}
                  placeholder="Pre-RERA launch at ₹1,799/sq.ft. …"
                  maxLength={320}
                  className={`${fieldCls} resize-none`}
                />
                <span className={hint}>
                  {form.metaDescription.length}/320 — aim for 150–160 characters.
                </span>
              </Field>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving || !gaOk || !gtmOk || !dirty}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {saving && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Publish to website
            </button>
            {dirty && (
              <span className="rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                Unsaved changes
              </span>
            )}
            {saved.updatedAt && !dirty && (
              <span className="text-xs text-muted-foreground">
                Last published {new Date(saved.updatedAt).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </form>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </Shell>
  );
}
