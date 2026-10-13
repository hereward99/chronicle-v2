import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/onboarding/EmptyState";
import { CharacterCardSkeleton } from "@/components/skeletons/CardSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { EntityCard, EntityCardContent, EntityCardHeaderBar, CardIconAction } from "@/components/ui/entity-card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Search, Users, Wand2, X, ChevronDown, UsersRound, Flag, Edit, UserPlus, Filter } from "lucide-react";
import { BulkNPCDialog } from "@/components/dialogs/BulkNPCDialog";
import { useCharacters, Character } from "@/hooks/useCharacters";
import { useFactions, Faction } from "@/hooks/useFactions";
import { useChronicles } from "@/hooks/useChronicles";
import { useCoteries } from "@/hooks/useCoteries";
import { usePlots } from "@/hooks/usePlots";
import { usePlotCharacters } from "@/hooks/usePlotCharacters";
import { CreateCharacterDialog } from "@/components/dialogs/CreateCharacterDialog";
import { ViewCharacterDialog } from "@/components/dialogs/ViewCharacterDialog";
import { EditCharacterDialog } from "@/components/dialogs/EditCharacterDialog";
import { CharacterWizard } from "@/components/character/CharacterWizard";
import { CharacterCard } from "@/components/characters/CharacterCard";
import { CoterieCard } from "@/components/characters/CoterieCard";
import { CreateCoterieDialog } from "@/components/dialogs/CreateCoterieDialog";
import { ManageCoterieDialog } from "@/components/dialogs/ManageCoterieDialog";
import { CreateFactionDialog } from "@/components/dialogs/CreateFactionDialog";
import { EditFactionDialog } from "@/components/dialogs/EditFactionDialog";
import { ManageFactionMembersDialog } from "@/components/dialogs/ManageFactionMembersDialog";
import { useSearchHighlight } from "@/hooks/useSearchHighlight";
import { useRestorableState, useScrollRestore } from "@/hooks/useRestorableState";
import type { Coterie } from "@/hooks/useCoteries";
import { useSessions } from "@/hooks/useSessions";
import { useSelection } from "@/hooks/useSelection";
import { BulkActionBar } from "@/components/characters/BulkActionBar";
import { CharacterTable } from "@/components/characters/CharacterTable";
import { Checkbox } from "@/components/ui/checkbox";
import { LayoutGrid, Rows3, CheckSquare } from "lucide-react";

const STORAGE_KEY = "characters-toolbar-state";

interface ToolbarState {
  filterType: string;
  filterClan: string;
  filterStatus: string;
  filterCoterie: string;
  filterFaction: string;
  filterStory: string;
  filterSire: string;
  groupBy: string;
  sortBy: string;
}

const defaultState: ToolbarState = {
  filterType: "__all__",
  filterClan: "__all__",
  filterStatus: "__all__",
  filterCoterie: "__all__",
  filterFaction: "__all__",
  filterStory: "__all__",
  filterSire: "__all__",
  groupBy: "__none__",
  sortBy: "name-asc",
};

function loadToolbarState(): ToolbarState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultState, ...JSON.parse(stored) };
  } catch {}
  return defaultState;
}

