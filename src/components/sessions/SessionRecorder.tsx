import { useState, KeyboardEvent } from 'react';
import { ArrowDown, ArrowUp, Check, ListChecks, Pencil, Plus, ScrollText, Sparkles, Trash2, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MentionInput } from '@/components/mentions/MentionInput';
import { MentionText } from '@/components/mentions/MentionText';
import { useSessionBeats, BeatKind, SessionBeat } from '@/hooks/useSessionBeats';
import { useSessions, Session } from '@/hooks/useSessions';
import { useCharacters } from '@/hooks/useCharacters';
import { useSessionCharacters } from '@/hooks/useSessionCharacters';
import { notify } from '@/lib/notify';
import { cn } from '@/lib/utils';

const LANES: { kind: BeatKind; label: string; hint: string; icon: typeof Zap }[] = [
  { kind: 'beat', label: 'Beats', hint: 'What happened? Enter to add, Shift+Enter for a new line, @ to mention.', icon: Zap },
  { kind: 'consequence', label: 'Consequences', hint: 'What changed? Deaths, boons, betrayals, moves.', icon: Sparkles },
  { kind: 'loose_end', label: 'Loose Ends', hint: 'Open threads to pick up later.', icon: ListChecks },
];

function Lane({ kind, label, hint, icon: Icon, beats, api }: {
  kind: BeatKind; label: string; hint: string; icon: typeof Zap;
  beats: SessionBeat[]; api: ReturnType<typeof useSessionBeats>;
}) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const commit = async () => {
    const body = draft.trim();
    if (!body) return;
    await api.addBeat(kind, body);
    setDraft('');
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.defaultPrevented) { e.preventDefault(); commit(); }
  };
  const move = (i: number, d: number) => {
    const ids = beats.map(b => b.id);
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    api.reorderBeats(ids);
  };

  return (
    <div className="rounded-lg border bg-surface-1 p-4 space-y-3">
      <h4 className="font-display text-sm tracking-wide flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" /> {label}
        <span className="text-xs text-muted-foreground font-sans">({beats.length})</span>
      </h4>
      {beats.length > 0 && (
        <ol className="space-y-2">
          {beats.map((b, i) => (
            <li key={b.id} className="group flex gap-2 items-start text-sm">
              <span className="text-muted-foreground w-5 shrink-0 text-right">{i + 1}.</span>
              {editing === b.id ? (
                <div className="flex-1 space-y-2">
                  <Textarea value={editText} onChange={e => setEditText(e.target.value)} className="min-h-[60px]" autoFocus />
                  <div className="flex gap-1">
                    <Button size="sm" onClick={async () => { await api.updateBeat(b.id, editText.trim() || b.body); setEditing(null); }}><Check className="h-3 w-3" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="h-3 w-3" /></Button>
                  </div>
                </div>
              ) : (
                <>
                  <MentionText text={b.body} className="flex-1 whitespace-pre-wrap" />
                  <div className="flex opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Move up" onClick={() => move(i, -1)}><ArrowUp className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Move down" onClick={() => move(i, 1)}><ArrowDown className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Edit" onClick={() => { setEditing(b.id); setEditText(b.body); }}><Pencil className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" aria-label="Delete" onClick={() => api.deleteBeat(b.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
      <div className="flex gap-2 items-start" onKeyDown={onKey}>
        <div className="flex-1">
          <MentionInput value={draft} onChange={setDraft} placeholder={hint} className="min-h-[44px] text-sm" maxLength={1000} />
        </div>
        <Button size="icon" variant="outline" aria-label={`Add to ${label}`} onClick={commit} disabled={!draft.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function SessionRecorder({ session, columns = false, onSummaryCompose }: {
  session: Session;
  columns?: boolean;
  onSummaryCompose?: (summary: string) => void;
}) {
  const api = useSessionBeats(session.id, session.chronicle_id);
  const { updateSession } = useSessions();
  const { characters } = useCharacters();
  const { characterIds, setSessionCharacters } = useSessionCharacters(session.id);

  const toggle = (id: string) => {
    const next = characterIds.includes(id) ? characterIds.filter(c => c !== id) : [...characterIds, id];
    setSessionCharacters(session.id, next).catch(e => notify.error('Could not update attendance', e.message));
  };

  const composeSummary = async () => {
    const lines = api.beats.filter(b => b.kind === 'beat').map(b => `• ${b.body}`);
    const cons = api.beats.filter(b => b.kind === 'consequence').map(b => `• ${b.body}`);
    if (!lines.length && !cons.length) return;
    const text = [lines.join('\n'), cons.length ? `Consequences:\n${cons.join('\n')}` : ''].filter(Boolean).join('\n\n');
    if (session.summary && !window.confirm('Replace the current summary with the recorded beats?')) return;
    if (onSummaryCompose) {
      onSummaryCompose(text);
      return;
    }
    await updateSession(session.id, { summary: text });
  };

  const pcs = characters.filter(c => c.type === 'PC' || characterIds.includes(c.id));
  const looseCount = api.beats.filter(b => b.kind === 'loose_end').length;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg flex items-center gap-2"><ScrollText className="h-5 w-5 text-primary" /> Session Recorder</h3>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={composeSummary}>Write summary from beats</Button>
          <Button size="sm" variant="outline" disabled={!looseCount || api.promoting} onClick={() => api.promoteLooseEnds(session.title)}>
            <ListChecks className="h-4 w-4 mr-1" /> Carry loose ends forward
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Attendance — tap to toggle</p>
        <div className="flex flex-wrap gap-2">
          {pcs.map(c => {
            const on = characterIds.includes(c.id);
            return (
              <button key={c.id} type="button" onClick={() => toggle(c.id)} title={c.name}
                className={cn('flex items-center gap-2 rounded-full border pl-1 pr-3 py-1 text-xs transition-all',
                  on ? 'border-primary bg-primary/15 text-foreground' : 'border-border text-muted-foreground opacity-60 hover:opacity-100')}>
                <span className="h-7 w-7 rounded-full overflow-hidden bg-surface-2 flex items-center justify-center font-display">
                  {c.avatar_url ? <img src={c.avatar_url} alt="" className="h-full w-full object-cover" /> : c.name.charAt(0)}
                </span>
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className={cn('grid gap-4', columns && 'md:grid-cols-3 md:items-start')}>
        {LANES.map(l => (
          <Lane key={l.kind} {...l} beats={api.beats.filter(b => b.kind === l.kind)} api={api} />
        ))}
      </div>
    </section>
  );
}
