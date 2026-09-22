import type { Evaluation } from "@/lib/jev/evaluate";
import type { CharadesVerdict, LostFoundVerdict, RevealedTarget } from "@/lib/game/verdict";

/** What /api/guess returns after trimming the ranking. */
export type PublicEvaluation = Omit<Evaluation, "ranking"> & {
  ranking: Evaluation["ranking"];
  othersMass: number;
  candidates: number;
};

export interface RoundInfo {
  token: string;
  category: string;
  banned: string[];
  phrases: string[];
  nameLength: number;
}

export interface CharadesGuessResponse {
  evaluation: PublicEvaluation;
  verdict: CharadesVerdict;
}

export interface LostFoundGuessResponse {
  evaluation: PublicEvaluation;
  verdict: LostFoundVerdict;
}

export interface GuessError {
  error: string;
  word?: string;
}

export type RoundPhase = "idle" | "describing" | "buzzed" | "revealed";

export interface RoundResult {
  target: RevealedTarget;
  correct: boolean;
  wordsUsed: number;
  requests: number;
  costUsd: number;
  guessed: { id: string; p: number } | null;
  tossUp: { id: string; p: number } | null;
  gaveUp: boolean;
  /** What the player wrote when the round ended. */
  description: string;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
