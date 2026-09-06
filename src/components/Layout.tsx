import { MobileBottomNav } from "./MobileBottomNav";
import { OfflineBanner } from "./OfflineBanner";
import { CommandPalette } from "./CommandPalette";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { NavRail } from "./nav/NavRail";
import { ContextDrawer } from "./nav/ContextDrawer";
import { QuickCreateFab } from "./nav/QuickCreateFab";
import { useChronicles } from "@/hooks/useChronicles";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { recordVisit } from "@/lib/recentVisits";
import { cn } from "@/lib/utils";
import { ChronicleSetupDialog } from "./onboarding/ChronicleSetupDialog";
import { GuidedTour } from "./onboarding/GuidedTour";

interface LayoutProps {
  children: React.ReactNode;
}

const ONBOARDING_KEY = "chronicle-keeper-onboarded";
const RAIL_PINNED_KEY = "chronicle-rail-pinned";
const DRAWER_KEY = "chronicle-context-drawer";

export function Layout({ children }: LayoutProps) {
  const { createChronicle, currentChronicle, chronicles, loading } = useChronicles();
  const hasCreatedChronicle = useRef(false);
  const [showSetup, setShowSetup] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const location = useLocation();

  const [railPinned, setRailPinned] = useState(() => {
    try {
      return localStorage.getItem(RAIL_PINNED_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [drawerOpen, setDrawerOpen] = useState(() => {
    try {
      return localStorage.getItem(DRAWER_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleRail = () => {
    setRailPinned((v) => {
      try {
        localStorage.setItem(RAIL_PINNED_KEY, String(!v));
      } catch {
        /* ignore */
      }
      return !v;
    });
  };

  const toggleDrawer = () => {
    setDrawerOpen((v) => {
      try {
        localStorage.setItem(DRAWER_KEY, String(!v));
      } catch {
        /* ignore */
      }
      return !v;
    });
  };

  // Track recently visited pages for the context panel
  useEffect(() => {
    const t = window.setTimeout(() => {
      const heading = document.querySelector("h1")?.textContent?.trim();
      if (heading) recordVisit(location.pathname + location.search, heading);
    }, 500);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.search]);

  useEffect(() => {
    // Show setup dialog if user has no chronicles and hasn't been onboarded
    if (!loading && !currentChronicle && chronicles.length === 0 && !hasCreatedChronicle.current) {
      const wasOnboarded = localStorage.getItem(ONBOARDING_KEY);
      if (!wasOnboarded) {
        setShowSetup(true);
      } else {
        // Returning user who deleted chronicles — silently create default
        hasCreatedChronicle.current = true;
        createChronicle({
          name: "My Chronicle",
          description: "Your Vampire: The Masquerade tabletop roleplaying game chronicle",
          setting: "Modern Nights",
        });
      }
    }
  }, [loading, currentChronicle, chronicles.length]);

  const handleSetupComplete = async (data: { name: string; description: string; setting: string }) => {
    hasCreatedChronicle.current = true;
    setShowSetup(false);
    await createChronicle(data);
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShowTour(true);
  };

  const handleTourClose = () => {
    setShowTour(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <CommandPalette />
      <KeyboardShortcuts />
      <OfflineBanner />
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>

      <NavRail pinned={railPinned} onTogglePinned={toggleRail} />
      <ContextDrawer open={drawerOpen} onToggle={toggleDrawer} />

      <main
        id="main-content"
        role="main"
        className={cn(
          "min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0 transition-[margin] duration-200 ease-out",
          railPinned ? "md:ml-64" : "md:ml-16",
          drawerOpen && "lg:mr-72"
        )}
      >
        <div className="p-4 sm:p-6 md:p-8">{children}</div>
      </main>

      <MobileBottomNav />
      <QuickCreateFab />

      <ChronicleSetupDialog open={showSetup} onComplete={handleSetupComplete} />
      <GuidedTour open={showTour} onClose={handleTourClose} />
    </div>
  );
}
