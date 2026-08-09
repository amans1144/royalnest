'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { DEMO_CREDENTIALS, signIn } from '../../lib/auth';
import { logActivity } from '../../lib/activity';
import { ThemeToggle } from '../../components/theme-toggle';
import { Lock, Mail } from '../../components/icons';

/** Fields are pre-filled and the credentials shown only outside production. */
const IS_DEV = process.env.NODE_ENV !== 'production';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(IS_DEV ? DEMO_CREDENTIALS.email : '');
  const [password, setPassword] = useState(IS_DEV ? DEMO_CREDENTIALS.password : '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const session = signIn(email, password);
      if (session) {
        logActivity({ action: 'SIGN_IN', entity: 'Session', label: session.name });
        router.push('/');
      } else {
        setError('Invalid email or password.');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy/85 via-navy/85 to-navy/95" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5">
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white/10 backdrop-blur">
              <Image
                src="/royal-nest-logo.png"
                alt="RoyalNest Realty"
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
                priority
              />
            </span>
            <span className="text-xl font-semibold">RoyalNest Realty</span>
          </div>
          <div>
            <h1 className="max-w-md text-4xl font-semibold leading-tight">
              Operations, orchestrated.
            </h1>
            <p className="mt-4 max-w-md text-white/70">
              Manage projects, the interactive plot editor, bookings, and your sales pipeline —
              all in one command center.
            </p>
            <div className="mt-8 flex gap-8">
              {[['48', 'Projects'], ['12.4K', 'Customers'], ['₹486 Cr', 'Revenue']].map(([v, l]) => (
                <div key={l}>
                  <div className="text-2xl font-semibold">{v}</div>
                  <div className="text-sm text-white/60">{l}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm text-white/50">© {new Date().getFullYear()} RoyalNest Realty</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center p-6">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-navy">
              <Image
                src="/royal-nest-logo.png"
                alt="RoyalNest Realty"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
            </span>
            <span className="text-xl font-semibold">RoyalNest Realty</span>
          </div>

          <h2 className="text-2xl font-semibold">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your admin console.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3.5 focus-within:border-primary">
                <Mail width={18} height={18} className="text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent py-3 text-sm outline-none"
                  placeholder="you@royalnestrealty.in"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-3.5 focus-within:border-primary">
                <Lock width={18} height={18} className="text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent py-3 text-sm outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Sign in
            </button>
          </form>

          {/* Dev convenience only — a production build must never print the
              working password on its own sign-in screen. */}
          {IS_DEV && (
            <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Demo access</span> — pre-filled
              above.
              <br />
              {DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
