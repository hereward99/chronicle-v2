import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickRollButton } from "@/components/dice/QuickRollButton";
import { getRecentVisits, clearRecentVisits, RECENT_VISITS_EVENT, RecentVisit } from "@/lib/recentVisits";
import { PanelRightClose, PanelRightOpen, History, NotebookPen, Dices } from "lucide-react";

const SCRATCH_KEY = "chronicle-scratch-notes";

interface ContextDrawerProps {
  open: boolean;
  onToggle: () => void;
}

export function ContextDrawer({ open, onToggle }: ContextDrawerProps) {
  const [recent, setRecent] = useState<RecentVisit[]>([]);
  const [scratch, setScratch] = useState("");

  useEffect(() => {
    const sync = () => setRecent(getRecentVisits());
    sync();
    window.addEventListener(RECENT_VISITS_EVENT, sync);
    return () => window.removeEventListener(RECENT_VISITS_EVENT, sync);
  }, []);

  useEffect(() => {
    try {
      setScratch(localStorage.getItem(SCRATCH_KEY) ?? "");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const updateScratch = (value: string) => {
    setScratch(value);
    try {
      localStorage.setItem(SCRATCH_KEY, value);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      {/* Toggle handle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        aria-label={open ? "Close side panel" : "Open side panel"}
        className={cn(
          "hidden lg:flex fixed top-4 z-50 text-muted-foreground hover:text-foreground transition-[right] duration-200",
          open ? "right-[19rem]" : "right-3"
        )}
      >
        {open ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
      </Button>

      <aside
        aria-label="Context panel"
        className={cn(
          "hidden lg:flex fixed right-0 top-0 z-40 h-full w-72 flex-col border-l border-border bg-surface-1 transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-border/70">
          <p className="section-title">At the table</p>
        </div>

        <Tabs defaultValue="recent" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-3 mt-3 grid grid-cols-3">
            <TabsTrigger value="recent" aria-label="Recent">
              <History className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="notes" aria-label="Scratch notes">
              <NotebookPen className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="dice" aria-label="Quick dice">
              <Dices className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="flex-1 overflow-y-auto px-3 pb-4 mt-3 space-y-1">
            {recent.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1 py-4">
                Pages you open will show up here for quick return.
              </p>
            ) : (
              <>
                {recent.map((v) => (
                  <Link
                    key={v.path}
                    to={v.path}
                    className="block rounded-md px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors truncate"
                  >
                    {v.label}
                  </Link>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => {
                    clearRecentVisits();
                    setRecent([]);
                  }}
                >
                  Clear
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="notes" className="flex-1 min-h-0 px-3 pb-4 mt-3">
            <Textarea
              value={scratch}
              onChange={(e) => updateScratch(e.target.value)}
              placeholder="Jot down anything mid-session — kept on this device."
              className="h-full min-h-[240px] resize-none bg-surface-2 text-sm"
            />
          </TabsContent>

          <TabsContent value="dice" className="px-3 pb-4 mt-3 space-y-3">
            <div className="rounded-md border border-border bg-surface-2 p-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quick roll</span>
              <QuickRollButton basePool={5} label="Quick roll" />
            </div>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/dice">Full dice roller</Link>
            </Button>
          </TabsContent>
        </Tabs>
      </aside>
    </>
  );
}
