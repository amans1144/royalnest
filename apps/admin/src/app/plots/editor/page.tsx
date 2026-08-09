'use client';

import dynamic from 'next/dynamic';
import { Shell } from '../../../components/shell';

// The editor is browser-only (Canvas, pdf.js, localStorage) — skip SSR.
const LayoutEditor = dynamic(
  () => import('../../../components/layout-editor').then((m) => m.LayoutEditor),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-[60vh] place-items-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ),
  },
);

export default function PlotEditorPage() {
  return (
    <Shell title="Plot Layout Editor">
      <LayoutEditor />
    </Shell>
  );
}
