# Phase 2 — Sessions V2: Chronicle Journal

Phase 1 (shell) is live. This phase rebuilds Sessions — the page the original plan identified as the priority — from a records list into a chronicle journal that is easier to write during play and more rewarding to revisit afterwards.

All schema changes are additive and follow the shared-database rules: V1 keeps working untouched.

## Why Sessions first

Today, Sessions is a flat list of collapsible accordions grouped by story. Recording a session means opening a dialog and filling one long summary textarea — a chore mid-table. Re-reading means scanning walls of text. There is no "at the table" capture mode, no sense of chronicle progression, and no bridge from one session's loose ends into the next session's prep. Fixing this is the single biggest UX win in V2.

## What gets built

### A. Journal & Log view modes (reading)

Replace the accordion list with a **timeline spine**: sessions run down a vertical thread grouped by story arc, each entry a dated node.

- **Journal mode** — rich, image-forward; each session reads like a chapter. Entry shows date, title, a one-line hook, participating character portraits, an XP/consequence stamp, and the composed summary (or beats). Images render inline as a small gallery.
- **Log mode** — dense table (date, title, story, XP, participants, status) for finding things fast. Sortable, searchable, keeps the existing search box.
- A view-mode toggle persists per user (localStorage, like `useRestorableState`). Default to Journal.
- Story-arc group headers stay, but render as section dividers on the spine rather than collapsible accordions.

### B. Session Recorder (writing — the chore-fix)

A focused capture page (`/sessions/:id/recorder` or an inline recorder panel on the detail page) with three stacked lanes, replacing the single long form for live capture:

- **Beats** — short timestamped bullets you jot mid-play. One keystroke to add (Enter commits, Shift+Enter newline). Accept @mentions via the existing `MentionInput`. Each beat is its own row so you can reorder, edit, delete individually.
- **Consequences** — things that changed: boons created/settled, deaths, status changes, location moves. Structured but quick: type + short note + optional linked entity. These are the chronicle-impact record.
- **Loose Ends** — open threads to resolve later. On save, each loose end auto-promotes into a checklist item on the next session's prep checklist (existing `session_checklists` / `checklist_items` tables), so nothing is forgotten.

On save, beats compose into the session `summary` field (newline-joined, mentions preserved). The summary remains manually editable afterward for players who prefer prose. The existing `EditSessionDialog` stays for full-field edits (title, date, XP, story, in-game dates, attachments).

**Attendance** becomes a portrait picker (click character avatars to toggle presence) instead of the current dropdown, reusing `useSessionCharacters.setSessionCharacters`.

### C. Session cards (delight)

Each session auto-derives a **session card**: date, title, attending character portraits, XP total, and one standout beat (the first consequence, or the first beat). This card is:
- The visual header on the Journal spine entry and the detail page.
- Usable as the PDF cover (extends `exportSessionToPDF`).
- Exportable as a shareable image (canvas render, optional — phase 2 stretch).

### D. "Previously on…" recap

On the next session's prep view (and at the top of an open session's detail page), a generated **recap block** assembles from the previous session's highlights: title, date, top beats, and any unresolved loose ends. Purely client-side assembly from existing session + beats data — no AI call required, though an optional AI-polished version can use the existing AI Gateway later.

### E. Small chronicle stats

A compact stats strip at the top of the Journal view: sessions played, in-game time elapsed (from earliest `in_game_date_start` to latest `in_game_date_end`), most-mentioned character (from @mention frequency across beats/summaries). Reuses `useChronicleStats` where possible.

## Storage — new `session_beats` table

Additive only. Matches the shape in the original plan:

```sql
create table public.session_beats (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  chronicle_id uuid not null references public.chronicles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'beat' check (kind in ('beat','consequence','loose_end')),
  body text not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.session_beats to authenticated;
grant all on public.session_beats to service_role;
alter table public.session_beats enable row level security;

-- chronicle-scoped RLS, identical shape to existing entity policies
create policy "Owner can manage session beats"
  on public.session_beats for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
```

A new `useSessionBeats` hook built on `useEntityCrud`, scoped to a session, with reorder support (mirrors `reorderSessions`). Loose-end promotion writes into `checklist_items` via the existing `useChecklists` API.

`src/integrations/supabase/types.ts` is regenerated/extended to include `session_beats`.

## What stays unchanged

- Existing routes (`/sessions`, `/sessions/:id`), `EditSessionDialog`, `CreateSessionDialog`, PDF export, offline guards, draft autosave, search, and the `data-shortcut="new"` FAB trigger all carry over.
- The detail route `/sessions/:id` remains; it gains the recorder + recap + session card, but deep links keep working.
- V1 reads the same `sessions` table; the new `session_beats` table is invisible to V1.

## Build order (reviewable checkpoints)

1. **Storage + hook** — `session_beats` migration, `useSessionBeats` hook, types update. No UI yet; verify with a query.
2. **Session Recorder** — the three-lane capture UI on the detail page, beats CRUD, consequence + loose-end lanes, loose-end → checklist promotion, portrait attendance picker. Summary composition on save.
3. **Journal & Log views** — timeline spine, view-mode toggle, story-arc dividers, session cards as spine entries, chronicle stats strip. Replaces the accordion list on `/sessions`.
4. **Recap block + PDF cover** — "Previously on…" assembly, session-card PDF cover.

Each checkpoint leaves the app fully usable; the old accordion list is only retired once the Journal view reaches parity in step 3.

## Is this V2-worthy?

Sessions is where players spend the most app time and where V1 hurts most. A journal that is fast to write at the table, reads like a story afterwards, and carries loose ends forward into prep is the core differentiator that makes this feel like a new generation rather than a reskin. Phases 3–4 (Dashboard "Table" view, two-pane lists, detail meta columns) round out the shell, but Sessions V2 is the heart of the upgrade.

## Open question for you

Loose-end promotion target: should each loose end become a **checklist item on an existing prep checklist** for the next session (if one exists), or always **create a fresh "Loose Ends" checklist** so they're grouped and never mixed with manual prep items? My recommendation is the dedicated "Loose Ends" checklist — cleaner, and you can still merge manually.
