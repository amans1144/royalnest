'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  GALLERY_CATEGORIES,
  isGalleryCategory,
  type GalleryCategory,
  type GalleryImage,
} from '@spb/types';
import { Shell } from '../../components/shell';
import { Trash, Up, Down, Plus } from '../../components/icons';
import { logActivity } from '../../lib/activity';
import {
  compressImage,
  formatBytes,
  galleryId,
  gallerySize,
  publishGallery,
  readGallery,
  writeGallery,
} from '../../lib/gallery';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml';

export default function MediaPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<GalleryCategory | 'All'>('All');
  const [busy, setBusy] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<GalleryImage | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    setImages(readGallery());
    setLoaded(true);
  }, []);

  /** Single place that persists + surfaces a quota failure. */
  const commit = (next: GalleryImage[]) => {
    const res = writeGallery(next);
    setImages(next);
    setDirty(true);
    if (!res.ok) flash(res.error ?? 'Could not save.');
    return res.ok;
  };

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!list.length) {
      flash('Pick PNG, JPG, WebP or SVG images.');
      return;
    }
    const added: GalleryImage[] = [];
    for (const [i, file] of list.entries()) {
      setBusy(`Processing ${i + 1} of ${list.length}…`);
      try {
        const { src } = await compressImage(file);
        added.push({
          id: galleryId(),
          src,
          // Filename minus extension makes a decent starting caption.
          label: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 80) || 'Untitled',
          category: filter === 'All' ? 'Township' : filter,
        });
      } catch (e) {
        flash(`Skipped "${file.name}": ${e instanceof Error ? e.message : 'unreadable'}`);
      }
    }
    setBusy(null);
    if (!added.length) return;
    const next = [...images, ...added];
    if (commit(next)) {
      flash(`Added ${added.length} image${added.length === 1 ? '' : 's'}.`);
      logActivity({
        action: 'CREATE',
        entity: 'Media',
        label: `${added.length} gallery image${added.length === 1 ? '' : 's'}`,
        note: added.map((a) => a.label).slice(0, 4).join(', '),
      });
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const patch = (id: string, p: Partial<GalleryImage>) => {
    const before = images.find((g) => g.id === id);
    commit(images.map((g) => (g.id === id ? { ...g, ...p } : g)));
    if (before && p.category && p.category !== before.category) {
      logActivity({
        action: 'UPDATE',
        entity: 'Media',
        entityId: id,
        label: before.label,
        changes: [{ field: 'category', from: before.category, to: p.category }],
      });
    }
  };

  const remove = (img: GalleryImage) => {
    commit(images.filter((g) => g.id !== img.id));
    setConfirmDelete(null);
    logActivity({ action: 'DELETE', entity: 'Media', entityId: img.id, label: img.label });
    flash(`Removed "${img.label}" — publish to update the website.`);
  };

  /** Move within the full list, using the visible neighbour as the target. */
  const move = (id: string, dir: -1 | 1) => {
    const from = images.findIndex((g) => g.id === id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= images.length) return;
    const next = [...images];
    [next[from], next[to]] = [next[to]!, next[from]!];
    commit(next);
  };

  const publish = async () => {
    setPublishing(true);
    const res = await publishGallery(images);
    setPublishing(false);
    if (res.ok) {
      setDirty(false);
      flash(`Published ${res.count} images to the website ✓`);
      logActivity({
        action: 'PUBLISH',
        entity: 'Media',
        label: 'Website gallery',
        note: `${res.count} images pushed live`,
      });
    } else {
      flash(res.error ?? 'Publish failed.');
    }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const g of images) c[g.category] = (c[g.category] ?? 0) + 1;
    return c;
  }, [images]);

  const shown = filter === 'All' ? images : images.filter((g) => g.category === filter);
  const size = gallerySize(images);

  const pill = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
      active ? 'border-foreground bg-foreground text-background' : 'border-border hover:bg-accent'
    }`;

  return (
    <Shell title="Media Library">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Website gallery · <b className="text-foreground">{images.length}</b> image
            {images.length === 1 ? '' : 's'} · {formatBytes(size)}
          </p>
          {size > 4_000_000 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Approaching the browser storage limit — publish and trim older images.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              Unpublished changes
            </span>
          )}
          <button
            onClick={publish}
            disabled={publishing}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {publishing && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Publish to website
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus width={16} height={16} /> Upload images
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => e.target.files && addFiles(e.target.files)}
      />

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
        className={`mb-5 cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/30'
        }`}
      >
        {busy ? (
          <p className="text-sm font-medium">{busy}</p>
        ) : (
          <>
            <p className="text-sm font-medium">Drop images here, or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG · JPG · WebP · SVG — resized to 1600px and compressed automatically
              {filter !== 'All' && ` · filed under “${filter}”`}
            </p>
          </>
        )}
      </div>

      {/* Category filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button onClick={() => setFilter('All')} className={pill(filter === 'All')}>
          All ({images.length})
        </button>
        {GALLERY_CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(filter === c ? 'All' : c)} className={pill(filter === c)}>
            {c} ({counts[c] ?? 0})
          </button>
        ))}
      </div>

      {loaded && images.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-2xl text-primary">
            🖼
          </div>
          <h3 className="mt-4 font-semibold">No images uploaded yet</h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            The website currently shows its built-in placeholder gallery. Upload your own
            photographs here and hit <b>Publish to website</b> to replace them.
          </p>
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-8 py-14 text-center text-sm text-muted-foreground">
          No images in “{filter}”.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((g) => {
            const idx = images.findIndex((x) => x.id === g.id);
            return (
              <div key={g.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="relative aspect-[4/3] bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.src} alt={g.label} className="h-full w-full object-cover" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                    #{idx + 1}
                  </span>
                </div>
                <div className="grid gap-2 p-3">
                  <input
                    value={g.label}
                    onChange={(e) => patch(g.id, { label: e.target.value })}
                    placeholder="Caption"
                    aria-label={`Caption for image ${idx + 1}`}
                    className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                  />
                  <div className="flex items-center gap-1.5">
                    <select
                      value={g.category}
                      onChange={(e) =>
                        isGalleryCategory(e.target.value) && patch(g.id, { category: e.target.value })
                      }
                      aria-label={`Category for image ${idx + 1}`}
                      className="flex-1 rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                    >
                      {GALLERY_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => move(g.id, -1)}
                      disabled={idx === 0}
                      aria-label={`Move ${g.label} earlier`}
                      className="rounded-lg border border-border p-1.5 hover:bg-accent disabled:opacity-30"
                    >
                      <Up width={13} height={13} />
                    </button>
                    <button
                      onClick={() => move(g.id, 1)}
                      disabled={idx === images.length - 1}
                      aria-label={`Move ${g.label} later`}
                      className="rounded-lg border border-border p-1.5 hover:bg-accent disabled:opacity-30"
                    >
                      <Down width={13} height={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(g)}
                      aria-label={`Delete ${g.label}`}
                      className="rounded-lg border border-border p-1.5 text-destructive hover:bg-destructive/10"
                    >
                      <Trash width={13} height={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        The first six images (in this order) appear in the homepage gallery preview; all of them
        appear on the <b>/gallery</b> page.
      </p>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <h3 className="font-semibold">Delete image</h3>
            <p className="mt-2 text-sm">
              Remove <b>{confirmDelete.label}</b> from the gallery?
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              The website keeps showing it until you publish again.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => remove(confirmDelete)}
                className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </Shell>
  );
}
