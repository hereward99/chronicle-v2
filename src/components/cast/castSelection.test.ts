import { describe, it } from "node:test";
import { deepStrictEqual } from "node:assert";
import { castChanges, filterCast } from "./castSelection";

const characters = [
  { id: "one", name: "Alice", clan: "Brujah", type: "PC", coterie: "Night Watch" },
  { id: "two", name: "Bob", clan: "Ventrue", type: "NPC", coterie: null },
  { id: "three", name: "Celia", clan: "Brujah", type: "NPC", coterie: "Night Watch" },
];

describe("cast selection", () => {
  it("filters player characters within a clan and coterie", () => {
    deepStrictEqual(filterCast(characters, "", "Brujah", "PC", "Night Watch").map(c => c.id), ["one"]);
  });
  it("searches names without case sensitivity", () => {
    deepStrictEqual(filterCast(characters, " ALICE ", "__none__", "__none__", "__none__").map(c => c.id), ["one"]);
  });
  it("skips already linked characters and deduplicates additions", () => {
    deepStrictEqual(castChanges(["one"], ["one", "two", "two"], ["one", "two"]), { added: ["two"], removed: [] });
  });
  it("removes unticked candidates without touching unavailable memberships", () => {
    deepStrictEqual(castChanges(["one", "other-chronicle"], ["two", "foreign"], ["one", "two"]), { added: ["two"], removed: ["one"] });
  });
});