import raw from "@/data/components.json";

export type Category =
  | "actions"
  | "inputs"
  | "selection"
  | "navigation"
  | "feedback"
  | "overlays"
  | "layout"
  | "data-display"
  | "media"
  | "typography"
  | "utility";

export interface CatalogEntry {
  id: string;
  name: string;
  aliases: string[];
  category: Category;
  description: string;
}

export const CATALOG: readonly CatalogEntry[] = raw as CatalogEntry[];

const BY_ID = new Map(CATALOG.map((entry) => [entry.id, entry]));

export function getComponent(id: string): CatalogEntry | undefined {
  return BY_ID.get(id);
}

export const CATEGORY_LABELS: Record<Category, string> = {
  actions: "Actions",
  inputs: "Inputs",
  selection: "Selection",
  navigation: "Navigation",
  feedback: "Feedback",
  overlays: "Overlays",
  layout: "Layout",
  "data-display": "Data display",
  media: "Media",
  typography: "Typography",
  utility: "Utility",
};

/**
 * Words the player is not allowed to use for a given target: the component's
 * name, every alias, and each individual word of those longer than three
 * letters (so "date" is banned for Date Picker but "the" never is).
 */
export function bannedWordsFor(entry: CatalogEntry): string[] {
  const phrases = [entry.name, ...entry.aliases].map((s) => s.toLowerCase());
  const words = new Set<string>();
  for (const phrase of phrases) {
    words.add(phrase);
    for (const word of phrase.split(/[^a-z0-9+]+/)) {
      if (word.length > 3 && !STOP_WORDS.has(word)) words.add(word);
    }
  }
  return [...words];
}

const STOP_WORDS = new Set([
  "with",
  "from",
  "that",
  "this",
  "into",
  "only",
  "view",
  "text",
  "input",
  "field",
  "control",
  "menu",
  "button",
  "panel",
  "bar",
  "list",
  "group",
  "item",
  "page",
  "section",
  "message",
  "state",
]);

/** Naive singular/plural normalisation so "toasts" trips the "toast" ban. */
function stem(word: string): string {
  return word.replace(/(es|s)$/i, "");
}

/**
 * Returns the banned word or phrase the description contains, or null.
 * Case-insensitive; matches on whole words, tolerating simple plurals.
 */
export function findBannedWord(
  description: string,
  banned: string[],
): string | null {
  const lowered = description.toLowerCase();
  const tokens = lowered.split(/[^a-z0-9+]+/).filter(Boolean);
  const stems = new Set(tokens.map(stem));
  for (const phrase of banned) {
    if (phrase.includes(" ")) {
      if (lowered.includes(phrase)) return phrase;
    } else if (stems.has(stem(phrase))) {
      return phrase;
    }
  }
  return null;
}
