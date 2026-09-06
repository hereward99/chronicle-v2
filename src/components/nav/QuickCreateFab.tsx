import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Plus } from "lucide-react";

export function QuickCreateFab() {
  const location = useLocation();
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const check = () => setAvailable(!!document.querySelector('[data-shortcut="new"]'));
    check();
    const t = window.setTimeout(check, 400);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  if (!available) return null;

  const trigger = () => {
    const el = document.querySelector('[data-shortcut="new"]') as HTMLElement | null;
    el?.click();
  };

  return (
    <button
      onClick={trigger}
      aria-label="Create new"
      className="md:hidden fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 h-14 w-14 rounded-full bg-gradient-blood text-primary-foreground shadow-crimson flex items-center justify-center active:scale-95 transition-transform"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
