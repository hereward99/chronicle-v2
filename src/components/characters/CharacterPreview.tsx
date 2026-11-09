import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink, Pencil, X } from "lucide-react";
import type { Character } from "@/hooks/useCharacters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MentionText } from "@/components/mentions/MentionText";
import { statusBadgeClass } from "@/lib/statusColors";

interface Props {
  character: Character;
  position: number;
  total: number;
  coteries: Array<{ id: string; name: string }>;
  factions: Array<{ id: string; name: string }>;
  stories: Array<{ id: string; name: string }>;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onEdit: (character: Character) => void;
}

function PreviewContent({ character, position, total, coteries, factions, stories, onClose, onPrevious, onNext, onEdit }: Props) {
  const narrative = [
    ["Concept", character.concept], ["Ambition", character.ambition],
    ["Desire", character.desire], ["Appearance", character.appearance],
    ["Distinguishing features", character.distinguishing_features],
    ["History", character.history], ["Notes", character.notes],
  ];
  const groups = [
    { label: "Coteries", route: "/coteries", items: coteries },
    { label: "Factions", route: "/factions", items: factions },
    { label: "Stories", route: "/stories", items: stories },
  ];
  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3 pr-8 lg:pr-0">
        <span className="text-sm text-muted-foreground">{position + 1} of {total}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label="Previous character" title="Previous character" disabled={position <= 0} onClick={onPrevious}><ArrowLeft /></Button>
          <Button variant="ghost" size="icon" aria-label="Next character" title="Next character" disabled={position >= total - 1} onClick={onNext}><ArrowRight /></Button>
          <Button variant="ghost" size="icon" className="hidden lg:inline-flex" aria-label="Close preview" title="Close preview" onClick={onClose}><X /></Button>
        </div>
      </div>
      <div className="flex items-start gap-4 pt-5">
        <Avatar className="h-20 w-20 shrink-0 rounded-md border border-border">
          <AvatarImage src={character.avatar_url || undefined} alt={character.name} className="object-cover" />
          <AvatarFallback className="rounded-md bg-secondary text-secondary-foreground text-xl">{character.name.split(" ").map(n => n[0]).slice(0, 2).join("")}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-2">
          <h2 className="font-label text-xl break-words" id="character-preview-name">{character.name}</h2>
          <p className="text-sm text-muted-foreground break-words">{character.clan || "Unknown clan"}</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{character.type}</Badge>
            <Badge className={statusBadgeClass("character", character.status)}>{character.status}</Badge>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 py-5">
        <Button asChild variant="outline" size="sm"><Link to={`/characters/${character.id}`}><ExternalLink />Full character</Link></Button>
        <Button variant="secondary" size="sm" offlineDisabled onClick={() => onEdit(character)}><Pencil />Edit</Button>
      </div>
      <dl className="grid grid-cols-2 gap-4 border-y border-border py-4 text-sm">
        {character.clan !== "Human" && character.clan !== "Ghoul" && <div><dt className="text-muted-foreground">Generation</dt><dd>{character.generation ?? "—"}</dd></div>}
        {character.sire && <div className="min-w-0"><dt className="text-muted-foreground">Sire</dt><dd className="break-words"><MentionText text={character.sire} /></dd></div>}
        {character.predator_type && <div><dt className="text-muted-foreground">Predator type</dt><dd className="break-words">{character.predator_type}</dd></div>}
      </dl>
      <div className="space-y-5 py-5">
        {groups.filter(group => group.items.length > 0).map(group => (
          <section key={group.label} className="space-y-2">
            <h3 className="font-label text-sm text-muted-foreground">{group.label}</h3>
            <div className="flex flex-wrap gap-2">{group.items.map(item => <Button key={item.id} asChild variant="link" size="sm" className="h-auto max-w-full p-0 whitespace-normal text-left justify-start"><Link to={`${group.route}/${item.id}`} className="break-words">{item.name}</Link></Button>)}</div>
          </section>
        ))}
        {narrative.filter(([, text]) => typeof text === "string" && text.trim()).map(([label, text]) => (
          <section key={label} className="space-y-2">
            <h3 className="font-label text-sm text-muted-foreground">{label}</h3>
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed"><MentionText text={text || ""} /></p>
          </section>
        ))}
      </div>
    </>
  );
}

export function CharacterPreview(props: Props) {
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (!desktop) return (
    <Sheet open onOpenChange={open => { if (!open) props.onClose(); }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto pb-24" aria-describedby="preview-description">
        <SheetTitle className="sr-only">Character preview: {props.character.name}</SheetTitle>
        <SheetDescription id="preview-description" className="sr-only">Character overview</SheetDescription>
        <PreviewContent {...props} />
      </SheetContent>
    </Sheet>
  );
  return <aside aria-label="Character preview" className="sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto border-l border-border bg-surface-1 px-5 pb-5 min-w-0"><PreviewContent {...props} /></aside>;
}