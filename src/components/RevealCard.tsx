"use client";

import { Button, Card, CATEGORY_DOT, Chip, Label } from "@/components/ui";
import { CATEGORY_LABELS, getComponent, type CatalogEntry, type Category } from "@/lib/catalog";
import type { PublicEvaluation, RoundResult } from "@/lib/game/types";
import { WHY_OPTIONS, type WhyAspect } from "@/lib/jev/questions";

interface Props {
  result: RoundResult;
  evaluation: PublicEvaluation | null;
  onNext: () => void;
  starting: boolean;
  roundNumber: number;
}

const ASPECT_PHRASE: Record<WhyAspect, string> = {
  behavior: "the behavior",
  appearance: "the look",
  placement: "the placement",
  content: "what it holds",
};

function pct(p: number): string {
  return `${Math.round(p * 100)}%`;
}

/** RESULT card, replaces the STATE card when the round ends. */
export function RevealCard({ result, evaluation, onNext, starting, roundNumber }: Props) {
  const { target, correct, gaveUp, wordsUsed, guessed, tossUp } = result;
  const won = correct && !gaveUp;
  const guessedEntry = guessed ? getComponent(guessed.id) : null;
  const targetEntry = getComponent(target.id);
  const tossUpName = tossUp ? getComponent(tossUp.id)?.name ?? tossUp.id : null;
  const why = evaluation?.signals.why;

  const headline = gaveUp ? "You folded." : correct ? (wordsUsed <= 6 ? "Got it, fast." : wordsUsed <= 12 ? "Got it." : "Got there.") : "Right description, wrong card.";

  const sentence = gaveUp
    ? `Your card was the ${target.name}. ${guessedEntry ? `Jev was leaning ${guessedEntry.name} at ${pct(guessed!.p)} when you folded.` : "Jev never got a foothold."}`
    : correct
      ? `${wordsUsed} word${wordsUsed === 1 ? "" : "s"}. ${why ? `Mostly ${ASPECT_PHRASE[why.aspect]} gave it away.` : ""} ${
          tossUpName ? `For a moment it thought ${tossUpName} (${pct(tossUp!.p)}).` : ""
        }`
      : `What you wrote describes the ${guessedEntry?.name ?? "wrong component"}, and Jev buzzed on it at ${pct(guessed!.p)}. Your card, though, was the ${target.name}${
          evaluation ? `, which ${describeMiss(evaluation, target.id)}` : "."
        }`;

  return (
    <Card className="fade-in flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
        <Label>result · round {String(roundNumber).padStart(2, "0")}</Label>
        <Chip tone={won ? "green" : "red"} className="!text-[0.62rem] !px-1.5 !py-1">{won ? "correct" : gaveUp ? "folded" : "card mismatch"}</Chip>
      </div>

      <div className="px-4 pt-4">
        <h2 className={`h-display text-[clamp(1.6rem,2.8vw,2.3rem)] ${won ? "text-ink" : "text-red"}`}>{headline}</h2>
        <p className="mt-2 max-w-[64ch] text-[0.95rem] text-ink-2">{sentence}</p>
      </div>

      {result.description?.trim() ? (
        <div className="px-4 pt-4">
          <span className="label">your state</span>
          <p className="mt-1 text-[1.05rem] leading-snug">&ldquo;{result.description.trim()}&rdquo;</p>
        </div>
      ) : null}

      {/* Two panels when they differ: what Jev matched, and what your card was. One when they agree. */}
      <div className={`mx-4 mt-4 grid gap-3 ${!won && guessedEntry && guessedEntry.id !== target.id ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"}`}>
        {!won && guessedEntry && guessedEntry.id !== target.id ? (
          <ComponentPanel entry={guessedEntry} label="jev matched your description to" chip={<Chip tone="fill" className="!text-[0.66rem]">p {guessed!.p.toFixed(2)}</Chip>} />
        ) : null}
        {targetEntry ? (
          <ComponentPanel
            entry={targetEntry}
            label={won ? "your card" : "your card was"}
            tone={won ? "green" : "red"}
            chip={won ? <Chip tone="fill" className="!text-[0.66rem]">{wordsUsed} words</Chip> : <Chip tone="muted" className="!text-[0.66rem]">{targetEntry.name.length} letters</Chip>}
          />
        ) : null}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="label mr-1">why_matched</span>
          {why
            ? (Object.keys(WHY_OPTIONS) as WhyAspect[]).map((aspect) => (
                <Chip key={aspect} tone={aspect === why.aspect ? "fill" : "muted"} className="!text-[0.66rem]">
                  {aspect} {why.probabilities[aspect].toFixed(2)}
                </Chip>
              ))
            : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="mono text-[0.72rem] text-ink-3">
            {result.requests} call{result.requests === 1 ? "" : "s"} · ${result.costUsd.toFixed(5)}
          </span>
          <Button onClick={onNext} disabled={starting}>
            {starting ? "Dealing…" : "Next round"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ComponentPanel({ entry, label, chip, tone = "ink" }: { entry: CatalogEntry; label: string; chip?: React.ReactNode; tone?: "ink" | "green" | "red" }) {
  const category = entry.category as Category;
  const border = tone === "green" ? "border-green/50" : tone === "red" ? "border-red/40" : "border-line";
  return (
    <div className={`rounded-[5px] border ${border} bg-surface-2 p-3`}>
      <span className="label">{label}</span>
      <div className="mt-2 grid grid-cols-[56px_1fr] gap-3">
        <div className="holo flex aspect-[3/4] items-center justify-center rounded-[4px]">
          <span className="h-display text-[1.7rem] text-ink/80">{entry.name.charAt(0)}</span>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <Chip dot={CATEGORY_DOT[category]} className="!text-[0.66rem]">{CATEGORY_LABELS[category]}</Chip>
            {chip}
          </div>
          <h3 className="h-display mt-1.5 text-[1.2rem]">{entry.name}</h3>
          <p className="mt-0.5 text-[0.82rem] leading-snug text-ink-2">{entry.description}</p>
          {entry.aliases.length ? <p className="mono mt-1 text-[0.7rem] text-ink-3">aka {entry.aliases.slice(0, 4).join(", ")}</p> : null}
        </div>
      </div>
    </div>
  );
}

function describeMiss(evaluation: PublicEvaluation, targetId: string): string {
  const index = evaluation.ranking.findIndex((r) => r.id === targetId);
  if (index === -1) return "did not even make the top ten.";
  if (index === 1) return `was right behind at ${pct(evaluation.ranking[index].p)}.`;
  return `sat in ${ordinal(index + 1)} at ${pct(evaluation.ranking[index].p)}.`;
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
