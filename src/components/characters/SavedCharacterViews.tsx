import { useState } from "react";
import { Bookmark, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { matchesCharacterView, parseCharacterViews, saveCharacterView, storeCharacterViews, type CharacterViewSnapshot, type SavedCharacterView } from "@/lib/characterSavedViews";

interface Props {
  storageKey: string;
  snapshot: CharacterViewSnapshot;
  onApply: (snapshot: CharacterViewSnapshot) => void;
}

// The owning page keys this component by user + chronicle, resetting collection and dialog state together.
export function SavedCharacterViews({ storageKey, snapshot, onApply }: Props) {
  const [readFailed, setReadFailed] = useState(false);
  const [views, setViews] = useState<SavedCharacterView[]>(() => {
    try { return parseCharacterViews(localStorage.getItem(storageKey)); }
    catch { return []; }
  });
  const [selectedId, setSelectedId] = useState("__none__");
  const [saveMode, setSaveMode] = useState<"new" | "update" | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const selected = views.find(view => view.id === selectedId);
  const modified = selected && !matchesCharacterView(selected, snapshot);

  function persist(next: SavedCharacterView[]): boolean {
    try {
      // Re-check access before writing; unavailable browser storage must not produce a success stamp.
      localStorage.getItem(storageKey);
      storeCharacterViews(localStorage, storageKey, next);
      setViews(next);
      setReadFailed(false);
      return true;
    } catch {
      setReadFailed(true);
      setError("Browser storage is unavailable. The view could not be saved.");
      toast({ title: "Could not save views", description: "Allow browser storage and try again.", variant: "destructive" });
      return false;
    }
  }

  function openSave(mode: "new" | "update") {
    setName(mode === "update" ? selected?.name ?? "" : "");
    setError("");
    setSaveMode(mode);
  }

  function save() {
    if (!saveMode || (saveMode === "update" && !selected)) return;
    try {
      const id = saveMode === "update" && selected ? selected.id : crypto.randomUUID();
      const next = saveCharacterView(views, snapshot, name, id);
      if (!persist(next)) return;
      setSelectedId(id);
      setSaveMode(null);
      toast({ title: saveMode === "update" ? "View updated" : "View saved", description: name.trim() });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this view.");
    }
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Bookmark className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
      <Select value={selectedId} onValueChange={id => {
        setSelectedId(id);
        const view = views.find(item => item.id === id);
        if (view) onApply({ toolbar: { ...view.toolbar }, searchTerm: view.searchTerm });
      }}>
        <SelectTrigger aria-label="Saved character views" className="h-9 w-full min-w-0 max-w-[260px] flex-1 bg-input sm:w-[260px] sm:flex-none [&>span]:truncate">
          <SelectValue placeholder="Saved views" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">{views.length ? "Custom view" : "No saved views"}</SelectItem>
          {views.map(view => <SelectItem key={view.id} value={view.id}>{view.name}{view.id === selectedId && modified ? " (modified)" : ""}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button variant="outline" size="sm" onClick={() => openSave("new")}><Bookmark />Save view</Button>
      {selected && <>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Update saved view" onClick={() => openSave("update")} className="h-9 w-9"><Save /></Button></TooltipTrigger><TooltipContent>Update or rename view</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Delete saved view" onClick={() => setDeleting(true)} className="h-9 w-9 text-destructive"><Trash2 /></Button></TooltipTrigger><TooltipContent>Delete saved view</TooltipContent></Tooltip>
      </>}
      {readFailed && <span className="text-sm text-destructive" role="status">Views could not be saved.</span>}
      <Dialog open={saveMode !== null} onOpenChange={open => { if (!open) setSaveMode(null); }}>
        <DialogContent size="sm" className="w-[calc(100%-2rem)]">
          <DialogHeader><DialogTitle>{saveMode === "update" ? "Update saved view" : "Save character view"}</DialogTitle><DialogDescription>{saveMode === "update" ? "Replace this view with the current filters, search, grouping and sort order." : "Save the current filters, search, grouping and sort order in this browser."}</DialogDescription></DialogHeader>
          <form onSubmit={event => { event.preventDefault(); save(); }} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="character-view-name">View name</Label><Input id="character-view-name" value={name} onChange={event => setName(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? "character-view-error" : undefined} /></div>
            {error && <p id="character-view-error" role="alert" className="text-sm text-destructive">{error}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setSaveMode(null)}>Cancel</Button><Button type="submit" offlineDisabled={false} disabled={!name.trim()}><Save />Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent className="w-[calc(100%-2rem)]">
          <AlertDialogHeader><AlertDialogTitle>Delete saved view?</AlertDialogTitle><AlertDialogDescription>“{selected?.name}” will be removed. Characters and your current filters will not change.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><Button variant="destructive" offlineDisabled={false} onClick={() => {
            if (!selected || !persist(views.filter(view => view.id !== selected.id))) return;
            setSelectedId("__none__"); setDeleting(false);
            toast({ title: "View deleted" });
          }}>Delete view</Button></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}