'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  MARKETING_CATEGORIES,
  MARKETING_KINDS,
  MARKETING_KIND_LABEL,
  isMarketingCategory,
  isMarketingKind,
  marketingPoster,
  type MarketingCategory,
  type MarketingItem,
  type MarketingKind,
} from '@spb/types';
import { Shell } from '../../components/shell';
import { Modal, Field, fieldCls } from '../../components/modal';
import {
  Trash,
  Up,
  Down,
  Plus,
  FileText,
  Film,
  Image as ImageIcon,
  LinkIcon,
  External,
} from '../../components/icons';
import { logActivity } from '../../lib/activity';
import {
  MAX_PDF_BYTES,
  detectMarketingKind,
  formatBytes,
  itemFromFile,
  marketingId,
  marketingSize,
  normaliseUrl,
  publishMarketing,
  readMarketing,
  writeMarketing,
} from '../../lib/marketing';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml,application/pdf';

const KIND_ICON: Record<MarketingKind, typeof FileText> = {
  image: ImageIcon,
  pdf: FileText,
  video: Film,
};

type Draft = {
  url: string;
  kind: MarketingKind;
  title: string;
  description: string;
  category: MarketingCategory;
  thumbnail: string;
};

/** "…/Liberty-Brochure-v2.pdf" -> "Liberty Brochure v2". Best effort only —
 *  a malformed escape sequence must not break typing in the field. */
