"use client";

import { useEffect, useRef } from "react";
import { ConfidenceDial } from "@/components/ConfidenceDial";
import { Describer } from "@/components/Describer";
import { Marginalia } from "@/components/Marginalia";
import { OddsBoard } from "@/components/OddsBoard";
import { RevealCard } from "@/components/RevealCard";
import { Button, CATEGORY_DOT, Chip } from "@/components/ui";
import { useCharades } from "@/hooks/useCharades";
import { CATEGORY_LABELS, getComponent, type Category } from "@/lib/catalog";
import { MIN_DESCRIPTION_CHARS } from "@/lib/jev/questions";
import type { CharadesVerdict } from "@/lib/game/verdict";

const PLACEHOLDERS = [
  "slides in at the corner, says something happened, and leaves before you can thank it",
  "is a little square that fills with a tick when you agree to things",
  "is the wide strip at the very top that nags everyone about cookies",
  "is a set of grey shapes that pretend to be the page while the page is still on its way",
];

type Tone = "idle" | "warn" | "lean" | "buzz";

function statusCopy(verdict: CharadesVerdict | null, pending: boolean, chars: number, bannedHit: string | null): { tone: Tone; text: string } {
  if (bannedHit) return { tone: "warn", text: `"${bannedHit}" is a banned word. Describe it, don't name it.` };
  if (chars < MIN_DESCRIPTION_CHARS) return { tone: "idle", text: "Waiting. Describe your card above and Jev will start betting." };
  if (!verdict) return { tone: "idle", text: pending ? "Evaluating…" : "Listening." };
  switch (verdict.kind) {
    case "not_a_component":
      return { tone: "warn", text: "not_a_component is winning. Describe the thing on the screen." };
    case "vague":
      return { tone: "idle", text: "Too vague to bet on. What does it do? Where does it live?" };
    case "listening":
      return { tone: "idle", text: `Listening. Faint lean toward ${getComponent(verdict.top.id)?.name ?? verdict.top.id}, no bet yet.` };
    case "leaning":
      return {
        tone: "lean",
        text: verdict.tossUp
          ? `Torn between ${getComponent(verdict.top.id)?.name} and ${getComponent(verdict.tossUp.id)?.name}. One more detail.`
          : `Leaning ${getComponent(verdict.top.id)?.name}. Not sure enough to buzz.`,
      };
    case "buzzed":
      return { tone: "buzz", text: "Buzz." };
  }
}

const TONE_CLASS: Record<Tone, string> = { idle: "text-ink-2", warn: "text-red", lean: "text-blue", buzz: "text-green" };

export function Charades() {
  const game = useCharades();
  const { state, wordsUsed, bannedPreview, lastResult, setText, startRound, giveUp } = game;
  const { round, phase, text, latest, pending, error, bannedHit, requests, spendUsd, best, history, startingRound } = state;

  // The game is the page: deal a card on mount. No cleanup on purpose;
  // strict mode double-invokes effects and the ref guard handles it.
  const dealt = useRef(false);
  useEffect(() => {
    if (dealt.current) return;
    dealt.current = true;
    queueMicrotask(() => void startRound());
  }, [startRound]);

  const evaluation = latest?.evaluation ?? null;
  const verdict = latest?.verdict ?? null;
  const showReveal = (phase === "buzzed" || phase === "revealed") && lastResult;
  const confidence = evaluation?.confidence ?? 0;
  const status = statusCopy(verdict, pending, text.trim().length, bannedHit);
  const placeholder = PLACEHOLDERS[(history.length + (round?.nameLength ?? 0)) % PLACEHOLDERS.length];
  const roundNumber = phase === "describing" ? history.length + 1 : Math.max(1, history.length);
  const topPick = evaluation?.ranking[0] ?? null;
  const category = round?.category as Category | undefined;
  // The first banned phrase is always the component's name. That is your card.
  const cardName = round?.phrases[0] ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <section className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
        {showReveal && lastResult ? (
          <RevealCard result={lastResult} evaluation={evaluation} onNext={startRound} starting={startingRound} roundNumber={roundNumber} />
        ) : (
          <Describer
            value={text}
            onChange={setText}
            disabled={phase !== "describing"}
            placeholder={placeholder}
            bannedHit={bannedHit}
            autoFocus
            title="state"
            titleRight={`round ${String(roundNumber).padStart(2, "0")}${best !== null ? ` · best ${best} words` : ""}`}
            header={
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_1fr] sm:gap-6">
                <div>
                  <span className="label">your card · jev can&rsquo;t see this</span>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="h-display text-[1.7rem]">{cardName ?? "Dealing…"}</span>
                    {category ? <Chip dot={CATEGORY_DOT[category]} className="!text-[0.66rem]">{CATEGORY_LABELS[category]}</Chip> : null}
                  </div>
                </div>
                <div className="min-w-0">
                  <span className="label">get jev to guess it without saying</span>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {bannedPreview.map((w) => (
                      <Chip key={w} tone={bannedHit && w.includes(bannedHit) ? "red" : "outline"} className="!text-[0.68rem]">
                        {w}
                      </Chip>
                    ))}
                    {bannedPreview.length ? <span className="text-[0.8rem] text-ink-3">or any part of those</span> : null}
                  </div>
                </div>
              </div>
            }
            lead="description · what you tell jev. it's the thing that…"
            status={
              <span className={TONE_CLASS[status.tone]}>
                <span className="mono mr-2 text-[0.72rem] text-ink-3">jev</span>
                {status.text}
                {pending ? <span className="blink ml-1">▍</span> : null}
                {error ? <span className="ml-3 text-red">{error}</span> : null}
              </span>
            }
            actions={
              <>
                <Chip tone="muted">{wordsUsed} word{wordsUsed === 1 ? "" : "s"}</Chip>
                <Button ghost arrow={null} onClick={giveUp} className="!py-1.5 !text-[0.78rem]">
                  Give up, show me
                </Button>
              </>
            }
          />
        )}

        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
          <ConfidenceDial
            confidence={confidence}
            buzzed={phase === "buzzed"}
            pick={topPick ? getComponent(topPick.id)?.name ?? topPick.id : null}
            pickP={topPick?.p ?? null}
            signals={evaluation?.signals ?? null}
          />
          <OddsBoard
            ranking={evaluation?.ranking ?? []}
            othersMass={evaluation?.othersMass ?? 0}
            notAComponent={evaluation?.notAComponent ?? 0}
            candidates={evaluation?.candidates ?? 135}
            answerId={showReveal ? lastResult?.target.id : null}
            idle={!evaluation}
          />
        </div>
      </section>

      <Marginalia latest={evaluation} requests={requests} spendUsd={spendUsd} />
    </div>
  );
}
