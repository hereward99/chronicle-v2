export interface CastCandidate {
  id: string;
  name: string;
  clan: string;
  type: string;
  coterie: string | null;
}

export function filterCast<T extends CastCandidate>(characters: T[], search: string, clan: string, type: string, coterie: string): T[] {
  const query = search.trim().toLocaleLowerCase();
  return characters.filter(character =>
    (!query || `${character.name} ${character.clan} ${character.coterie ?? ""}`.toLocaleLowerCase().includes(query)) &&
    (clan === "__none__" || character.clan === clan) &&
    (type === "__none__" || character.type === type) &&
    (coterie === "__none__" || character.coterie === coterie)
  );
}

export function castChanges(existingIds: string[], selectedIds: string[], availableIds: string[]) {
  const existing = new Set(existingIds);
  const selected = new Set(selectedIds);
  const available = new Set(availableIds);
  return {
    added: [...selected].filter(id => available.has(id) && !existing.has(id)),
    removed: [...existing].filter(id => available.has(id) && !selected.has(id)),
  };
}