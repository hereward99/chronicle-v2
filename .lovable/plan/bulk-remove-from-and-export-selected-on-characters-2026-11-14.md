# Bulk "Remove from…" and "Export selected" on Characters

Both actions belong to the bar that appears when you tick several characters on the Characters page.

## Remove from…
The reverse of "Add to…". Pick a session, story, coterie or faction, and every ticked character who belongs to it is removed in one go.
- Confirmation shows the numbers, e.g. "Remove 8 characters from *Session 14*? (2 aren't in it)".
- One undo notice puts them all back, roles included.
- Turned off while offline, like the other bulk actions.

## Export selected (PDF)
Makes one themed PDF holding the character sheets of only the ticked characters, in their current list order, using the existing character PDF style. Handy for a handout of tonight's NPCs.
- Choice of dark or printer-friendly version, as on session PDFs.
- Works offline, because it only reads data.

## Technical details
- Remove uses the existing link tables and hooks; undo saves the removed rows and puts them back.
- Export reuses the current character PDF code, adding pages for each character into a single file.
- No database changes.
