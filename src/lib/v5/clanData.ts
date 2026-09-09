// V5 Clan Banes and Compulsions — corebook reference data

export interface ClanInfo {
  bane: string;
  compulsion: string;
}

export const CLAN_DATA: Record<string, ClanInfo> = {
  "Brujah": {
    bane: "The Fury: Subtract dice equal to Bane Severity from pools to resist Fury Frenzy. This cannot reduce the pool below one die.",
    compulsion: "Rebellion: The vampire takes a two-dice penalty on all rolls that do not relate to directly opposing whatever or whoever they see as the status quo in the scene, be it an authority, a plan, or even a social norm.",
  },
  "Gangrel": {
    bane: "Feral Features: On Frenzy, the vampire gains one or more bestial features (ears, tufts, tail, slitted eyes, etc.) equal to Bane Severity. Each feature reduces one Attribute by 1 (ST's choice) for the rest of the night.",
    compulsion: "Feral Impulses: The vampire regresses to an animalistic state. They take a two-dice penalty to all rolls involving Manipulation and Intelligence. They can only speak in one-word sentences.",
  },
  "Malkavian": {
    bane: "Fractured Perspective: Suffers from a unique derangement or delusion. In stressful situations, the ST may increase the severity of the character's compulsion penalties by Bane Severity.",
    compulsion: "Delusion: The vampire's extrasensory perception kicks in, flooding their mind. They gain a penalty equal to two dice on rolls involving Dexterity, Manipulation, Composure, and Wits, as their senses distort reality.",
  },
  "Nosferatu": {
    bane: "Repulsiveness: Cursed with hideous appearance. Automatically fail any rolls to blend in with humans. Add Bane Severity as bonus dice to Intimidation pools against mortals.",
    compulsion: "Cryptophilia: The vampire becomes obsessed with learning a secret. They take a two-dice penalty on all rolls not related to uncovering the secret. The compulsion ends when a secret is obtained.",
  },
  "Toreador": {
    bane: "Aesthetic Fixation: Become entranced by beauty. When in the presence of something truly beautiful (or truly ugly), must spend Willpower or become fixated for the turn. Bane Severity determines how many turns spent fixated without spending Willpower.",
    compulsion: "Obsession: The vampire becomes entranced by a thing of beauty or fascination. They take a two-dice penalty on all rolls not related to the object of fascination. Destroying or removing the object ends the compulsion.",
  },
  "Tremere": {
    bane: "Deficient Blood: Cannot Blood Bond other Kindred. Attempts to Bond another vampire always fail. Bane Severity reduces the number of sips needed for others to Bond the Tremere.",
    compulsion: "Perfectionism: Nothing is ever good enough. The vampire takes a two-dice penalty on all rolls until they score a critical win on a roll, ending the compulsion.",
  },
  "Ventrue": {
    bane: "Rarefied Tastes: Can only feed from a specific type of mortal (chosen at creation). Feeding from other sources causes the vampire to vomit the blood, gaining no nourishment. Bane Severity determines how quickly the blood is rejected.",
    compulsion: "Arrogance: The vampire must assert dominance. They take a two-dice penalty on all rolls that don't involve commanding, extorting, or otherwise dominating someone of importance.",
  },
  "Caitiff": {
    bane: "Suspect: Caitiff have no inherent clan bane, but lack the protection of clan membership. Any Loresheet, Status, or Kindred society advantages cost double. Bane Severity increases the social stigma.",
    compulsion: "No inherent clan compulsion. Caitiff do not suffer a specific clan compulsion but may develop personal ones at the ST's discretion.",
  },
  "Thin-Blood": {
    bane: "Thin-Blooded Limitations: Cannot Blood Bond, create childer reliably, or use Blush of Life without Thin-Blood Alchemy. Sunlight still deals damage (though reduced). Bane Severity may vary based on Thin-Blood merits and flaws.",
    compulsion: "No inherent clan compulsion. Thin-Bloods are not subject to standard clan compulsions but may face unique challenges related to their precarious existence.",
  },
  "Lasombra": {
    bane: "Skulking Shadows: Do not appear in reflections (mirrors, cameras, puddles). Technology glitches in their presence. Bane Severity determines the extent of electronic and photographic distortion.",
    compulsion: "Ruthlessness: The vampire must assert superiority at any cost. They take a two-dice penalty on all rolls that don't involve seizing power, undercutting rivals, or ensuring they come out on top of a situation.",
  },
  "Tzimisce": {
    bane: "Grounding: Must sleep surrounded by soil from a place important to them (homeland, haven, etc.). Each day without it adds Bane Severity as a penalty to all rolls. Must also establish territorial domain.",
    compulsion: "Covetousness: The vampire becomes fixated on possessing something in the scene. They take a two-dice penalty on all rolls not directed at obtaining the coveted object or territory.",
  },
  "Hecata": {
    bane: "Painful Kiss: The Hecata bite causes excruciating pain rather than ecstasy. Victims must be restrained or willing. Bane Severity adds to the difficulty of feeding without alerting others.",
    compulsion: "Morbidity: The vampire becomes fixated on death and the dead. They take a two-dice penalty on all rolls not related to studying, influencing, or interacting with the dead or dying.",
  },
  "Ravnos": {
    bane: "Doomed: The sun's fire burns hotter. Add Bane Severity to Aggravated damage taken from sunlight. Also cursed to live in the moment — cannot stay in the same place for long without consequence.",
    compulsion: "Tempting Fate: The vampire must take the riskiest option available. They take a two-dice penalty on all rolls unless they choose the most dangerous or daring course of action.",
  },
  "Salubri": {
    bane: "Third Eye: A mystical third eye opens on the forehead when using Disciplines. It weeps blood, making the vampire unmistakable. Bane Severity determines how visible and persistent the eye is.",
    compulsion: "Affective Empathy: The vampire is overcome with empathy. They take a two-dice penalty on all rolls that could harm the individual who triggered the compulsion.",
  },
  "Ministry": {
    bane: "Serpentine Sensitivity: Vulnerable to bright light. Add Bane Severity as a penalty to all rolls when exposed to bright light (not just sunlight). Halogen lamps and flashlights can be weaponized against them.",
    compulsion: "Transgression: The vampire must lead someone into breaking a personal conviction, Chronicle Tenet, or strongly held belief. They take a two-dice penalty until they successfully tempt someone.",
  },
  "Banu Haqim": {
    bane: "Blood Addiction: When tasting Kindred vitae, must pass a Hunger Frenzy test (Difficulty 2 + Bane Severity) or compulsively feed. Diablerie becomes dangerously tempting.",
    compulsion: "Judgment: The vampire must punish a perceived transgressor. They take a two-dice penalty on all rolls until they've meted out what they consider appropriate justice.",
  },
};

