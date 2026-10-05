import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { notify } from '@/lib/notify';

export type BeatKind = 'beat' | 'consequence' | 'loose_end';

export interface SessionBeat {
  id: string;
  session_id: string;
  chronicle_id: string;
  user_id: string;
  kind: BeatKind;
  body: string;
  order_index: number;
  created_at: string;
}

export const LOOSE_ENDS_CHECKLIST_TITLE = 'Loose Ends';

export function useSessionBeats(sessionId?: string, chronicleId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['session_beats', sessionId];

  const { data: beats = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('session_beats')
        .select('*')
        .eq('session_id', sessionId!)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as SessionBeat[];
    },
    enabled: !!sessionId,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });
  const onError = (e: Error) => notify.error('Could not save', e.message);

  const add = useMutation({
    mutationFn: async ({ kind, body }: { kind: BeatKind; body: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !sessionId || !chronicleId) throw new Error('Not signed in');
      const maxOrder = beats.filter(b => b.kind === kind).reduce((m, b) => Math.max(m, b.order_index), -1);
      const { error } = await supabase.from('session_beats').insert({
        session_id: sessionId, chronicle_id: chronicleId, user_id: user.id,
        kind, body, order_index: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: invalidate, onError,
  });

  const update = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: string }) => {
      const { error } = await supabase.from('session_beats').update({ body }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate, onError,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('session_beats').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate, onError,
  });

  const reorder = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(orderedIds.map((id, i) =>
        supabase.from('session_beats').update({ order_index: i }).eq('id', id)
      ));
    },
    onSuccess: invalidate, onError,
  });

  /** Adds each loose end to the chronicle's dedicated "Loose Ends" checklist (created if missing), skipping duplicates. */
  const promoteLooseEnds = useMutation({
    mutationFn: async (sessionTitle: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !chronicleId) throw new Error('Not signed in');
      const loose = beats.filter(b => b.kind === 'loose_end');
      if (!loose.length) return 0;

      let { data: list } = await supabase.from('session_checklists').select('id')
        .eq('chronicle_id', chronicleId).eq('title', LOOSE_ENDS_CHECKLIST_TITLE).maybeSingle();
      if (!list) {
        const { data, error } = await supabase.from('session_checklists').insert({
          chronicle_id: chronicleId, user_id: user.id, title: LOOSE_ENDS_CHECKLIST_TITLE,
          notes: 'Open threads carried forward from session recordings.',
        }).select('id').single();
        if (error) throw error;
        list = data;
      }
      const { data: existing } = await supabase.from('checklist_items')
        .select('text, sort_order').eq('checklist_id', list.id);
      const texts = new Set((existing || []).map(i => i.text));
      let order = (existing || []).reduce((m, i) => Math.max(m, i.sort_order), -1);
      const rows = loose
        .map(b => `${b.body} (from ${sessionTitle})`)
        .filter(t => !texts.has(t))
        .map(text => ({ checklist_id: list!.id, text, sort_order: ++order, is_completed: false }));
      if (rows.length) {
        const { error } = await supabase.from('checklist_items').insert(rows);
        if (error) throw error;
      }
      return rows.length;
    },
    onSuccess: (n) => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      notify.success('Loose ends carried forward', n ? `${n} added to the "${LOOSE_ENDS_CHECKLIST_TITLE}" checklist.` : 'Already on the checklist.');
    },
    onError,
  });

  return {
    beats,
    isLoading,
    addBeat: (kind: BeatKind, body: string) => add.mutateAsync({ kind, body }),
    updateBeat: (id: string, body: string) => update.mutateAsync({ id, body }),
    deleteBeat: (id: string) => remove.mutateAsync(id),
    reorderBeats: (ids: string[]) => reorder.mutateAsync(ids),
    promoteLooseEnds: (title: string) => promoteLooseEnds.mutateAsync(title),
    promoting: promoteLooseEnds.isPending,
  };
}
