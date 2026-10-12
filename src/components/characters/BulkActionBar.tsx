import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, BookOpen, UsersRound, Flag, Tag, X } from "lucide-react";

type Target = "session" | "story" | "coterie" | "faction" | "status";

interface Option { id: string; label: string }

interface Props {
  selectedIds: string[];
  onClear: () => void;
  sessions: Option[];
  stories: Option[];
  coteries: Option[];
  factions: Option[];
  statuses: string[];
  onSetStatus: (ids: string[], status: string) => Promise<void>;
}

const CONFIG: Record<Exclude<Target, "status">, { table: "session_characters" | "plot_characters" | "coterie_members" | "character_factions"; fk: string; label: string; role: boolean }> = {
  session: { table: "session_characters", fk: "session_id", label: "session", role: false },
  story: { table: "plot_characters", fk: "plot_id", label: "story", role: false },
  coterie: { table: "coterie_members", fk: "coterie_id", label: "coterie", role: true },
  faction: { table: "character_factions", fk: "faction_id", label: "faction", role: true },
};

const INVALIDATE = ["session_characters", "session_characters_by_character", "plot_characters", "coterie_members", "characterFactions", "characters"];

export function BulkActionBar({ selectedIds, onClear, sessions, stories, coteries, factions, statuses, onSetStatus }: Props) {
  const [target, setTarget] = useState<Target | null>(null);
  const [choice, setChoice] = useState("__none__");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();
  const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;

  const options = useMemo(() => {
    switch (target) {
      case "session": return sessions;
      case "story": return stories;
      case "coterie": return coteries;
      case "faction": return factions;
      case "status": return statuses.map(s => ({ id: s, label: s }));
      default: return [];
    }
  }, [target, sessions, stories, coteries, factions, statuses]);

  const open = (t: Target) => { setTarget(t); setChoice("__none__"); setRole(""); };
  const refresh = () => INVALIDATE.forEach(k => qc.invalidateQueries({ queryKey: [k] }));

  const apply = async () => {
    if (!target || choice === "__none__") return;
    setBusy(true);
    try {
      if (target === "status") {
        await onSetStatus(selectedIds, choice);
        toast({ title: `Status set to ${choice}`, description: `${selectedIds.length} characters updated.` });
      } else {
        const cfg = CONFIG[target];
        const { data: existing, error: exErr } = await supabase
          .from(cfg.table).select("character_id").eq(cfg.fk as never, choice as never).in("character_id", selectedIds);
        if (exErr) throw exErr;
        const have = new Set((existing as { character_id: string }[] | null ?? []).map(r => r.character_id));
        const toAdd = selectedIds.filter(id => !have.has(id));
        if (toAdd.length) {
          let userId: string | undefined;
          if (target === "session") userId = (await supabase.auth.getUser()).data.user?.id;
          const rows = toAdd.map(character_id => ({
            character_id, [cfg.fk]: choice,
            ...(cfg.role && role.trim() ? { role: role.trim() } : {}),
            ...(userId ? { user_id: userId } : {}),
          }));
          const { data: inserted, error } = await supabase.from(cfg.table).insert(rows as never).select("id");
          if (error) throw error;
          const insertedIds = ((inserted as { id: string }[] | null) ?? []).map(r => r.id);
          const name = options.find(o => o.id === choice)?.label ?? cfg.label;
          toast({
            title: `Added ${toAdd.length} to ${name}`,
            description: have.size ? `${have.size} were already there.` : undefined,
            action: insertedIds.length ? (
              <Button variant="outline" size="sm" onClick={async () => {
                await supabase.from(cfg.table).delete().in("id", insertedIds);
                refresh();
              }}>Undo</Button>
            ) as never : undefined,
          });
        } else {
          toast({ title: "Nothing to add", description: "Everyone selected is already linked." });
        }
      }
      refresh();
      setTarget(null);
    } catch (e) {
      toast({ title: "Couldn't apply", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 shadow-lg max-w-[95vw]">
        <span className="text-sm font-semibold text-foreground px-1">{selectedIds.length} selected</span>
        <Button size="sm" variant="secondary" disabled={!isOnline} onClick={() => open("session")}><CalendarDays className="h-4 w-4 mr-1" />Session</Button>
        <Button size="sm" variant="secondary" disabled={!isOnline} onClick={() => open("story")}><BookOpen className="h-4 w-4 mr-1" />Story</Button>
        <Button size="sm" variant="secondary" disabled={!isOnline} onClick={() => open("coterie")}><UsersRound className="h-4 w-4 mr-1" />Coterie</Button>
        <Button size="sm" variant="secondary" disabled={!isOnline} onClick={() => open("faction")}><Flag className="h-4 w-4 mr-1" />Faction</Button>
        <Button size="sm" variant="secondary" disabled={!isOnline} onClick={() => open("status")}><Tag className="h-4 w-4 mr-1" />Status</Button>
        <Button size="icon" variant="ghost" aria-label="Clear selection" onClick={onClear}><X className="h-4 w-4" /></Button>
      </div>

      <Dialog open={target !== null} onOpenChange={o => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{target === "status" ? "Set status" : `Add to ${target ? CONFIG[target as Exclude<Target, "status">].label : ""}`}</DialogTitle>
            <DialogDescription>{selectedIds.length} characters selected.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={choice} onValueChange={setChoice}>
              <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Choose…</SelectItem>
                {options.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {(target === "coterie" || target === "faction") && (
              <Input placeholder="Role (optional)" value={role} onChange={e => setRole(e.target.value)} maxLength={80} />
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setTarget(null)}>Cancel</Button>
            <Button onClick={apply} disabled={busy || choice === "__none__" || !isOnline}>{busy ? "Applying…" : "Apply"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
