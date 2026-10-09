import { Link } from "react-router-dom";
import { History } from "lucide-react";
import { MentionText } from "@/components/mentions/MentionText";
import { useSessionBeats } from "@/hooks/useSessionBeats";
import { stripMentions } from "@/lib/mentions";
import type { Session } from "@/hooks/useSessions";

/** "Previously on…" recap built from the session played just before this one. */
export function PreviouslyOn({ session, sessions }: { session: Session; sessions: Session[] }) {
  const prev = sessions
    .filter(s => s.id !== session.id && s.date_played <= session.date_played)
    .sort((a, b) => b.date_played.localeCompare(a.date_played) || b.created_at.localeCompare(a.created_at))[0];
  const { beats } = useSessionBeats(prev?.id, prev?.chronicle_id);
  if (!prev) return null;

  const top = beats.filter(b => b.kind === "beat").slice(0, 3);
  const cons = beats.filter(b => b.kind === "consequence").slice(0, 2);
  const loose = beats.filter(b => b.kind === "loose_end");
  const fallback = !top.length && prev.summary ? stripMentions(prev.summary).slice(0, 280) : "";

  return (
    <section className="rounded-lg border border-primary/30 bg-surface-1 p-4 space-y-3">
      <h3 className="font-display text-sm tracking-widest uppercase text-primary flex items-center gap-2">
        <History className="h-4 w-4" /> Previously on…
      </h3>
      <p className="text-sm">
        <Link to={`/sessions/${prev.id}`} className="font-display hover:text-primary">{prev.title}</Link>
        <span className="text-muted-foreground"> · {new Date(prev.date_played).toLocaleDateString()}</span>
      </p>
      {top.length > 0 && (
        <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
          {top.map(b => <li key={b.id}><MentionText text={b.body} /></li>)}
          {cons.map(b => <li key={b.id} className="text-foreground"><MentionText text={b.body} /></li>)}
        </ul>
      )}
      {fallback && <p className="text-sm italic text-muted-foreground">{fallback}{prev.summary!.length > 280 ? "…" : ""}</p>}
      {loose.length > 0 && (
        <div className="text-sm">
          <p className="text-xs text-muted-foreground mb-1">Unresolved loose ends</p>
          <ul className="space-y-1 list-disc pl-5">{loose.map(b => <li key={b.id}><MentionText text={b.body} /></li>)}</ul>
        </div>
      )}
      {!top.length && !fallback && !loose.length && <p className="text-sm text-muted-foreground">No beats were recorded for that session.</p>}
    </section>
  );
}
