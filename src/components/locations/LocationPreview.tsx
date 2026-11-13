import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ExternalLink, MapPin, Pencil, X } from "lucide-react";
import type { Location } from "@/hooks/useLocations";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { MentionText } from "@/components/mentions/MentionText";
import { CharacterAttachmentsGallery } from "@/components/character/CharacterAttachmentsGallery";
import { getZoomForCoordinates } from "@/lib/coordinateZoom";

interface Props {
  location: Location;
  position: number;
  total: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onEdit: (location: Location) => void;
}

function PreviewContent({ location, position, total, onClose, onPrevious, onNext, onEdit }: Props) {
  return (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3 pr-8 lg:pr-0">
        <span className="text-sm text-muted-foreground">{position + 1} of {total}</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label="Previous location" title="Previous location" disabled={position <= 0} onClick={onPrevious}><ArrowLeft /></Button>
          <Button variant="ghost" size="icon" aria-label="Next location" title="Next location" disabled={position >= total - 1} onClick={onNext}><ArrowRight /></Button>
          <Button variant="ghost" size="icon" className="hidden lg:inline-flex" aria-label="Close preview" title="Close preview" onClick={onClose}><X /></Button>
        </div>
      </div>
      <div className="flex items-start gap-3 pt-5">
        <MapPin className="h-8 w-8 shrink-0 text-primary" />
        <div className="min-w-0 space-y-2">
          <h2 className="font-label text-xl break-words">{location.name}</h2>
          {(location.city_region || location.country) && <p className="text-sm text-muted-foreground break-words">{[location.city_region, location.country].filter(Boolean).join(", ")}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 py-5">
        <Button asChild variant="outline" size="sm"><Link to={`/locations/${location.id}`}><ExternalLink />Full location</Link></Button>
        <Button variant="secondary" size="sm" offlineDisabled onClick={() => onEdit(location)}><Pencil />Edit</Button>
      </div>
      <div className="space-y-5 border-t border-border py-5">
        {location.coordinates && <section className="space-y-2">
          <h3 className="font-label text-sm text-muted-foreground">Coordinates</h3>
          <a href={`https://www.google.com/maps/d/u/0/viewer?mid=1Y2Zyar_gNkgjPoLZ7Q9Vmo5x-obp4WA&ll=${encodeURIComponent(location.coordinates)}&z=${getZoomForCoordinates(location.coordinates)}`} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-start gap-1.5 text-sm text-primary hover:underline">
            <MapPin className="h-4 w-4 shrink-0" /><span className="break-words min-w-0">{location.coordinates}</span><ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </section>}
        {[["Description", location.description], ["Notes", location.notes]].filter(([, text]) => text?.trim()).map(([label, text]) => <section key={label} className="space-y-2">
          <h3 className="font-label text-sm text-muted-foreground">{label}</h3>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed"><MentionText text={text || ""} /></p>
        </section>)}
        {location.attachments && location.attachments.length > 0 && <CharacterAttachmentsGallery key={location.id} attachments={location.attachments} />}
      </div>
    </>
  );
}

export function LocationPreview(props: Props) {
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (!desktop) return <Sheet open onOpenChange={open => { if (!open) props.onClose(); }}>
    <SheetContent className="w-full sm:max-w-md overflow-y-auto pb-24" aria-describedby="location-preview-description">
      <SheetTitle className="sr-only">Location preview: {props.location.name}</SheetTitle>
      <SheetDescription id="location-preview-description" className="sr-only">Location overview</SheetDescription>
      <PreviewContent {...props} />
    </SheetContent>
  </Sheet>;
  return <aside aria-label="Location preview" className="sticky top-6 max-h-[calc(100dvh-3rem)] overflow-y-auto border-l border-border bg-surface-1 px-5 pb-5 min-w-0"><PreviewContent {...props} /></aside>;
}