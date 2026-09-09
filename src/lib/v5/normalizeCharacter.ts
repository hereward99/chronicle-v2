import { DISCIPLINES } from "./disciplineData";
import type { Character } from "@/hooks/useCharacters";

/**
 * Older / AI-imported characters were saved with looser shapes than the current
 * character sheet expects (e.g. `disciplines: [{ potence: 2 }]`, skills stored as
 * plain numbers, advantages stored as bare strings). Rendering those directly
 * threw and blanked the page, so every character is normalised before display.
 */

const titleCase = (key: string) =>
  key
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const KNOWN_DISCIPLINES = new Set(
  (DISCIPLINES as readonly string[]).map((d) => d.toLowerCase())
);

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function normalizeDisciplines(raw: unknown): { name: string; level: number }[] {
  if (!Array.isArray(raw)) return [];
  const out: { name: string; level: number }[] = [];

  for (const entry of raw) {
    if (typeof entry === "string") {
      out.push({ name: titleCase(entry), level: 0 });
      continue;
    }
    if (!isPlainObject(entry)) continue;

    if (typeof entry.name === "string") {
      out.push({
        name: entry.name,
        level: Number(entry.level ?? entry.rating ?? entry.dots ?? 0) || 0,
      });
      continue;
    }

    // Legacy shape: { potence: 2 } or { obfuscate: 2, chilling_drape: 1 }
    const keys = Object.keys(entry);
    const disciplineKey =
      keys.find((k) => KNOWN_DISCIPLINES.has(k.replace(/_/g, " ").toLowerCase())) ?? keys[0];
    if (!disciplineKey) continue;
    out.push({
      name: titleCase(disciplineKey),
      level: Number(entry[disciplineKey]) || 0,
    });
  }

  return out;
}

function normalizeSkills(raw: unknown): Record<string, { rating: number; specialty?: string }> {
  if (!isPlainObject(raw)) return {};
  const out: Record<string, { rating: number; specialty?: string }> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "number") {
      out[key] = { rating: value };
    } else if (isPlainObject(value)) {
      out[key] = {
        rating: Number(value.rating ?? value.dots ?? value.level ?? 0) || 0,
        specialty: typeof value.specialty === "string" ? value.specialty : undefined,
      };
    }
  }
  return out;
}

interface NamedEntry {
  name: string;
  type?: string;
  rating?: number;
  description?: string;
}

function normalizeNamedList(raw: unknown): NamedEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): NamedEntry | null => {
      if (typeof entry === "string") return { name: entry };
      if (!isPlainObject(entry)) return null;
      if (typeof entry.name === "string") {
        return {
          name: entry.name,
          type: typeof entry.type === "string" ? entry.type : undefined,
          rating: typeof entry.rating === "number" ? entry.rating : undefined,
          description: typeof entry.description === "string" ? entry.description : undefined,
        };
      }
      const key = Object.keys(entry)[0];
      if (!key) return null;
      const value = entry[key];
      return {
        name: titleCase(key),
        rating: typeof value === "number" ? value : undefined,
        description: typeof value === "string" ? value : undefined,
      };
    })
    .filter((e): e is NamedEntry => e !== null && Boolean(e.name));
}

function normalizePowers(raw: unknown): Character["powers"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (typeof entry === "string") {
        return { name: entry, discipline: "", level: 0 };
      }
      if (!isPlainObject(entry)) return null;
      const name = typeof entry.name === "string" ? entry.name : Object.keys(entry)[0];
      if (!name) return null;
      return {
        name: typeof name === "string" ? name : String(name),
        discipline: typeof entry.discipline === "string" ? entry.discipline : "",
        level: Number(entry.level ?? entry.rating ?? 0) || 0,
        cost: typeof entry.cost === "string" ? entry.cost : undefined,
        description: typeof entry.description === "string" ? entry.description : undefined,
      };
    })
    .filter(Boolean) as Character["powers"];
}

function normalizeTouchstones(raw: unknown): Character["touchstones"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (typeof entry === "string") return { name: entry };
      if (!isPlainObject(entry)) return null;
      const name =
        typeof entry.name === "string" ? entry.name : Object.keys(entry)[0] || "";
      if (!name) return null;
      return {
        name,
        conviction: typeof entry.conviction === "string" ? entry.conviction : undefined,
        description: typeof entry.description === "string" ? entry.description : undefined,
      };
    })
    .filter(Boolean) as Character["touchstones"];
}

function normalizeStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((e) => {
      if (typeof e === "string") return e;
      if (isPlainObject(e)) {
        if (typeof e.name === "string") return e.name;
        if (typeof e.text === "string") return e.text;
        const k = Object.keys(e)[0];
        return k ? titleCase(k) : "";
      }
      return "";
    })
    .filter(Boolean);
}

function normalizeLoresheets(raw: unknown): Character["loresheets"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (typeof entry === "string") return { name: entry, benefits: [] };
      if (!isPlainObject(entry)) return null;
      const name = typeof entry.name === "string" ? entry.name : Object.keys(entry)[0] || "";
      if (!name) return null;
      return { name, benefits: normalizeStringList(entry.benefits) };
    })
    .filter(Boolean) as Character["loresheets"];
}

/** Coerce any stored character record into the shape the sheet expects. */
export function normalizeCharacter(character: Character): Character {
  return {
    ...character,
    skills: normalizeSkills(character.skills),
    disciplines: normalizeDisciplines(character.disciplines),
    powers: normalizePowers(character.powers),
    advantages: normalizeNamedList(character.advantages).map(a => ({ ...a, type: a.type ?? "" })),
    flaws: normalizeNamedList(character.flaws),
    loresheets: normalizeLoresheets(character.loresheets),
    convictions: normalizeStringList(character.convictions),
    chronicle_tenets: normalizeStringList(character.chronicle_tenets),
    touchstones: normalizeTouchstones(character.touchstones),
  };
}
