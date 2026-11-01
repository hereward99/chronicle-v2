import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Character } from "@/hooks/useCharacters";
import { filterCast } from "./castSelection";

interface CastPickerProps {
  characters: Character[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function CastPicker({ characters, selectedIds, onSelectionChange, disabled }: CastPickerProps) {
  const [search, setSearch] = useState("");
  const [clan, setClan] = useState("__none__");
  const [type, setType] = useState("__none__");
  const [coterie, setCoterie] = useState("__none__");
  const selected = new Set(selectedIds);
  const clans = useMemo(() => [...new Set(characters.map(c => c.clan).filter(Boolean))].sort(), [characters]);
  const coteries = useMemo(() => [...new Set(characters.map(c => c.coterie).filter((c): c is string => Boolean(c)))].sort(), [characters]);
  const shown = useMemo(() => filterCast(characters, search, clan, type, coterie).sort((a, b) => a.name.localeCompare(b.name)), [characters, search, clan, type, coterie]);

  const toggle = (id: string, checked: boolean) => {
    onSelectionChange(checked ? [...new Set([...selectedIds, id])] : selectedIds.filter(value => value !== id));
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input aria-label="Search cast" placeholder="Search characters…" value={search} onChange={event => setSearch(event.target.value)} className="pl-9" disabled={disabled} />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Select value={clan} onValueChange={setClan} disabled={disabled}>
          <SelectTrigger aria-label="Filter cast by clan"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="__none__">All clans</SelectItem>{clans.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={type} onValueChange={setType} disabled={disabled}>
          <SelectTrigger aria-label="Filter cast by type"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="__none__">PCs & NPCs</SelectItem><SelectItem value="PC">Player characters</SelectItem><SelectItem value="NPC">NPCs</SelectItem></SelectContent>
        </Select>
        <Select value={coterie} onValueChange={setCoterie} disabled={disabled}>
          <SelectTrigger aria-label="Filter cast by coterie"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="__none__">All coteries</SelectItem>{coteries.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={disabled || shown.length === 0} onClick={() => onSelectionChange([...new Set([...selectedIds, ...shown.map(c => c.id)])])}>Select all shown</Button>
        <Button type="button" variant="ghost" size="sm" disabled={disabled || shown.length === 0} onClick={() => { const ids = new Set(shown.map(c => c.id)); onSelectionChange(selectedIds.filter(id => !ids.has(id))); }}>Clear shown</Button>
        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onSelectionChange([...new Set([...selectedIds, ...characters.filter(c => c.type === "PC").map(c => c.id)])])}>All player characters</Button>
        <span className="text-xs text-muted-foreground" aria-live="polite">{selectedIds.length} selected · {shown.length} shown</span>
      </div>
      <ScrollArea className="h-[240px] rounded-md border border-border">
        {shown.length === 0 ? <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground"><Users className="h-6 w-6" /><p>No matching characters</p></div> : (
          <div className="divide-y divide-border">
            {shown.map(character => (
              <label key={character.id} className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/50">
                <Checkbox aria-label={`Include ${character.name}`} checked={selected.has(character.id)} onCheckedChange={value => toggle(character.id, value === true)} disabled={disabled} />
                <span className="min-w-0 flex-1"><span className="block break-words text-sm font-medium">{character.name}</span><span className="block break-words text-xs text-muted-foreground">{[character.clan, character.type, character.coterie].filter(Boolean).join(" · ")}</span></span>
              </label>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}