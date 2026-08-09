'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import NextImage from 'next/image';
import { getSession, signOut } from '../lib/auth';
import { logActivity } from '../lib/activity';
import { ThemeToggle } from './theme-toggle';
import {
  Bell,
  Building,
  Chart,
  Clock,
  Grid,
  Image,
  Logout,
  Map,
  Megaphone,
  Menu,
  Receipt,
  Search,
  Settings,
  User,
  Users,
} from './icons';

const nav = [
  { label: 'Dashboard', href: '/', icon: Grid },
  { label: 'Projects', href: '/projects', icon: Building },
  { label: 'Plot Inventory', href: '/plots', icon: Map },
  { label: 'Bookings', href: '/bookings', icon: Receipt },
  { label: 'Leads / CRM', href: '/leads', icon: Users },
  { label: 'Customers', href: '/customers', icon: User },
  { label: 'Reports', href: '/reports', icon: Chart },
  { label: 'Activity Log', href: '/activity', icon: Clock },
  { label: 'Media', href: '/media', icon: Image },
  { label: 'Marketing Material', href: '/marketing', icon: Megaphone },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Shell({ children, title }: { children: React.ReactNode; title: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState('Super Admin');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace('/login');
      return;
    }
    setName(session.name);
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const logout = () => {
    // Log before clearing the session, so the entry still has an actor.
    logActivity({ action: 'SIGN_OUT', entity: 'Session', label: name });
    signOut();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-6">
          <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-navy">
            <NextImage
              src="/royal-nest-logo.png"
              alt="RoyalNest Realty"
              width={32}
              height={32}
              className="h-7 w-7 object-contain"
              priority
            />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-semibold">RoyalNest</span>
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-primary">
              Realty Admin
            </span>
          </span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {nav.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon width={18} height={18} />
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="absolute inset-x-3 bottom-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Logout width={18} height={18} /> Sign out
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              className="grid h-9 w-9 place-items-center rounded-lg border border-border lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu width={18} height={18} />
            </button>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <label className="hidden items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm sm:flex">
              <Search width={16} height={16} className="text-muted-foreground" />
              <input placeholder="Search…" className="w-40 bg-transparent outline-none" />
            </label>
            <ThemeToggle />
            <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-accent">
              <Bell width={17} height={17} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            </button>
            <div className="flex items-center gap-2 rounded-lg border border-border py-1 pl-1 pr-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                SA
              </span>
              <div className="hidden text-left sm:block">
                <div className="text-xs font-semibold leading-tight">{name}</div>
                <div className="text-[10px] text-muted-foreground">Super Admin</div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
