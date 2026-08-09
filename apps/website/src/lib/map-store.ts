'use client';

import { create } from 'zustand';
import { projects } from './mock-data';

interface MapState {
  slug: string;
  setSlug: (slug: string) => void;
}

/** Which project's plot map the Live Availability section is showing. */
export const useMapStore = create<MapState>((set) => ({
  slug: projects[0]?.slug ?? 'royal-greens-enclave',
  setSlug: (slug) => set({ slug }),
}));

/** Select a project's map and scroll the availability section into view. */
export function viewProjectMap(slug: string) {
  useMapStore.getState().setSlug(slug);
  requestAnimationFrame(() => {
    document.getElementById('availability')?.scrollIntoView({ behavior: 'smooth' });
  });
}
