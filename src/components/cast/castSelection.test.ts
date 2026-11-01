import { describe, it, expect } from "bun:test";
import { castChanges, filterCast } from "./castSelection";

const characters = [
  { id: "one", name: "Alice", clan: "Brujah", type: "PC", coterie: "Night Watch" },
  { id: "two", name: "Bob", clan: "Ventrue", type: "NPC", coterie: null },
  { id: "three", name: "Celia", clan: "Brujah", type: "NPC", coterie: "Night Watch" },
];

describe("cast selection", () => {
  it("filters player characters within a clan and coterie", () => {
    expect(filterCast(characters, "", "Brujah", "PC", "Night Watch").map(c => c.id)).toEqual(["one"]);
  });
  it("searches names without case sensitivity", () => {
    expect(filterCast(characters, " ALICE ", "__none__", "__none__", "__none__").map(c => c.id)).toEqual(["one"]);
  });
  it("skips already linked characters and deduplicates additions", () => {
    expect(castChanges(["one"], ["one", "two", "two"], ["one", "two"])).toEqual({ added: ["two"], removed: [] });
  });
  it("removes unticked candidates without touching unavailable memberships", () => {
    expect(castChanges(["one", "other-chronicle"], ["two", "foreign"], ["one", "two"])).toEqual({ added: ["two"], removed: ["one"] });
  });
});