import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  BookOpen,
  Scroll,
  Network,
  Clock,
  MapPin,
  Dices,
  Sparkles,
  FileDown,
  Settings,
  MoreHorizontal,
  X,
} from "lucide-react";

const primaryItems = [
  { name: "Table", href: "/", icon: Home },
  { name: "Sessions", href: "/sessions", icon: Scroll },
  { name: "Stories", href: "/stories", icon: BookOpen },
  { name: "Characters", href: "/characters", icon: Users },
];

const moreItems = [
  { name: "Relationships", href: "/relationships", icon: Network },
  { name: "Timeline", href: "/timeline", icon: Clock },
  { name: "Locations", href: "/locations", icon: MapPin },
  { name: "Dice Roller", href: "/dice", icon: Dices },
  { name: "Generator", href: "/generator", icon: Sparkles },
  { name: "Import & Export", href: "/import", icon: FileDown },
  { name: "Settings", href: "/settings", icon: Settings },
];


export function MobileBottomNav() {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = moreItems.some((item) => location.pathname === item.href);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute bottom-16 left-0 right-0 pb-[env(safe-area-inset-bottom)] bg-card border-t border-border rounded-t-xl shadow-gothic animate-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/50">
              <span className="text-xs font-label uppercase tracking-wider text-muted-foreground">More</span>
              <button onClick={() => setShowMore(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 p-3">
              {moreItems.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg transition-colors",
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]")} />
                    <span className="text-[10px] font-medium leading-none">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav aria-label="Mobile navigation" className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border bg-card/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-2">

          {primaryItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setShowMore(false)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-lg transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]")} />
                <span className="text-[10px] font-medium leading-none">{item.name}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore((v) => !v)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-1.5 rounded-lg transition-colors",
              showMore || isMoreActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MoreHorizontal className={cn("h-5 w-5", (showMore || isMoreActive) && "drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]")} />
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
