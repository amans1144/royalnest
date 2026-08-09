'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from './icons';

/** Lightweight theme toggle: flips the `dark` class on <html> and persists it. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/50 text-foreground transition-colors hover:bg-accent ${className}`}
    >
      {dark ? <Sun width={18} height={18} /> : <Moon width={18} height={18} />}
    </button>
  );
}
