import { supabase } from '@/integrations/supabase/client';
import { stripMentions } from '@/lib/mentions';
import type { Session } from '@/hooks/useSessions';
import type { SessionCoverRecap } from '@/lib/pdfExport';

/** The session played just before the given one. */
export function findPreviousSession(session: Session, sessions: Session[]): Session | undefined {
  return sessions
    .filter(s => s.id !== session.id && s.date_played <= session.date_played)
    .sort((a, b) => b.date_played.localeCompare(a.date_played) || b.created_at.localeCompare(a.created_at))[0];
}

/** Builds the "Previously on…" recap used on the session PDF cover. */
export async function buildSessionCoverRecap(session: Session, sessions: Session[]): Promise<SessionCoverRecap | null> {
  const prev = findPreviousSession(session, sessions);
  if (!prev) return null;
  const { data } = await supabase
    .from('session_beats')
    .select('kind, body')
    .eq('session_id', prev.id)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });
  const beats = (data || []) as { kind: string; body: string }[];
  const top = beats.filter(b => b.kind === 'beat').slice(0, 3).map(b => b.body);
  const cons = beats.filter(b => b.kind === 'consequence').slice(0, 2).map(b => b.body);
  const items = top.length ? [...top, ...cons] : [];
  const fallback = !top.length && prev.summary ? stripMentions(prev.summary).slice(0, 280) + (prev.summary.length > 280 ? '…' : '') : '';
  return {
    sourceTitle: prev.title,
    sourceDate: prev.date_played,
    items,
    looseEnds: beats.filter(b => b.kind === 'loose_end').map(b => b.body),
    fallback,
  };
}
