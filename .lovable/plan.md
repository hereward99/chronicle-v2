# Phase 4a+ — Lists for managing characters, not just browsing them

## The problem
Big casts are hard to find, and linking characters to a session, story, coterie or faction happens one at a time from inside each of those screens.

## What we'll build

### 1. Characters page: two-pane + table mode
- **Two-pane view (desktop):** a compact list on the left, a live preview on the right (portrait, clan, status, coterie/faction, the stories and sessions they appear in, and an Open button). Arrow keys move through the list. On mobile, tapping opens the full page as it does now.
- **Table mode:** dense rows with sortable columns (name, clan, type PC/NPC, status, coterie, faction, last session seen). Useful for scanning 100+ characters.
- **Saved views:** named filter combinations ("Camarilla NPCs", "Dead or missing", "Not seen in 5 sessions"), kept per chronicle.
- **Group by:** clan, coterie, faction, status, or none.

### 2. Select many, act once
- Checkbox on every row/card, shift-click to select a range, "Select all filtered".
- An action bar appears with the selection count and:
  - Add to session…
  - Add to story…
  - Add to coterie… (with a role)
  - Add to faction… (with a role)
  - Remove from…
  - Set status (Active / Missing / Dead / Torpor etc.)
  - Export selected (PDF)
- Each action opens a small picker for the target, shows "Add 12 characters to *Session 14*? (3 are already there)", then one undo toast.

### 3. Better pickers from the other direction
Inside session, story, coterie and faction editors, replace the one-by-one add with a shared **Cast Picker**:
- Search, filters (clan, coterie, faction, PC/NPC), checkboxes, "select all shown".
- Smart shortcuts: "All player characters", "Everyone from the last session", "Members of coterie X", "Characters mentioned in this summary".
- Already-linked people shown ticked; untick to remove. One save.

### 4. Afterwards (same pattern)
Roll out the two-pane preview to Stories and Locations once Characters is settled.

## Out of scope
No database changes. Detail metadata strips (Phase 4b) come later.

## Technical details
- New `src/components/characters/CharacterTable.tsx`, `CharacterPreviewPane.tsx`, `BulkActionBar.tsx`, shared `src/components/cast/CastPicker.tsx`.
- Selection state in a `useSelection` hook; saved views/grouping in localStorage keyed by chronicle_id (consistent with existing toolbar persistence).
- Bulk link via batched inserts into existing junction tables (`session_characters`, `plot_characters`, `coterie_members`, faction members), skipping duplicates; one React Query invalidation; undo deletes inserted rows.
- Bulk actions disabled while offline; Radix selects use `__none__`.
- CastPicker replaces add flows in ManageCoterieDialog, ManageFactionMembersDialog, EditPlotDialog and session editors.

## Delivery order
1. Selection + bulk action bar + Cast Picker (biggest chore saver)
2. Table mode, group-by, saved views
3. Two-pane preview
4. Stories / Locations two-pane
