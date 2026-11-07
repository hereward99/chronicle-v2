export interface CharacterToolbarState {
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

export const defaultCharacterToolbar: CharacterToolbarState = {
  filterType: "__all__", filterClan: "__all__", filterStatus: "__all__",
  filterCoterie: "__all__", filterFaction: "__all__", filterStory: "__all__",
  filterSire: "__all__", groupBy: "__none__", sortBy: "name-asc",
};

export interface CharacterViewSnapshot {
  toolbar: CharacterToolbarState;
  searchTerm: string;
}

export interface SavedCharacterView extends CharacterViewSnapshot {
  id: string;
  name: string;
}

const groups = ["__none__", "clan", "status", "type", "coterie", "faction", "sire", "generation"];
const sorts = ["name-asc", "name-desc", "clan", "status", "updated", "generation"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function characterViewsKey(userId: string, chronicleId: string): string {
  return `characters:saved-views:v1:${encodeURIComponent(userId)}:${encodeURIComponent(chronicleId)}`;
}

export function parseCharacterViews(raw: string | null): SavedCharacterView[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.version !== 1 || !Array.isArray(data.views)) return [];
    const result: SavedCharacterView[] = [];
    for (const item of data.views) {
      if (!isRecord(item) || typeof item.id !== "string" || !item.id ||
          typeof item.name !== "string" || !item.name.trim() ||
          typeof item.searchTerm !== "string" || !isRecord(item.toolbar)) continue;
      const toolbar = { ...defaultCharacterToolbar };
      let valid = true;
      for (const key of Object.keys(toolbar) as (keyof CharacterToolbarState)[]) {
        const value = item.toolbar[key];
        if (value === undefined) continue;
        if (typeof value !== "string" || !value) { valid = false; break; }
        toolbar[key] = value;
      }
      if (!valid || !groups.includes(toolbar.groupBy) || !sorts.includes(toolbar.sortBy) ||
          !["__all__", "PC", "NPC"].includes(toolbar.filterType)) continue;
      const name = item.name.trim();
      if (result.some(view => view.id === item.id || view.name.toLowerCase() === name.toLowerCase())) continue;
      result.push({ id: item.id, name, searchTerm: item.searchTerm, toolbar });
    }
    return result;
  } catch { return []; }
}

export function storeCharacterViews(storage: Pick<Storage, "setItem">, key: string, views: SavedCharacterView[]): void {
  storage.setItem(key, JSON.stringify({ version: 1, views }));
}

export function saveCharacterView(views: SavedCharacterView[], snapshot: CharacterViewSnapshot, name: string, id: string): SavedCharacterView[] {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Enter a view name.");
  if (views.some(view => view.id !== id && view.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error("A view with that name already exists.");
  }
  const saved = { id, name: trimmed, searchTerm: snapshot.searchTerm, toolbar: { ...snapshot.toolbar } };
  return views.some(view => view.id === id)
    ? views.map(view => view.id === id ? saved : view)
    : [...views, saved];
}

export function matchesCharacterView(view: CharacterViewSnapshot, snapshot: CharacterViewSnapshot): boolean {
  return view.searchTerm === snapshot.searchTerm &&
    (Object.keys(defaultCharacterToolbar) as (keyof CharacterToolbarState)[]).every(key => view.toolbar[key] === snapshot.toolbar[key]);
}