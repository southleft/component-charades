import type { CatalogEntry } from "@/lib/catalog";
import type { Evaluation, RankedOption } from "@/lib/jev/evaluate";
import {
  BUZZ_IN,
  EXISTS_ABSENT,
  EXISTS_FOUND,
  LEANING,
  NOT_A_COMPONENT,
  TOSS_UP,
  VAGUE,
} from "@/lib/jev/questions";

export interface RevealedTarget {
  id: string;
  name: string;
  description: string;
  category: string;
}

export type CharadesVerdict =
  | { kind: "not_a_component" }
  | { kind: "vague" }
  | { kind: "listening"; top: RankedOption }
  | { kind: "leaning"; top: RankedOption; tossUp: RankedOption | null }
  | {
      kind: "buzzed";
      top: RankedOption;
      correct: boolean;
      target: RevealedTarget;
      tossUp: RankedOption | null;
      /** Where the real answer landed in Jev's ranking when it guessed wrong. */
      targetRank: number;
      targetP: number;
    };

/**
 * Turn an Evaluation into the game's verdict. All of the rules are here and in
 * the thresholds file; Jev only supplied the numbers.
 */
export function charadesVerdict(evaluation: Evaluation, target: CatalogEntry): CharadesVerdict {
  const { ranking, notAComponent, confidence, signals } = evaluation;
  const top = ranking[0];
  if (!top) return { kind: "vague" };
  if (notAComponent >= NOT_A_COMPONENT) return { kind: "not_a_component" };
  if (signals.vague >= VAGUE && confidence < LEANING) return { kind: "vague" };

  const runnerUp = ranking[1] ?? null;
  const tossUp = runnerUp && runnerUp.p >= TOSS_UP ? runnerUp : null;

  if (confidence >= BUZZ_IN) {
    const targetIndex = ranking.findIndex((r) => r.id === target.id);
    return {
      kind: "buzzed",
      top,
      correct: top.id === target.id,
      target: reveal(target),
      tossUp,
      targetRank: targetIndex + 1,
      targetP: targetIndex >= 0 ? ranking[targetIndex].p : 0,
    };
  }
  if (confidence >= LEANING) return { kind: "leaning", top, tossUp };
  return { kind: "listening", top };
}

export function reveal(target: CatalogEntry): RevealedTarget {
  return {
    id: target.id,
    name: target.name,
    description: target.description,
    category: target.category,
  };
}

export type LostFoundVerdict = "found" | "partial" | "absent" | "not_a_component";

export function lostFoundVerdict(evaluation: Evaluation): LostFoundVerdict {
  if (evaluation.notAComponent >= NOT_A_COMPONENT) return "not_a_component";
  const exists = evaluation.exists ?? 0;
  if (exists >= EXISTS_FOUND) return "found";
  if (exists < EXISTS_ABSENT) return "absent";
  return "partial";
}