function saveToolbarState(state: ToolbarState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export default function Characters() {
  useScrollRestore("/characters");
  const [searchTerm, setSearchTerm] = useRestorableState("characters:search", "");
  const [viewCharacter, setViewCharacter] = useState<Character | null>(null);
  const [editCharacter, setEditCharacter] = useState<Character | null>(null);
  const navigate = useNavigate();
  const goToCharacter = useCallback((c: Character) => navigate(`/characters/${c.id}`), [navigate]);
  const goToCoterie = useCallback((c: Coterie) => navigate(`/coteries/${c.id}`), [navigate]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [toolbar, setToolbar] = useState<ToolbarState>(loadToolbarState);
  const [activeTab, setActiveTab] = useRestorableState("characters:tab", "characters");
  const [showCreateCoterie, setShowCreateCoterie] = useState(false);
  const [selectedCoterie, setSelectedCoterie] = useState<Coterie | null>(null);
  const [showBulkNPCDialog, setShowBulkNPCDialog] = useState(false);
  const [createFactionDialogOpen, setCreateFactionDialogOpen] = useState(false);
  const [editFactionDialogOpen, setEditFactionDialogOpen] = useState(false);
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);
  const [manageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { characters, loading, updateCharacter, deleteCharacter } = useCharacters();
  const { currentChronicle } = useChronicles();
  const {
    factions,
    characterFactions,
    createFaction,
    updateFaction,
    deleteFaction,
    addCharacterToFaction,
    removeCharacterFromFaction,
  } = useFactions(currentChronicle?.id);
  const { coteries, allCoterieMembers, loading: coteriesLoading, setPrimaryCoterie } = useCoteries();
  const { plots } = usePlots();
  const { plotCharacters } = usePlotCharacters();
  const { highlightId, searchQuery: highlightQuery } = useSearchHighlight();
  const { sessions } = useSessions();
  const selection = useSelection();
  const [viewMode, setViewMode] = useRestorableState<"grid" | "table">("characters:view", "grid");
  const [selectMode, setSelectMode] = useState(false);

  // Auto-switch tab when highlighting a coterie or faction
  useEffect(() => {
    if (!highlightId) return;
    if (coteries.some(c => c.id === highlightId)) {
      setActiveTab("coteries");
    } else if (factions.some(f => f.id === highlightId)) {
      setActiveTab("factions");
    }
  }, [highlightId, coteries, factions]);

  useEffect(() => { saveToolbarState(toolbar); }, [toolbar]);

  const setFilter = useCallback((key: keyof ToolbarState, value: string) => {
    setToolbar(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setToolbar(defaultState);
    setSearchTerm("");
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.keys(defaultState).some(
      k => toolbar[k as keyof ToolbarState] !== defaultState[k as keyof ToolbarState]
    ) || searchTerm !== "";
  }, [toolbar, searchTerm]);

  // Build lookup maps
  const characterFactionMap = useMemo(() => {
    const map = new Map<string, string[]>();
    characterFactions.forEach(cf => {
      const arr = map.get(cf.character_id) || [];
      arr.push(cf.faction_id);
      map.set(cf.character_id, arr);
    });
    return map;
  }, [characterFactions]);

  const characterCoterieMap = useMemo(() => {
    const map = new Map<string, string[]>();
    allCoterieMembers.forEach(cm => {
      const arr = map.get(cm.character_id) || [];
      arr.push(cm.coterie_id);
      map.set(cm.character_id, arr);
    });
    return map;
  }, [allCoterieMembers]);

  const characterPlotMap = useMemo(() => {
    const map = new Map<string, string[]>();
    plotCharacters.forEach(pc => {
      const arr = map.get(pc.character_id) || [];
      arr.push(pc.plot_id);
      map.set(pc.character_id, arr);
    });
    return map;
  }, [plotCharacters]);

  // Coterie members lookup
  const coterieMembersMap = useMemo(() => {
    const map = new Map<string, Character[]>();
    coteries.forEach(c => {
      const memberCharIds = allCoterieMembers
        .filter(cm => cm.coterie_id === c.id)
        .map(cm => cm.character_id);
      map.set(c.id, characters.filter(ch => memberCharIds.includes(ch.id)));
    });
    return map;
  }, [coteries, allCoterieMembers, characters]);

  // Dynamic filter options
  const filterOptions = useMemo(() => {
    const clans = [...new Set(characters.map(c => c.clan))].sort();
    const statuses = [...new Set(characters.map(c => c.status))].sort();
    const sires = [...new Set(characters.map(c => c.sire).filter(Boolean))].sort() as string[];
    return { clans, statuses, sires };
  }, [characters]);

  // Filter
  const filteredCharacters = useMemo(() => {
    return characters.filter(c => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.clan.toLowerCase().includes(q)) return false;
      }
      if (toolbar.filterType !== "__all__" && c.type !== toolbar.filterType) return false;
      if (toolbar.filterClan !== "__all__" && c.clan !== toolbar.filterClan) return false;
      if (toolbar.filterStatus !== "__all__" && c.status !== toolbar.filterStatus) return false;
      if (toolbar.filterSire !== "__all__" && c.sire !== toolbar.filterSire) return false;
      if (toolbar.filterCoterie !== "__all__") {
        const memberOfCoteries = characterCoterieMap.get(c.id) || [];
        if (!memberOfCoteries.includes(toolbar.filterCoterie)) return false;
      }
      if (toolbar.filterFaction !== "__all__") {
        const memberOfFactions = characterFactionMap.get(c.id) || [];
        if (!memberOfFactions.includes(toolbar.filterFaction)) return false;
      }
      if (toolbar.filterStory !== "__all__") {
        const inPlots = characterPlotMap.get(c.id) || [];
        if (!inPlots.includes(toolbar.filterStory)) return false;
      }
      return true;
    });
  }, [characters, searchTerm, toolbar, characterCoterieMap, characterFactionMap, characterPlotMap]);

  // Sort
  const sortedCharacters = useMemo(() => {
    const sorted = [...filteredCharacters];
    switch (toolbar.sortBy) {
      case "name-asc": sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "name-desc": sorted.sort((a, b) => b.name.localeCompare(a.name)); break;
      case "clan": sorted.sort((a, b) => a.clan.localeCompare(b.clan) || a.name.localeCompare(b.name)); break;
      case "status": sorted.sort((a, b) => a.status.localeCompare(b.status) || a.name.localeCompare(b.name)); break;
      case "updated": sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()); break;
      case "generation": sorted.sort((a, b) => (a.generation ?? 99) - (b.generation ?? 99) || a.name.localeCompare(b.name)); break;
    }
    return sorted;
  }, [filteredCharacters, toolbar.sortBy]);

  // Group
  const groupedCharacters = useMemo(() => {
    if (toolbar.groupBy === "__none__") return null;

    const groups = new Map<string, Character[]>();
    const getKeys = (c: Character): string[] => {
      switch (toolbar.groupBy) {
        case "clan": return [c.clan];
        case "status": return [c.status];
        case "type": return [c.type];
        case "coterie": {
          const coterieIds = characterCoterieMap.get(c.id) || [];
          if (coterieIds.length === 0) return ["No Coterie"];
          return coterieIds.map(id => coteries.find(ct => ct.id === id)?.name || "Unknown Coterie");
        }
        case "faction": {
          const factionIds = characterFactionMap.get(c.id) || [];
          if (factionIds.length === 0) return ["No Faction"];
          return factionIds.map(id => factions.find(f => f.id === id)?.name || "Unknown Faction");
        }
        case "sire": return [c.sire || "Unknown Sire"];
        case "generation": {
          if (c.clan === "Human" || c.clan === "Ghoul") return ["Mortal"];
          return [c.generation ? `${c.generation}th Generation` : "Unknown Generation"];
        }
        default: return ["Other"];
      }
    };

    sortedCharacters.forEach(c => {
      const keys = getKeys(c);
      keys.forEach(key => {
        const arr = groups.get(key) || [];
        arr.push(c);
        groups.set(key, arr);
      });
    });

    return new Map([...groups.entries()].sort(([a], [b]) => a.localeCompare(b)));
  }, [sortedCharacters, toolbar.groupBy, characterCoterieMap, coteries, characterFactionMap, factions]);

  const coterieNameFor = (id: string) =>
    (characterCoterieMap.get(id) || []).map(cid => coteries.find(c => c.id === cid)?.name).filter(Boolean).join(", ");
  const factionNameFor = (id: string) =>
    (characterFactionMap.get(id) || []).map(fid => factions.find(f => f.id === fid)?.name).filter(Boolean).join(", ");

  const renderCard = (character: Character) => {
    const card = <CharacterCard key={character.id} character={character} highlightQuery={highlightQuery} onView={goToCharacter} onEdit={setEditCharacter} />;
    if (!selectMode) return card;
    const checked = selection.selected.has(character.id);
    return (
      <div
        key={character.id}
        className={`relative rounded-lg cursor-pointer ${checked ? "ring-2 ring-primary" : ""}`}
        onClickCapture={e => { e.preventDefault(); e.stopPropagation(); selection.toggle(character.id, sortedCharacters.map(c => c.id), e.shiftKey); }}
      >
        <div className="absolute top-2 right-2 z-10 rounded bg-surface-2 p-1"><Checkbox checked={checked} aria-label={`Select ${character.name}`} /></div>
        {card}
      </div>
    );
  };

  const statusOptions = [...new Set(["Active", "Inactive", "Missing", "Torpor", "Dead", "Destroyed", ...filterOptions.statuses])];
  const bulkSetStatus = async (ids: string[], status: string) => {
    for (const id of ids) await updateCharacter(id, { status });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-foreground break-words">Characters & Groups</h1>
          <p className="text-muted-foreground">Manage your chronicle's characters, coteries, and factions</p>
        </div>
      </div>


      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="characters">Characters</TabsTrigger>
          <TabsTrigger value="coteries">Coteries</TabsTrigger>
          <TabsTrigger value="factions">Factions</TabsTrigger>
        </TabsList>

        {/* ===== Characters Tab ===== */}
        <TabsContent value="characters" className="space-y-6">
          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => setWizardOpen(true)} className="border-primary/50 hover:bg-primary/10">
              <Wand2 className="w-4 h-4 mr-2" /> Wizard
            </Button>
            <CreateCharacterDialog>
              <Button data-shortcut="new" className="bg-gradient-blood hover:opacity-90 shadow-crimson">
                <Plus className="w-4 h-4 mr-2" /> Quick Create
              </Button>
            </CreateCharacterDialog>
            <Button onClick={() => setShowBulkNPCDialog(true)} className="bg-destructive/30 hover:bg-destructive/50 border border-destructive/50 text-foreground">
              <UsersRound className="w-4 h-4 mr-2" /> Generate Group
            </Button>
          </div>


          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search characters..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-input border-border" />
          </div>

          {/* Filter / Group / Sort Toolbar */}
          <div className="flex flex-col sm:hidden gap-2">
            <Collapsible open={showMobileFilters} onOpenChange={setShowMobileFilters}>
              <div className="flex items-center gap-2">
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="h-4 w-4 mr-1" />
                    Filters
                    {hasActiveFilters && <span className="ml-1.5 w-2 h-2 rounded-full bg-primary" />}
                  </Button>
                </CollapsibleTrigger>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                )}
              </div>
              <CollapsibleContent className="mt-2">
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-gradient-subtle border border-border">
                  <Select value={toolbar.filterType} onValueChange={v => setFilter("filterType", v)}>
                    <SelectTrigger className="w-[120px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Types</SelectItem>
                      <SelectItem value="PC">PC</SelectItem>
                      <SelectItem value="NPC">NPC</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={toolbar.filterClan} onValueChange={v => setFilter("filterClan", v)}>
                    <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Clan" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Clans</SelectItem>
                      {filterOptions.clans.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={toolbar.filterStatus} onValueChange={v => setFilter("filterStatus", v)}>
                    <SelectTrigger className="w-[130px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Statuses</SelectItem>
                      {filterOptions.statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  {coteries.length > 0 && (
                    <Select value={toolbar.filterCoterie} onValueChange={v => setFilter("filterCoterie", v)}>
                      <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Coterie" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Coteries</SelectItem>
                        {coteries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}

                  {factions.length > 0 && (
                    <Select value={toolbar.filterFaction} onValueChange={v => setFilter("filterFaction", v)}>
                      <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Faction" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Factions</SelectItem>
                        {factions.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}

                  {plots.length > 0 && (
                    <Select value={toolbar.filterStory} onValueChange={v => setFilter("filterStory", v)}>
                      <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Story" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Stories</SelectItem>
                        {plots.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}

                  {filterOptions.sires.length > 0 && (
                    <Select value={toolbar.filterSire} onValueChange={v => setFilter("filterSire", v)}>
                      <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Sire" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Sires</SelectItem>
                        {filterOptions.sires.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}

                  <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

                  <Select value={toolbar.groupBy} onValueChange={v => setFilter("groupBy", v)}>
                    <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Group by" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No Grouping</SelectItem>
                      <SelectItem value="clan">Group by Clan</SelectItem>
                      <SelectItem value="status">Group by Status</SelectItem>
                      <SelectItem value="type">Group by Type</SelectItem>
                      <SelectItem value="coterie">Group by Coterie</SelectItem>
                      <SelectItem value="faction">Group by Faction</SelectItem>
                      <SelectItem value="sire">Group by Sire</SelectItem>
                      <SelectItem value="generation">Group by Generation</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={toolbar.sortBy} onValueChange={v => setFilter("sortBy", v)}>
                    <SelectTrigger className="w-[150px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Sort by" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name (A–Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z–A)</SelectItem>
                      <SelectItem value="clan">Clan</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="updated">Recently Updated</SelectItem>
                      <SelectItem value="generation">Generation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="hidden sm:flex flex-wrap items-center gap-2">
            <Select value={toolbar.filterType} onValueChange={v => setFilter("filterType", v)}>
              <SelectTrigger className="w-[120px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                <SelectItem value="PC">PC</SelectItem>
                <SelectItem value="NPC">NPC</SelectItem>
              </SelectContent>
            </Select>

            <Select value={toolbar.filterClan} onValueChange={v => setFilter("filterClan", v)}>
              <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Clan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Clans</SelectItem>
                {filterOptions.clans.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={toolbar.filterStatus} onValueChange={v => setFilter("filterStatus", v)}>
              <SelectTrigger className="w-[130px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Statuses</SelectItem>
                {filterOptions.statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            {coteries.length > 0 && (
              <Select value={toolbar.filterCoterie} onValueChange={v => setFilter("filterCoterie", v)}>
                <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Coterie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Coteries</SelectItem>
                  {coteries.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {factions.length > 0 && (
              <Select value={toolbar.filterFaction} onValueChange={v => setFilter("filterFaction", v)}>
                <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Faction" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Factions</SelectItem>
                  {factions.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {plots.length > 0 && (
              <Select value={toolbar.filterStory} onValueChange={v => setFilter("filterStory", v)}>
                <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Story" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Stories</SelectItem>
                  {plots.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {filterOptions.sires.length > 0 && (
              <Select value={toolbar.filterSire} onValueChange={v => setFilter("filterSire", v)}>
                <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Sire" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Sires</SelectItem>
                  {filterOptions.sires.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

            <Select value={toolbar.groupBy} onValueChange={v => setFilter("groupBy", v)}>
              <SelectTrigger className="w-[140px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Group by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No Grouping</SelectItem>
                <SelectItem value="clan">Group by Clan</SelectItem>
                <SelectItem value="status">Group by Status</SelectItem>
                <SelectItem value="type">Group by Type</SelectItem>
                <SelectItem value="coterie">Group by Coterie</SelectItem>
                <SelectItem value="faction">Group by Faction</SelectItem>
                <SelectItem value="sire">Group by Sire</SelectItem>
                <SelectItem value="generation">Group by Generation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={toolbar.sortBy} onValueChange={v => setFilter("sortBy", v)}>
              <SelectTrigger className="w-[150px] h-9 text-sm bg-input border-border"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A–Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z–A)</SelectItem>
                <SelectItem value="clan">Clan</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                <SelectItem value="updated">Recently Updated</SelectItem>
                <SelectItem value="generation">Generation</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>

          {/* Results count */}
          {!loading && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                Showing {sortedCharacters.length} of {characters.length} characters
                {selection.count > 0 && <> · <span className="text-foreground">{selection.count} selected</span></>}
              </p>
              <div className="flex items-center gap-1">
                {(selectMode || viewMode === "table") && sortedCharacters.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => selection.setAll(sortedCharacters.map(c => c.id))}>Select all shown</Button>
                )}
                {viewMode === "grid" && (
                  <Button variant={selectMode ? "secondary" : "ghost"} size="sm" onClick={() => { if (selectMode) selection.clear(); setSelectMode(m => !m); }}>
                    <CheckSquare className="h-4 w-4 mr-1" />{selectMode ? "Done" : "Select"}
                  </Button>
                )}
                <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" aria-label="Card view" onClick={() => setViewMode("grid")}><LayoutGrid className="h-4 w-4" /></Button>
                <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="icon" aria-label="Table view" onClick={() => setViewMode("table")}><Rows3 className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Character Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <CharacterCardSkeleton key={i} />)}
            </div>
          ) : viewMode === "table" ? (
            <CharacterTable
              characters={sortedCharacters}
              selected={selection.selected}
              onToggle={(id, shift) => selection.toggle(id, sortedCharacters.map(c => c.id), shift)}
              onToggleAll={checked => checked ? selection.setAll(sortedCharacters.map(c => c.id)) : selection.clear()}
              onOpen={goToCharacter}
              coterieNames={coterieNameFor}
              factionNames={factionNameFor}
            />
          ) : groupedCharacters ? (
            <div className="space-y-4">
              {[...groupedCharacters.entries()].map(([group, chars]) => (
                <Collapsible key={group} defaultOpen>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left py-2 px-3 rounded-md bg-secondary/50 hover:bg-secondary transition-colors group">
                    <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                    <span className="font-semibold text-foreground">{group}</span>
                    <span className="text-sm text-muted-foreground">({chars.length})</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-3">
                      {chars.map(character => (
                        renderCard(character)
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCharacters.map(character => (
                renderCard(character)
              ))}
            </div>
          )}

          {!loading && sortedCharacters.length === 0 && (
            searchTerm || hasActiveFilters ? (
              <EmptyState
                icon={<Users className="h-7 w-7" />}
                title="No characters found"
                description="Try adjusting your search or filters."
                action={<Button variant="outline" onClick={clearFilters}><X className="w-4 h-4 mr-2" /> Clear Filters</Button>}
              />
            ) : (
              <EmptyState
                icon={<Users className="h-7 w-7" />}
                title="No characters yet"
                description="Characters are the heart of your chronicle — add your PCs and the NPCs they'll encounter."
                tip="Start with 1-2 Player Characters, then add NPCs as your story unfolds. Use the Wizard for guided creation."
                action={
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setWizardOpen(true)} className="border-primary/50">
                      <Wand2 className="w-4 h-4 mr-2" /> Character Wizard
                    </Button>
                    <CreateCharacterDialog>
                      <Button className="bg-gradient-blood hover:opacity-90 shadow-crimson">
                        <Plus className="w-4 h-4 mr-2" /> Quick Create
                      </Button>
                    </CreateCharacterDialog>
                    <Button onClick={() => setShowBulkNPCDialog(true)} className="bg-destructive/30 hover:bg-destructive/50 border border-destructive/50 text-foreground">
                      <UsersRound className="w-4 h-4 mr-2" /> Generate Group
                    </Button>
                  </div>
                }
              />
            )
          )}
        </TabsContent>

        {/* ===== Coteries Tab ===== */}
        <TabsContent value="coteries" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => setShowCreateCoterie(true)} className="bg-gradient-blood hover:opacity-90 shadow-crimson">
              <Plus className="w-4 h-4 mr-2" /> New Coterie
            </Button>
          </div>

          {coteriesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-full" /></CardHeader><CardContent><Skeleton className="h-4 w-1/2" /></CardContent></Card>
              ))}
            </div>
          ) : coteries.length === 0 ? (
            <EmptyState
              icon={<Users className="h-7 w-7" />}
              title="No coteries yet"
              description="Coteries are groups of vampires who band together for survival, politics, or shared goals."
              tip="Create your characters first, then group them into coteries."
              action={
                <Button onClick={() => setShowCreateCoterie(true)} className="bg-gradient-blood hover:opacity-90 shadow-crimson">
                  <Plus className="h-4 w-4 mr-2" /> Create First Coterie
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {coteries.map(coterie => (
                <CoterieCard
                  key={coterie.id}
                  coterie={coterie}
                  members={coterieMembersMap.get(coterie.id) || []}
                  onEdit={setSelectedCoterie}
                  onSetPrimary={setPrimaryCoterie}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== Factions Tab ===== */}
        <TabsContent value="factions" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Factions & Groups</h2>
              <p className="text-sm text-muted-foreground">
                Organize characters into factions and see group dynamics
              </p>
            </div>
            <Button
              onClick={() => setCreateFactionDialogOpen(true)}
              className="bg-gradient-blood hover:opacity-90 shadow-crimson"
            >
              <Plus className="w-4 h-4 mr-2" /> Create Faction
            </Button>
          </div>

          {factions.length === 0 ? (
            <EmptyState
              icon={<Flag className="h-7 w-7" />}
              title="No factions yet"
              description="Factions are larger political or social groups that characters belong to — sects, clans, covenants, or rival organizations."
              tip="Create characters first, then organize them into factions to track allegiances and rivalries."
              action={
                <Button
                  onClick={() => setCreateFactionDialogOpen(true)}
                  className="bg-gradient-blood hover:opacity-90 shadow-crimson"
                >
                  <Plus className="w-4 h-4 mr-2" /> Create First Faction
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {factions.map(faction => {
                const members = characterFactions
                  .filter(cf => cf.faction_id === faction.id)
                  .map(cf => characters.find(c => c.id === cf.character_id))
                  .filter(Boolean) as Character[];

                return (
                  <EntityCard
                    key={faction.id}
                    entityId={faction.id}
                    variant="panel"
                    className="overflow-hidden min-w-0"
                    style={{ borderTop: `4px solid ${faction.color}` }}
                  >
                    <EntityCardHeaderBar
                      leading={
                        <div
                          className="w-3 h-3 rounded-full mt-1.5"
                          style={{ backgroundColor: faction.color }}
                        />
                      }
                      title={faction.name}
                      subtitle={
                        faction.description ? (
                          <span className="line-clamp-2">{faction.description}</span>
                        ) : undefined
                      }
                      actions={
                        <CardIconAction
                          label="Edit faction"
                          onClick={() => {
                            setSelectedFaction(faction);
                            setEditFactionDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </CardIconAction>
                      }
                    />
                    <EntityCardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {members.length} member{members.length !== 1 ? 's' : ''}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedFaction(faction);
                              setManageMembersDialogOpen(true);
                            }}
                          >
                            <UserPlus className="w-4 h-4 mr-2" /> Manage
                          </Button>
                        </div>
                        {members.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {members.slice(0, 5).map(member => (
                              <Badge key={member.id} variant="secondary" className="text-xs">
                                {member.name}
                              </Badge>
                            ))}
                            {members.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{members.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </EntityCardContent>
                  </EntityCard>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ViewCharacterDialog character={viewCharacter} open={!!viewCharacter} onOpenChange={open => !open && setViewCharacter(null)} />
      <EditCharacterDialog character={editCharacter} open={!!editCharacter} onOpenChange={open => !open && setEditCharacter(null)} onUpdate={updateCharacter} onDelete={deleteCharacter} />
      <CharacterWizard open={wizardOpen} onOpenChange={setWizardOpen} />
      <CreateCoterieDialog open={showCreateCoterie} onOpenChange={setShowCreateCoterie} />
      <ManageCoterieDialog open={!!selectedCoterie} onOpenChange={open => !open && setSelectedCoterie(null)} coterie={selectedCoterie} />
      {currentChronicle && (
        <>
          <CreateFactionDialog
            open={createFactionDialogOpen}
            onOpenChange={setCreateFactionDialogOpen}
            chronicleId={currentChronicle.id}
            onCreate={createFaction}
          />
          <EditFactionDialog
            faction={selectedFaction}
            open={editFactionDialogOpen}
            onOpenChange={setEditFactionDialogOpen}
            onUpdate={updateFaction}
            onDelete={deleteFaction}
          />
          <ManageFactionMembersDialog
            faction={selectedFaction}
            open={manageMembersDialogOpen}
            onOpenChange={setManageMembersDialogOpen}
            characters={characters}
            characterFactions={characterFactions}
            onAddCharacter={addCharacterToFaction}
            onRemoveCharacter={removeCharacterFromFaction}
          />
        </>
      )}
      <BulkNPCDialog open={showBulkNPCDialog} onOpenChange={setShowBulkNPCDialog} />
      <BulkActionBar
        selectedIds={[...selection.selected]}
        onClear={() => { selection.clear(); setSelectMode(false); }}
        sessions={sessions.map(x => ({ id: x.id, label: x.title }))}
        stories={plots.map(p => ({ id: p.id, label: p.title }))}
        coteries={coteries.map(c => ({ id: c.id, label: c.name }))}
        factions={factions.map(f => ({ id: f.id, label: f.name }))}
        statuses={statusOptions}
        onSetStatus={bulkSetStatus}
      />
    </div>
  );
}
