import { describe, it } from "node:test";
import { deepStrictEqual, equal, notEqual, throws } from "node:assert/strict";
import { characterViewsKey, defaultCharacterToolbar, matchesCharacterView, parseCharacterViews, saveCharacterView, storeCharacterViews } from "./characterSavedViews";

const snapshot = { toolbar: { ...defaultCharacterToolbar, filterClan: "Brujah", filterStory: "story-1", groupBy: "clan", sortBy: "updated" }, searchTerm: "Alice" };

describe("saved character views", () => {
  it("round-trips all filters, search, grouping and sorting", () => {
    const views = saveCharacterView([], snapshot, "  Brujah cast  ", "view-1");
    deepStrictEqual(parseCharacterViews(JSON.stringify({ version: 1, views })), [{ ...snapshot, id: "view-1", name: "Brujah cast" }]);
  });
  it("rejects duplicate names but supports updating and renaming the same view", () => {
    const views = saveCharacterView([], snapshot, "Cast", "view-1");
    throws(() => saveCharacterView(views, snapshot, " cast ", "view-2"));
    const updated = saveCharacterView(views, { ...snapshot, searchTerm: "Bob" }, "New cast", "view-1");
    equal(updated.length, 1);
    equal(updated[0]?.searchTerm, "Bob");
    equal(updated[0]?.name, "New cast");
  });
  it("isolates collections by both user and chronicle", () => {
    notEqual(characterViewsKey("user-1", "chronicle-1"), characterViewsKey("user-2", "chronicle-1"));
    notEqual(characterViewsKey("user-1", "chronicle-1"), characterViewsKey("user-1", "chronicle-2"));
    const data = new Map<string, string>();
    const key = characterViewsKey("user-1", "chronicle-1");
    storeCharacterViews({ setItem: (k, value) => { data.set(k, value); } }, key, saveCharacterView([], snapshot, "Cast", "view-1"));
    equal(parseCharacterViews(data.get(key) ?? null).length, 1);
    deepStrictEqual(parseCharacterViews(data.get(characterViewsKey("user-1", "chronicle-2")) ?? null), []);
  });
  it("ignores malformed data and invalid toolbar values without discarding unloaded entity IDs", () => {
    deepStrictEqual(parseCharacterViews("not JSON"), []);
    deepStrictEqual(parseCharacterViews('{"version":2,"views":[]}'), []);
    const good = saveCharacterView([], snapshot, "Cast", "view-1")[0];
    const bad = { ...good, id: "bad", name: "Bad", toolbar: { ...snapshot.toolbar, sortBy: "invalid" } };
    const result = parseCharacterViews(JSON.stringify({ version: 1, views: [null, bad, good] }));
    equal(result.length, 1);
    equal(result[0]?.toolbar.filterStory, "story-1");
  });
  it("does not write existing toolbar preferences and propagates storage failures", () => {
    const keys: string[] = [];
    storeCharacterViews({ setItem: key => { keys.push(key); } }, characterViewsKey("user", "chronicle"), []);
    deepStrictEqual(keys, [characterViewsKey("user", "chronicle")]);
    throws(() => storeCharacterViews({ setItem: () => { throw new Error("Unavailable"); } }, "views", []));
  });
  it("saving and removing a view leaves current filters unchanged", () => {
    const original = structuredClone(snapshot);
    const views = saveCharacterView([], snapshot, "Cast", "view-1");
    if (views[0]) views[0].toolbar.filterClan = "Ventrue";
    views.filter(view => view.id !== "view-1");
    deepStrictEqual(snapshot, original);
    equal(matchesCharacterView(original, snapshot), true);
    equal(matchesCharacterView(original, { ...snapshot, searchTerm: "Other" }), false);
  });
});