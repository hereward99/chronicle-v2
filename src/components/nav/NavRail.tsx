import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useChronicles } from "@/hooks/useChronicles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Home,
  Users,
  BookOpen,
  Scroll,
  Sparkles,
  Skull,
  LogOut,
  Network,
  Settings,
  FileDown,
  Clock,
  MapPin,
  Dices,
  Search,
  ChevronsLeft,
  ChevronsRight,
  BookMarked,
  Check,
} from "lucide-react";

type NavItem = { name: string; href: string; icon: typeof Home };

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Chronicle",
    items: [
      { name: "The Table", href: "/", icon: Home },
      { name: "Sessions", href: "/sessions", icon: Scroll },
      { name: "Stories", href: "/stories", icon: BookOpen },
      { name: "Timeline", href: "/timeline", icon: Clock },
    ],
  },
  {
    label: "World",
    items: [
      { name: "Characters", href: "/characters", icon: Users },
      { name: "Relationships", href: "/relationships", icon: Network },
      { name: "Locations", href: "/locations", icon: MapPin },
    ],
  },
  {
    label: "Tools",
    items: [
      { name: "Dice Roller", href: "/dice", icon: Dices },
      { name: "Generator", href: "/generator", icon: Sparkles },
      { name: "Import & Export", href: "/import", icon: FileDown },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

interface NavRailProps {
  pinned: boolean;
  onTogglePinned: () => void;
}

export function NavRail({ pinned, onTogglePinned }: NavRailProps) {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { chronicles, currentChronicle, setCurrentChronicle } = useChronicles();
  const [hovered, setHovered] = useState(false);

  const expanded = pinned || hovered;

  const openSearch = () => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  };

  return (
    <TooltipProvider delayDuration={200}>
      <nav
        aria-label="Main navigation"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "hidden md:flex fixed left-0 top-0 z-40 h-full flex-col bg-surface-1 border-r border-border transition-[width] duration-200 ease-out",
          expanded ? "w-64 shadow-deep" : "w-16"
        )}
      >
        {/* Head — brand + chronicle switcher */}
        <div className="border-b border-border/70">
          <div className={cn("flex items-center gap-3 h-16 px-3", !expanded && "justify-center px-0")}>
            <div className="w-10 h-10 shrink-0 bg-gradient-blood rounded-lg flex items-center justify-center">
              <Skull className="h-5 w-5 text-primary-foreground" />
            </div>
            {expanded && (
              <div className="min-w-0">
                <p className="text-base font-bold text-gold font-gothic leading-tight truncate">Chronicle</p>
                <p className="text-[10px] text-muted-foreground font-label tracking-wider uppercase">Keeper</p>
              </div>
            )}
          </div>

          <div className={cn("px-2 pb-3", !expanded && "px-1.5")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-2 w-full rounded-md border border-border bg-surface-2 px-2 py-2 text-left transition-colors hover:bg-secondary",
                    !expanded && "justify-center px-0"
                  )}
                  aria-label="Switch chronicle"
                >
                  <BookMarked className="h-4 w-4 shrink-0 text-gold" />
                  {expanded && (
                    <span className="flex-1 truncate text-xs text-foreground">
                      {currentChronicle?.name ?? "No chronicle"}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-popover z-50">
                <DropdownMenuLabel className="text-xs uppercase tracking-wider font-label">
                  Chronicles
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {chronicles.length === 0 && (
                  <DropdownMenuItem disabled className="text-xs">No chronicles yet</DropdownMenuItem>
                )}
                {chronicles.map((c) => (
                  <DropdownMenuItem key={c.id} onSelect={() => setCurrentChronicle(c)} className="text-sm">
                    <Check
                      className={cn(
                        "h-3.5 w-3.5 mr-2",
                        currentChronicle?.id === c.id ? "opacity-100 text-gold" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{c.name}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="text-sm">
                  <Link to="/settings">Manage chronicles</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search */}
        <div className={cn("px-2 pt-3", !expanded && "px-1.5")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={openSearch}
                className={cn(
                  "flex items-center w-full gap-2 rounded-md border border-border bg-surface-2 px-2 py-2 text-muted-foreground text-sm hover:text-foreground hover:bg-secondary transition-colors",
                  !expanded && "justify-center px-0"
                )}
                aria-label="Search"
              >
                <Search className="h-4 w-4 shrink-0" />
                {expanded && (
                  <>
                    <span className="flex-1 text-left text-xs">Search…</span>
                    <kbd className="h-5 inline-flex items-center rounded border border-border bg-muted px-1.5 text-[10px]">
                      ⌘K
                    </kbd>
                  </>
                )}
              </button>
            </TooltipTrigger>
            {!expanded && <TooltipContent side="right">Search (⌘K)</TooltipContent>}
          </Tooltip>
          {expanded && (
            <p className="px-1 pt-2 text-[11px] text-muted-foreground/70 text-center">
              Press <kbd className="px-1 rounded border border-border bg-muted text-[10px]">?</kbd> for shortcuts
            </p>
          )}
        </div>

        {/* Groups */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              {expanded ? (
                <p className="px-2 pb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 font-label">
                  {group.label}
                </p>
              ) : (
                <div className="mx-3 mb-2 border-t border-border/60" />
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? location.pathname === "/"
                      : location.pathname === item.href || location.pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.href}
                            className={cn(
                              "relative flex items-center gap-3 rounded-md py-2 transition-colors group",
                              expanded ? "px-2" : "justify-center px-0",
                              isActive
                                ? "bg-secondary text-gold"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                            )}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-primary" />
                            )}
                            <Icon className="h-[18px] w-[18px] shrink-0" />
                            {expanded && (
                              <span className="font-label text-sm tracking-wide truncate">{item.name}</span>
                            )}
                          </Link>
                        </TooltipTrigger>
                        {!expanded && <TooltipContent side="right">{item.name}</TooltipContent>}
                      </Tooltip>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={cn("border-t border-border/70 p-2 space-y-2", !expanded && "px-1.5")}>
          {expanded && (
            <div className="px-2 py-1.5 rounded-md bg-surface-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-label">Signed in as</p>
              <p className="text-xs text-foreground truncate" title={user?.email || "Unknown"}>
                {user?.email || "Unknown"}
              </p>
            </div>
          )}
          <div className={cn("flex items-center gap-1", !expanded && "flex-col")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size={expanded ? "sm" : "icon"}
                  onClick={signOut}
                  className={cn("text-muted-foreground hover:text-foreground", expanded && "flex-1 justify-start")}
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                  {expanded && <span className="ml-2">Sign Out</span>}
                </Button>
              </TooltipTrigger>
              {!expanded && <TooltipContent side="right">Sign out</TooltipContent>}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onTogglePinned}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={pinned ? "Collapse navigation" : "Pin navigation open"}
                >
                  {pinned ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{pinned ? "Collapse" : "Pin open"}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}
