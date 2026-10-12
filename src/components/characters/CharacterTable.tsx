import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import type { Character } from "@/hooks/useCharacters";

interface Props {
  characters: Character[];
  selected: Set<string>;
  onToggle: (id: string, shift: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onOpen: (c: Character) => void;
  coterieNames: (id: string) => string;
  factionNames: (id: string) => string;
}

type Col = "name" | "clan" | "type" | "status" | "coterie" | "faction";

export function CharacterTable({ characters, selected, onToggle, onToggleAll, onOpen, coterieNames, factionNames }: Props) {
  const [sort, setSort] = useState<{ col: Col; dir: 1 | -1 } | null>(null);

  const rows = useMemo(() => {
    const get = (c: Character, col: Col) =>
      col === "coterie" ? coterieNames(c.id) : col === "faction" ? factionNames(c.id) : String(c[col] ?? "");
    if (!sort) return characters;
    return [...characters].sort((a, b) => get(a, sort.col).localeCompare(get(b, sort.col)) * sort.dir);
  }, [characters, sort, coterieNames, factionNames]);

  const allChecked = characters.length > 0 && characters.every(c => selected.has(c.id));
  const header = (col: Col, label: string) => (
    <th className="text-left font-semibold px-3 py-2">
      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() =>
        setSort(s => (s?.col === col ? { col, dir: (s.dir * -1) as 1 | -1 } : { col, dir: 1 }))}>
        {label}<ArrowUpDown className="h-3 w-3 opacity-60" />
      </button>
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface-1">
      <table className="w-full text-sm">
        <thead className="bg-secondary/50 text-muted-foreground">
          <tr>
            <th className="w-10 px-3 py-2">
              <Checkbox aria-label="Select all shown" checked={allChecked} onCheckedChange={v => onToggleAll(v === true)} />
            </th>
            {header("name", "Name")}
            {header("clan", "Clan")}
            {header("type", "Type")}
            {header("status", "Status")}
            {header("coterie", "Coterie")}
            {header("faction", "Faction")}
          </tr>
        </thead>
        <tbody>
          {rows.map(c => {
            const ids = rows.map(r => r.id);
            void ids;
            return (
              <tr key={c.id} className={`border-t border-border hover:bg-secondary/40 ${selected.has(c.id) ? "bg-primary/10" : ""}`}>
                <td className="px-3 py-2" onClick={e => { e.preventDefault(); onToggle(c.id, e.shiftKey); }}>
                  <Checkbox aria-label={`Select ${c.name}`} checked={selected.has(c.id)} />
                </td>
                <td className="px-3 py-2">
                  <button className="font-medium text-foreground hover:text-primary text-left" onClick={() => onOpen(c)}>{c.name}</button>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{c.clan}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.type}</td>
                <td className="px-3 py-2"><Badge variant="outline">{c.status}</Badge></td>
                <td className="px-3 py-2 text-muted-foreground">{coterieNames(c.id) || "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{factionNames(c.id) || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