function titleFromUrl(raw: string): string {
  // A YouTube/Vimeo slug is an opaque id, never a title worth pre-filling.
  if (/youtu\.?be|vimeo\.com/i.test(raw)) return '';
  const last = (raw.split(/[?#]/)[0] ?? '').split('/').filter(Boolean).pop() ?? '';
  let decoded = last;
  try {
    decoded = decodeURIComponent(last);
  } catch {
    /* keep the raw segment */
  }
  return decoded
    .replace(/\.[^.]+$/, '')
    .replace(/[-_+]+/g, ' ')
    .trim()
    .slice(0, 80);
}

const EMPTY_DRAFT: Draft = {
  url: '',
  kind: 'pdf',
  title: '',
  description: '',
  category: 'Brochures',
  thumbnail: '',
};

export default function MarketingPage() {
  const [items, setItems] = useState<MarketingItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<MarketingKind | 'All'>('All');
  const [busy, setBusy] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<MarketingItem | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  // Set once the user edits the title by hand, so auto-fill stops overwriting it.
  const [titleTouched, setTitleTouched] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Each message resets the timer — otherwise an earlier toast's timeout
   *  fires mid-way through the next one and clips it off the screen. */
  const flash = (m: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(m);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => () => void (toastTimer.current && clearTimeout(toastTimer.current)), []);

  useEffect(() => {
    setItems(readMarketing());
    setLoaded(true);
  }, []);

  /**
   * The single place that persists. On a quota failure the previous list is
   * kept, so the grid never shows something that didn't actually save.
   */
  const commit = (next: MarketingItem[]): boolean => {
    const res = writeMarketing(next);
    if (!res.ok) {
      flash(res.error ?? 'Could not save.');
      return false;
    }
    setItems(next);
    setDirty(true);
    return true;
  };

  /* ── Adding ───────────────────────────────────────────────────────────── */

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    const added: MarketingItem[] = [];

    for (const [i, file] of list.entries()) {
      setBusy(`Processing ${i + 1} of ${list.length}…`);
      try {
        const { kind, url, title } = await itemFromFile(file);
        added.push({
          id: marketingId(),
          kind,
          url,
          title,
          description: '',
          category: kind === 'image' ? 'Print & Ads' : 'Brochures',
        });
      } catch (e) {
        flash(`Skipped “${file.name}”: ${e instanceof Error ? e.message : 'unreadable'}`);
      }
    }

    setBusy(null);
    if (fileRef.current) fileRef.current.value = '';
    if (!added.length) return;

    if (commit([...items, ...added])) {
      flash(`Added ${added.length} file${added.length === 1 ? '' : 's'}.`);
      logActivity({
        action: 'CREATE',
        entity: 'Marketing',
        label: `${added.length} marketing file${added.length === 1 ? '' : 's'}`,
        note: added.map((a) => a.title).slice(0, 4).join(', '),
      });
    }
  };

  const openLinkForm = () => {
    setDraft(EMPTY_DRAFT);
    setTitleTouched(false);
    setLinkOpen(true);
  };

  /** Re-detect the kind and suggest a title as the URL is typed/pasted. */
  const onDraftUrl = (raw: string) => {
    const kind = raw.trim() ? detectMarketingKind(normaliseUrl(raw).url) : draft.kind;
    const suggested = titleTouched || !raw.trim() ? draft.title : titleFromUrl(raw);
    setDraft((d) => ({ ...d, url: raw, kind, title: suggested || d.title }));
  };

  const saveLink = () => {
    const { url, ok } = normaliseUrl(draft.url);
    if (!ok) {
      flash('That link does not look right — use a full https:// address.');
      return;
    }
    const thumb = draft.thumbnail.trim() ? normaliseUrl(draft.thumbnail) : null;
    const item: MarketingItem = {
      id: marketingId(),
      kind: draft.kind,
      url,
      title: draft.title.trim() || 'Untitled',
      description: draft.description.trim(),
      category: draft.category,
      ...(thumb?.ok ? { thumbnail: thumb.url } : {}),
    };
    if (!commit([...items, item])) return;
    setLinkOpen(false);
    flash(`Added “${item.title}”.`);
    logActivity({
      action: 'CREATE',
      entity: 'Marketing',
      entityId: item.id,
      label: item.title,
      note: `${MARKETING_KIND_LABEL[item.kind]} · ${item.category}`,
    });
  };

  /* ── Editing ──────────────────────────────────────────────────────────── */

  const patch = (id: string, p: Partial<MarketingItem>) => {
    const before = items.find((x) => x.id === id);
    commit(items.map((x) => (x.id === id ? { ...x, ...p } : x)));
    if (before && p.category && p.category !== before.category) {
      logActivity({
        action: 'UPDATE',
        entity: 'Marketing',
        entityId: id,
        label: before.title,
        changes: [{ field: 'category', from: before.category, to: p.category }],
      });
    }
  };

  const remove = (item: MarketingItem) => {
    commit(items.filter((x) => x.id !== item.id));
    setConfirmDelete(null);
    logActivity({ action: 'DELETE', entity: 'Marketing', entityId: item.id, label: item.title });
    flash(`Removed “${item.title}” — publish to update the website.`);
  };

  /** Move within the full list so the published order matches this grid. */
  const move = (id: string, dir: -1 | 1) => {
    const from = items.findIndex((x) => x.id === id);
    const to = from + dir;
    if (from < 0 || to < 0 || to >= items.length) return;
    const next = [...items];
    [next[from], next[to]] = [next[to]!, next[from]!];
    commit(next);
  };

  const publish = async () => {
    setPublishing(true);
    const res = await publishMarketing(items);
    setPublishing(false);
    if (res.ok) {
      setDirty(false);
      flash(`Published ${res.count} item${res.count === 1 ? '' : 's'} to the website ✓`);
      logActivity({
        action: 'PUBLISH',
        entity: 'Marketing',
        label: 'Website marketing material',
        note: `${res.count} items pushed live`,
      });
    } else {
      flash(res.error ?? 'Publish failed.');
    }
  };

  /* ── Derived ──────────────────────────────────────────────────────────── */

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of items) c[i.kind] = (c[i.kind] ?? 0) + 1;
    return c;
  }, [items]);

  const shown = filter === 'All' ? items : items.filter((i) => i.kind === filter);
  const size = marketingSize(items);

  const pill = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
      active ? 'border-foreground bg-foreground text-background' : 'border-border hover:bg-accent'
    }`;

  return (
    <Shell title="Marketing Material">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Website <b className="text-foreground">/marketing</b> page ·{' '}
            <b className="text-foreground">{items.length}</b> item
            {items.length === 1 ? '' : 's'} · {formatBytes(size)} stored
          </p>
          {size > 3_500_000 && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              Approaching the browser storage limit — add large files by URL instead of uploading.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            onClick={openLinkForm}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-accent"
          >
            <LinkIcon width={16} height={16} /> Add by URL
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <Plus width={16} height={16} /> Upload files
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
            <p className="text-sm font-medium">Drop brochures or images here, or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF up to {formatBytes(MAX_PDF_BYTES)} · PNG · JPG · WebP · SVG — images are resized
              automatically. Videos and larger PDFs go in via <b>Add by URL</b>.
            </p>
          </>
        )}
      </div>

      {/* Kind filter */}
      <div className="mb-5 flex flex-wrap gap-2">
        <button onClick={() => setFilter('All')} className={pill(filter === 'All')}>
          All ({items.length})
        </button>
        {MARKETING_KINDS.map((k) => (
          <button
            key={k}
            onClick={() => setFilter(filter === k ? 'All' : k)}
            className={pill(filter === k)}
          >
            {MARKETING_KIND_LABEL[k]}s ({counts[k] ?? 0})
          </button>
        ))}
      </div>

      {loaded && items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <FileText width={26} height={26} />
          </div>
          <h3 className="mt-4 font-semibold">Nothing published yet</h3>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
            Upload the brochure and price list, or paste a YouTube link for the township
            walkthrough. Then hit <b>Publish to website</b> — until you do, the public page shows
            its “coming soon” message.
          </p>
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-8 py-14 text-center text-sm text-muted-foreground">
          No {filter === 'All' ? 'items' : `${MARKETING_KIND_LABEL[filter].toLowerCase()}s`} yet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((item) => {
            const idx = items.findIndex((x) => x.id === item.id);
            const Icon = KIND_ICON[item.kind];
            const poster = marketingPoster(item);
            const isData = item.url.startsWith('data:');
            return (
              <div
                key={item.id}
                className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="relative aspect-[16/10] bg-muted">
                  {poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={poster}
                      alt=""
                      // YouTube stills carry 4:3 letterbox bars — scale them out.
                      className={`h-full w-full object-cover ${item.kind === 'image' ? '' : 'scale-110'}`}
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-muted-foreground">
                      <Icon width={40} height={40} />
                    </span>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                    #{idx + 1}
                  </span>
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[0.65rem] font-semibold uppercase text-white">
                    <Icon width={11} height={11} />
                    {MARKETING_KIND_LABEL[item.kind]}
                  </span>
                </div>

                {/* grid-cols-1 (minmax(0,1fr)) rather than an auto column, so a
                    long URL can truncate instead of widening the whole card. */}
                <div className="grid flex-1 grid-cols-1 content-start gap-2 p-3">
                  <input
                    value={item.title}
                    onChange={(e) => patch(item.id, { title: e.target.value })}
                    placeholder="Title"
                    aria-label={`Title for item ${idx + 1}`}
                    className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm font-medium outline-none focus:border-primary"
                  />
                  <textarea
                    value={item.description}
                    onChange={(e) => patch(item.id, { description: e.target.value })}
                    placeholder="Short description (optional)"
                    aria-label={`Description for item ${idx + 1}`}
                    rows={2}
                    className="w-full resize-y rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                  />

                  <div className="flex items-center gap-1.5">
                    <select
                      value={item.category}
                      onChange={(e) =>
                        isMarketingCategory(e.target.value) &&
                        patch(item.id, { category: e.target.value })
                      }
                      aria-label={`Category for item ${idx + 1}`}
                      className="min-w-0 flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                    >
                      {MARKETING_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <select
                      value={item.kind}
                      onChange={(e) =>
                        isMarketingKind(e.target.value) && patch(item.id, { kind: e.target.value })
                      }
                      aria-label={`Type for item ${idx + 1}`}
                      className="w-20 shrink-0 rounded-lg border border-input bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
                    >
                      {MARKETING_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {MARKETING_KIND_LABEL[k]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="min-w-0 flex-1 truncate rounded-lg bg-muted px-2 py-1.5 text-[0.65rem] text-muted-foreground">
                      {isData ? `Uploaded file · ${formatBytes(item.url.length)}` : item.url}
                    </span>
                    {!isData && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`Open ${item.title}`}
                        className="rounded-lg border border-border p-1.5 hover:bg-accent"
                      >
                        <External width={13} height={13} />
                      </a>
                    )}
                    <button
                      onClick={() => move(item.id, -1)}
                      disabled={idx === 0}
                      aria-label={`Move ${item.title} earlier`}
                      className="rounded-lg border border-border p-1.5 hover:bg-accent disabled:opacity-30"
                    >
                      <Up width={13} height={13} />
                    </button>
                    <button
                      onClick={() => move(item.id, 1)}
                      disabled={idx === items.length - 1}
                      aria-label={`Move ${item.title} later`}
                      className="rounded-lg border border-border p-1.5 hover:bg-accent disabled:opacity-30"
                    >
                      <Down width={13} height={13} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(item)}
                      aria-label={`Delete ${item.title}`}
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
        Items appear on the website in this order, grouped by the filters shown there. Nothing goes
        live until you press <b>Publish to website</b>.
      </p>

      {/* Add by URL */}
      <Modal open={linkOpen} title="Add by URL" onClose={() => setLinkOpen(false)}>
        <div className="grid gap-3.5">
          <Field label="Link (PDF, image, YouTube / Vimeo, or video file)">
            <input
              value={draft.url}
              onChange={(e) => onDraftUrl(e.target.value)}
              placeholder="https://…"
              autoFocus
              className={fieldCls}
            />
          </Field>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Type">
              <select
                value={draft.kind}
                onChange={(e) =>
                  isMarketingKind(e.target.value) &&
                  setDraft((d) => ({ ...d, kind: e.target.value as MarketingKind }))
                }
                className={fieldCls}
              >
                {MARKETING_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {MARKETING_KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Category">
              <select
                value={draft.category}
                onChange={(e) =>
                  isMarketingCategory(e.target.value) &&
                  setDraft((d) => ({ ...d, category: e.target.value as MarketingCategory }))
                }
                className={fieldCls}
              >
                {MARKETING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Title">
            <input
              value={draft.title}
              onChange={(e) => {
                setTitleTouched(true);
                setDraft((d) => ({ ...d, title: e.target.value }));
              }}
              placeholder="e.g. Liberty Imperial Greens — Brochure"
              className={fieldCls}
            />
          </Field>

          <Field label="Description (optional)">
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={2}
              placeholder="One line about what this is."
              className={`${fieldCls} resize-y`}
            />
          </Field>

          <Field label="Thumbnail URL (optional — YouTube fills this in automatically)">
            <input
              value={draft.thumbnail}
              onChange={(e) => setDraft((d) => ({ ...d, thumbnail: e.target.value }))}
              placeholder="https://…"
              className={fieldCls}
            />
          </Field>

          <div className="mt-1 flex justify-end gap-2">
            <button
              onClick={() => setLinkOpen(false)}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={saveLink}
              disabled={!draft.url.trim()}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
            >
              Add item
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <h3 className="font-semibold">Delete item</h3>
            <p className="mt-2 text-sm">
              Remove <b>{confirmDelete.title}</b> from the marketing page?
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
        <div className="fixed bottom-5 right-5 z-[60] max-w-sm rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </Shell>
  );
}
