import { useCallback, useRef, useState } from "react";

/** Multi-select state with shift-click range support over an ordered id list. */
export function useSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lastRef = useRef<string | null>(null);

  const toggle = useCallback((id: string, orderedIds: string[], shift = false) => {
    setSelected(prev => {
      const next = new Set(prev);
      const last = lastRef.current;
      if (shift && last && last !== id) {
        const a = orderedIds.indexOf(last);
        const b = orderedIds.indexOf(id);
        if (a >= 0 && b >= 0) {
          const [s, e] = a < b ? [a, b] : [b, a];
          const add = !prev.has(id);
          for (let i = s; i <= e; i++) add ? next.add(orderedIds[i]) : next.delete(orderedIds[i]);
          lastRef.current = id;
          return next;
        }
      }
      next.has(id) ? next.delete(id) : next.add(id);
      lastRef.current = id;
      return next;
    });
  }, []);

  const setAll = useCallback((ids: string[]) => setSelected(new Set(ids)), []);
  const clear = useCallback(() => { setSelected(new Set()); lastRef.current = null; }, []);

  return { selected, toggle, setAll, clear, count: selected.size };
}
