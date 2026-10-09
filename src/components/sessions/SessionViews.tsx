import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, BookOpen, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChronicleDate } from "@/components/ChronicleDate";
import { stripMentions } from "@/lib/mentions";
import type { Session } from "@/hooks/useSessions";

type StoryLookup = (plotId: string | null) => string;

const excerpt = (text: string | null, n = 220) => {
  if (!text) return "";
  const plain = stripMentions(text).replace(/\s+/g, " ").trim();
  return plain.length > n ? plain.slice(0, n).trimEnd() + "…" : plain;
};

export function SessionStatsStrip({ sessions }: { sessions: Session[] }) {
  const xp = sessions.reduce((s, x) => s + (x.experience_awarded || 0), 0);
  const stories = new Set(sessions.map(s => s.plot_id).filter(Boolean)).size;
  const dates = sessions.map(s => s.date_played).filter(Boolean).sort();
  const items = [
    { label: "Sessions played", value: sessions.length },
    { label: "XP awarded", value: xp },
    { label: "Stories", value: stories },
    { label: "Since", value: dates[0] ? new Date(dates[0]).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "—" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(i => (
        <div key={i.label} className="rounded-lg border bg-surface-1 p-3">
          <div className="font-display text-xl text-foreground">{i.value}</div>
          <div className="text-xs text-muted-foreground">{i.label}</div>
        </div>
      ))}
    </div>
  );
}

export function SessionJournal({ sessions, storyName }: { sessions: Session[]; storyName: StoryLookup }) {
  const groups = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.date_played.localeCompare(a.date_played));
    const out: { key: string; plotId: string | null; items: Session[] }[] = [];
    for (const s of sorted) {
      const last = out[out.length - 1];
      if (last && last.plotId === s.plot_id) last.items.push(s);
      else out.push({ key: `${s.plot_id ?? "none"}-${s.id}`, plotId: s.plot_id, items: [s] });
    }
    return out;
  }, [sessions]);

  return (
    <div className="relative pl-6 sm:pl-8">
      <div className="absolute left-2 sm:left-3 top-0 bottom-0 w-px bg-border" aria-hidden />
      {groups.map(g => (
        <div key={g.key} className="space-y-4 pb-6">
          <div className="relative -ml-6 sm:-ml-8 flex items-center gap-2">
            <span className="h-5 w-5 sm:h-7 sm:w-7 rounded-full bg-surface-2 border flex items-center justify-center">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
            </span>
            {g.plotId ? (
              <Link to={`/stories/${g.plotId}`} className="font-display tracking-wide text-sm text-primary hover:underline">{storyName(g.plotId)}</Link>
            ) : (
              <span className="font-display tracking-wide text-sm text-muted-foreground">No story</span>
            )}
          </div>
          {g.items.map(s => {
            const imgs = (s.attachments || []).filter(a => a.type?.startsWith("image/"));
            return (
              <article key={s.id} className="relative rounded-lg border bg-surface-1 p-4 hover:border-primary/50 transition-colors">
                <span className="absolute -left-[1.4rem] sm:-left-[1.65rem] top-5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" aria-hidden />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link to={`/sessions/${s.id}`} className="font-display text-lg text-foreground hover:text-primary">{s.title}</Link>
                  {!!s.experience_awarded && <Badge variant="secondary" className="text-xs">{s.experience_awarded} XP</Badge>}
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-1">
                  <ChronicleDate value={s.date_played} variant="long" />
                  <ChronicleDate inGameStart={s.in_game_date_start} inGameEnd={s.in_game_date_end} prefix="Set in" />
                </div>
                {s.summary && <p className="mt-3 text-sm text-muted-foreground italic font-serif">{excerpt(s.summary)}</p>}
                {imgs.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {imgs.slice(0, 4).map((img, i) => (
                      <img key={i} src={img.url} alt={img.name} className="h-16 w-24 object-cover rounded border" />
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ))}
    </div>
  );
}

type SortKey = "date" | "title" | "story" | "xp";

export function SessionLog({ sessions, storyName }: { sessions: Session[]; storyName: StoryLookup }) {
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: "date", asc: false });
  const rows = useMemo(() => {
    const val = (s: Session): string | number =>
      sort.key === "date" ? s.date_played : sort.key === "title" ? s.title.toLowerCase()
      : sort.key === "story" ? storyName(s.plot_id).toLowerCase() : s.experience_awarded || 0;
    return [...sessions].sort((a, b) => {
      const x = val(a), y = val(b);
      const c = x < y ? -1 : x > y ? 1 : 0;
      return sort.asc ? c : -c;
    });
  }, [sessions, sort, storyName]);

  const Th = ({ k, label, className = "" }: { k: SortKey; label: string; className?: string }) => (
    <th className={`p-2 text-left font-medium ${className}`}>
      <button type="button" className="inline-flex items-center gap-1 hover:text-foreground"
        onClick={() => setSort(p => ({ key: k, asc: p.key === k ? !p.asc : k !== "date" }))}>
        {label}
        {sort.key === k && (sort.asc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );

  return (
    <div className="rounded-lg border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface-2 text-muted-foreground">
          <tr><Th k="date" label="Date" /><Th k="title" label="Title" /><Th k="story" label="Story" className="hidden sm:table-cell" /><Th k="xp" label="XP" className="text-right" /></tr>
        </thead>
        <tbody>
          {rows.map(s => (
            <tr key={s.id} className="border-t hover:bg-surface-1">
              <td className="p-2 whitespace-nowrap text-muted-foreground"><Calendar className="inline h-3 w-3 mr-1" />{new Date(s.date_played).toLocaleDateString()}</td>
              <td className="p-2"><Link to={`/sessions/${s.id}`} className="hover:text-primary hover:underline">{s.title}</Link></td>
              <td className="p-2 hidden sm:table-cell text-muted-foreground">{s.plot_id ? storyName(s.plot_id) : "—"}</td>
              <td className="p-2 text-right">{s.experience_awarded || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
