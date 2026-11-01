import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Users, Check } from "lucide-react";
import type { Character } from "@/hooks/useCharacters";
import { undoableAction } from "@/lib/undoableAction";
import { CastPicker } from "@/components/cast/CastPicker";
import { castChanges } from "@/components/cast/castSelection";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export interface GroupMember {
  characterId: string;
  role?: string | null;
}

interface GroupMembersPanelProps {
  /** All characters available to pick from (typically scoped to chronicle). */
  characters: Character[];
  /** Currently assigned members. */
  members: GroupMember[];
  /** Add a character to the group. */
  onAdd: (characterId: string, role?: string) => Promise<void> | void;
  /** Remove a character from the group. */
  onRemove: (characterId: string) => Promise<void> | void;
  /** Show optional "role" input next to the picker (default false). */
  showRole?: boolean;
  /** Label above the picker. */
  addLabel?: string;
  /** Label above the members list. */
  membersLabel?: string;
  /** Empty-state copy. */
  emptyCopy?: string;
  /** Height of the members list. */
  listHeight?: string;
  /** Disable interactions while parent is busy. */
  disabled?: boolean;
}

/**
 * Standardized panel for managing a group's character membership.
 * Used by Coteries, Factions, Stories, and Sessions for a consistent UX.
 */
export function GroupMembersPanel({
  characters,
  members,
  onAdd,
  onRemove,
  showRole = false,
  addLabel = "Add Character",
  membersLabel,
  emptyCopy = "No members yet",
  listHeight = "h-[240px]",
  disabled = false,
}: GroupMembersPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { isOnline } = useOnlineStatus();

  const enrichedMembers = useMemo(() => {
    return members
      .map(m => {
        const character = characters.find(c => c.id === m.characterId);
        return character ? { character, role: m.role } : null;
      })
      .filter(Boolean) as { character: Character; role: string | null | undefined }[];
  }, [members, characters]);

  const currentIds = members.map(member => member.characterId);
  const draftIds = selectedIds ?? currentIds;
  const changes = castChanges(currentIds, draftIds, characters.map(character => character.id));

  const handleAdd = async () => {
    if (!isOnline || disabled || busy) return;
    setBusy(true);
    setSaveError(null);
    try {
      for (const id of changes.added) await onAdd(id, showRole ? role.trim() || undefined : undefined);
      for (const id of changes.removed) await onRemove(id);
      setSelectedIds(null);
      setRole("");
    } catch {
      setSaveError("Some cast changes could not be saved. Your selection is kept; retry to finish.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = (characterId: string) => {
    const member = characters.find(c => c.id === characterId);
    const name = member?.name ?? "Member";
    undoableAction({
      description: `Removed ${name}`,
      perform: () => onRemove(characterId),
    });
  };


  const isDisabled = disabled || busy || !isOnline;

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          {addLabel}
        </Label>
        <CastPicker characters={characters} selectedIds={draftIds} onSelectionChange={setSelectedIds} disabled={isDisabled} />
        <div className="flex flex-wrap items-center gap-2">
          {showRole && (
            <Input
              placeholder="Role (optional)"
              value={role}
              onChange={e => setRole(e.target.value)}
              aria-label="Role for newly added characters"
              className="w-full sm:w-48 bg-input border-border"
              disabled={isDisabled}
            />
          )}
          <Button
            type="button"
            onClick={handleAdd}
            offlineDisabled
            disabled={isDisabled || changes.added.length + changes.removed.length === 0}
            size="sm"
          >
            <Check className="h-4 w-4" />
            {busy ? "Applying…" : "Apply cast changes"}
          </Button>
          {selectedIds !== null && <Button type="button" variant="ghost" size="sm" disabled={isDisabled} onClick={() => { setSelectedIds(null); setSaveError(null); }}>Reset</Button>}
          <span className="text-xs text-muted-foreground">{changes.added.length} to add · {changes.removed.length} to remove</span>
        </div>
        {saveError && <p role="alert" className="text-sm text-destructive">{saveError}</p>}
      </div>

      <div className="space-y-2">
        {membersLabel && (
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            {membersLabel} ({enrichedMembers.length})
          </Label>
        )}
        <ScrollArea className={`${listHeight} rounded-md border border-border`}>
          {enrichedMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{emptyCopy}</p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {enrichedMembers.map(({ character, role }) => (
                <div
                  key={character.id}
                  className="flex items-center justify-between rounded-md border border-border bg-card p-2 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{character.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {character.clan}
                    </Badge>
                    {showRole && role && (
                      <Badge variant="outline" className="text-xs">
                        {role}
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    offlineDisabled
                    aria-label={`Remove ${character.name}`}
                    onClick={() => handleRemove(character.id)}
                    disabled={isDisabled}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
