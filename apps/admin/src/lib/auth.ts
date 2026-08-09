'use client';

import { useEffect, useState } from 'react';

/**
 * Standalone mock auth for the admin console. Mirrors the seeded super-admin.
 * When the NestJS API is online this is replaced by real JWT auth from @spb/api.
 *
 * The credentials come from the environment so the working password is not
 * committed to source control; the fallbacks below exist only so a fresh clone
 * runs locally without setup. This is still NOT real authentication — being
 * NEXT_PUBLIC_ values they are readable in the browser bundle, so the admin
 * host must additionally sit behind HTTP Basic Auth (see DEPLOYMENT.md).
 */
const KEY = 'spb_admin_session';

export const DEMO_CREDENTIALS = {
  email: process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'admin@royalnestrealty.in',
  password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'ChangeMe@123',
};

export interface Session {
  email: string;
  name: string;
  role: string;
}

export function signIn(email: string, password: string): Session | null {
  if (
    email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password
  ) {
    const session: Session = { email: DEMO_CREDENTIALS.email, name: 'Super Admin', role: 'SUPER_ADMIN' };
    localStorage.setItem(KEY, JSON.stringify(session));
    return session;
  }
  return null;
}

export function signOut(): void {
  localStorage.removeItem(KEY);
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/** Hook: returns session (undefined while loading, null if signed out). */
export function useSession(): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    setSession(getSession());
  }, []);
  return session;
}
