/**
 * Every Jev question and every threshold the app uses lives in this file.
 *
 * This is deliberate. The TypeSafe agent-skill guidance is that the questions
 * and the constants are the part humans most need to review, so they should be
 * in one place rather than scattered through route handlers and components.
 *
 * Jev reads `instructions` and `criteria` literally. Keep them plain, one
 * judgment each, and describe situations rather than degrees.
 */
import { choice, noul, score, type ChoiceCriteria } from "@typesafe-ai/sdk";
import { CATALOG } from "@/lib/catalog";

// ---------------------------------------------------------------------------
// Thresholds. Tune against real rounds; wording changes to criteria first.
// ---------------------------------------------------------------------------

/** Confidence at or above which Jev "buzzes in" with its answer. */
export const BUZZ_IN = 0.85;
/** Confidence at or above which Jev admits it is leaning toward an option. */
export const LEANING = 0.5;
/** A runner-up with at least this probability makes the round "a toss-up". */
export const TOSS_UP = 0.25;
/** Above this, the description is treated as too vague to guess from. */
export const VAGUE = 0.7;
/** `not_a_component` probability above which we stop guessing and ask again. */
export const NOT_A_COMPONENT = 0.6;
/** Lost & Found: exists probability at or above this is a real match. */
export const EXISTS_FOUND = 0.7;
/** Lost & Found: exists probability below this means the library lacks it. */
export const EXISTS_ABSENT = 0.35;
/** Minimum characters before we bother asking Jev anything. */
export const MIN_DESCRIPTION_CHARS = 8;
/** Debounce between keystrokes and a request, in milliseconds. */
export const DEBOUNCE_MS = 350;

/** Escape option for the catalog Choice. Docs recommend an "other" option. */
export const NOT_A_COMPONENT_ID = "not_a_component";

// ---------------------------------------------------------------------------
// The catalog Choice. One option per component, value = its description.
// ---------------------------------------------------------------------------

const catalogCriteria: ChoiceCriteria = Object.fromEntries([
  ...CATALOG.map((entry) => [entry.id, entry.description] as const),
  [
    NOT_A_COMPONENT_ID,
    "The text does not describe any user interface element, or describes something that is not a component at all.",
  ],
]);

const whichComponent = choice(
  {
    question:
      "Which user interface component from the options is being described in `description`?",
    focus:
      "Match on what the thing does, how it looks, and where it sits on the screen. The writer is deliberately avoiding the component's name.",
    fallback: `Pick ${NOT_A_COMPONENT_ID} only if the text is not describing a user interface element.`,
  },
  catalogCriteria,
);

/**
 * The finder asks for a need rather than a portrait, so Jev drifts toward the
 * container an action lives in ("submits a form" → Form, "closes the dialog"
 * → Modal). Spell out that we want the element itself.
 */
const whichComponentForNeed = choice(
  {
    question:
      "A designer describes something they need in `description`. Which component from the options is the one they would add to do it?",
    focus:
      "Choose the single element that performs the action or shows the thing described, not the larger container or screen it belongs to. If they need something that submits, closes, opens, or triggers, that is usually the control itself, not the form or dialog around it.",
    fallback: `Pick ${NOT_A_COMPONENT_ID} only if the text is not describing a user interface element.`,
  },
  catalogCriteria,
);

// ---------------------------------------------------------------------------
// Side questions. All speculative; they ride along in the same request.
// ---------------------------------------------------------------------------

const isVague = noul(
  "Is `description` too short or too generic to identify one specific user interface component?",
  {
    true: "A few words, or wording that could apply to dozens of different components equally well.",
    false:
      "Names at least one concrete behavior, visual detail, or screen position that narrows it down.",
  },
);

const describesBehavior = noul(
  "Does `description` say what the component does or how it responds when a person interacts with it?",
  {
    true: "Mentions an action, a reaction, timing, or a change of state: appears, disappears, opens, slides, submits, toggles.",
    false: "Only describes looks or position, with no behavior.",
  },
);

const describesAppearance = noul(
  "Does `description` say what the component looks like?",
  {
    true: "Mentions shape, size, color, icon, border, shadow, or how it is drawn.",
    false: "No visual details are given.",
  },
);

const describesPlacement = noul(
  "Does `description` say where on the screen the component is located?",
  {
    true: "Mentions a position such as top, bottom, corner, side, centered, inline, or floating over the page.",
    false: "No screen position is mentioned.",
  },
);

const vividness = score(
  "How vivid and specific is the writing in `description`?",
  [
    "Flat and generic: could describe almost anything on a screen.",
    "Clear and workable: names a couple of concrete details.",
    "Vivid: paints a specific picture with several distinct, well-chosen details.",
  ],
);

// ---------------------------------------------------------------------------
// Lost & Found extras.
// ---------------------------------------------------------------------------

const existsInLibrary = noul(
  "Does at least one of the components listed in `library` fit the need described in `description`?",
  {
    true: "A component in the library does what the person is asking for, even if they described it loosely.",
    false:
      "Nothing in the library does this; the person is describing a component that would have to be invented.",
  },
);

export const WHY_OPTIONS = {
  behavior: "The way it acts: what it does, when it appears, how it responds.",
  appearance: "The way it looks: its shape, size, color, or visual style.",
  placement: "Where it sits on the screen or in the layout.",
  content: "What it holds or shows: the kind of information inside it.",
} as const;

export type WhyAspect = keyof typeof WHY_OPTIONS;

const whyMatched = choice(
  "Which aspect of `description` most strongly identifies the specific component being described?",
  WHY_OPTIONS,
);

// ---------------------------------------------------------------------------
// Question sets per mode.
// ---------------------------------------------------------------------------

export const CHARADES_QUESTIONS = {
  which_component: whichComponent,
  is_vague: isVague,
  describes_behavior: describesBehavior,
  describes_appearance: describesAppearance,
  describes_placement: describesPlacement,
  vividness,
  why_matched: whyMatched,
} as const;

export const LOST_FOUND_QUESTIONS = {
  which_component: whichComponentForNeed,
  exists_in_library: existsInLibrary,
  is_vague: isVague,
  why_matched: whyMatched,
  vividness,
} as const;

export type Mode = "charades" | "lostfound";

/** A compact library listing for the Lost & Found state. Names only. */
export const LIBRARY_LISTING = CATALOG.map((entry) => entry.name);
