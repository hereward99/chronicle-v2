export interface RecentVisit {
  path: string;
  label: string;
  at: number;
}

const KEY = "chronicle-recent-visits";
const MAX = 8;
export const RECENT_VISITS_EVENT = "chronicle-recent-visits-changed";

export function getRecentVisits(): RecentVisit[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RecentVisit[]) : [];
  } catch {
    return [];
  }
}

export function recordVisit(path: string, label: string) {
  if (!label) return;
  try {
    const next = [{ path, label, at: Date.now() }, ...getRecentVisits().filter((v) => v.path !== path)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(RECENT_VISITS_EVENT));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function clearRecentVisits() {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new CustomEvent(RECENT_VISITS_EVENT));
  } catch {
    /* ignore */
  }
}
