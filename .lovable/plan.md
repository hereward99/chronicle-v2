# Remove from… only lists places the ticked characters are actually in

## What changes
When you choose **Remove from…** and pick a session, story, coterie or faction, the second list will show only the ones that contain at least one of the ticked characters. Each one also shows how many of them are in it, e.g. "Session 14 (3 of 5)".
- If none of them belong to any, you'll see "None of the selected characters are in a session" instead of an empty list.
- Adding to a session, story, coterie or faction stays the same and still lists everything.

## Technical details
- In BulkActionBar, when the Remove dialog opens or the chosen type changes, it looks up the link rows for the selected characters (session_characters / plot_characters / coterie_members / character_factions, filtered with `in("character_id", selectedIds)`). It counts them for each place and filters the options down to the places that have at least one match.
- A short loading state appears while that lookup runs, and the Remove button stays disabled until it finishes.
- Nothing changes in the database.