export const CLAN_DISCIPLINES: Record<string, string[]> = {
  "Brujah": ["Celerity", "Potence", "Presence"],
  "Gangrel": ["Animalism", "Fortitude", "Protean"],
  "Malkavian": ["Auspex", "Dominate", "Obfuscate"],
  "Nosferatu": ["Animalism", "Obfuscate", "Potence"],
  "Toreador": ["Auspex", "Celerity", "Presence"],
  "Tremere": ["Auspex", "Blood Sorcery", "Dominate"],
  "Ventrue": ["Dominate", "Fortitude", "Presence"],
  "Lasombra": ["Dominate", "Oblivion", "Potence"],
  "Tzimisce": ["Animalism", "Dominate", "Protean"],
  "Hecata": ["Auspex", "Fortitude", "Oblivion"],
  "Ravnos": ["Animalism", "Obfuscate", "Presence"],
  "Salubri": ["Auspex", "Dominate", "Fortitude"],
  "Ministry": ["Obfuscate", "Presence", "Protean"],
  "Banu Haqim": ["Blood Sorcery", "Celerity", "Obfuscate"],
  "Caitiff": [],
  "Thin-Blood": ["Thin-Blood Alchemy"],
};

export function getClanData(clan: string): ClanInfo | null {
  if (clan === "Human" || clan === "Ghoul") return null;
  return CLAN_DATA[clan] || null;
}

export function getClanDisciplines(clan: string): string[] {
  return CLAN_DISCIPLINES[clan] || [];
}

export function isInClanDiscipline(clan: string, discipline: string): boolean | null {
  if (!clan || !discipline) return null;
  if (clan === "Human" || clan === "Ghoul") return null;
  if (clan === "Caitiff") return null; // No affinity
  const inClan = CLAN_DISCIPLINES[clan];
  if (!inClan) return null;
  return inClan.some(d => d.toLowerCase() === discipline.toLowerCase());
}

