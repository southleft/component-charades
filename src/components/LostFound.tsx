"use client";

import { useState } from "react";
import { Describer } from "@/components/Describer";
import { Marginalia } from "@/components/Marginalia";
import { OddsBoard } from "@/components/OddsBoard";
import { Button, Card, CATEGORY_DOT, Chip, Label } from "@/components/ui";
import { useLostFound } from "@/hooks/useLostFound";
import { CATEGORY_LABELS, getComponent } from "@/lib/catalog";
import { EXISTS_ABSENT, EXISTS_FOUND, MIN_DESCRIPTION_CHARS, type WhyAspect } from "@/lib/jev/questions";
import type { LostFoundVerdict } from "@/lib/game/verdict";

const ASPECT_PHRASE: Record<WhyAspect, string> = {
  behavior: "how it behaves",
  appearance: "how it looks",
  placement: "where it sits",
  content: "what it holds",
};

const EXAMPLES = [
  "submits a form",
  "nags me gently to save my work",
  "shows three prices side by side",
  "tells me someone else is typing",
  "lets me pick a range of dates",
  "only exists while I'm hovering",
];

function verdictCopy(verdict: LostFoundVerdict, exists: number, topName: string | null) {
  switch (verdict) {
    case "found":
      return { head: "Found it.", body: `The library has this. exists_in_library is ${exists.toFixed(2)}; best match is the ${topName}.` };
    case "partial":
      return { head: "Close, but…", body: `Nearest thing is the ${topName}, but exists_in_library is only ${exists.toFixed(2)}. Jev suspects it isn't exactly what you meant.` };
    case "absent":
      return { head: "Doesn't exist yet.", body: `exists_in_library is ${exists.toFixed(2)}. Nothing here does this. Name it and it's yours.` };
    case "not_a_component":
      return { head: "Not a component.", body: "Jev thinks you're describing something other than a piece of interface." };
  }
}

export function LostFound() {
  const { text, setText, latest, pending, error, requests, spendUsd, coined, coinedFor, coin } = useLostFound();
  const [draftName, setDraftName] = useState("");

  const evaluation = latest?.evaluation ?? null;
  const verdict = latest?.verdict ?? null;
  const exists = evaluation?.exists ?? 0;
  const top = evaluation?.ranking[0] ?? null;
  const topEntry = top ? getComponent(top.id) : null;
  const alternatives = (evaluation?.ranking ?? []).slice(1, 4).filter((r) => r.p >= 0.08);
  const copy = verdict ? verdictCopy(verdict, exists, topEntry?.name ?? null) : null;
  const why = evaluation?.signals.why ?? null;
  const showCoin = verdict === "absent" && coinedFor !== text.trim();
  const meterTone = !evaluation ? "muted" : verdict === "found" ? "green" : verdict === "partial" ? "blue" : "red";
  const meterState = !evaluation ? "idle" : verdict === "found" ? "found" : verdict === "partial" ? "partial" : "lost";

  const statusText =
    text.trim().length < MIN_DESCRIPTION_CHARS
      ? "Say what it should do for you. You don't need to know what it's called."
      : pending && !copy
        ? "Evaluating…"
        : copy
          ? copy.body
          : "Listening.";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <section className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
        <Describer
          value={text}
          onChange={setText}
          placeholder="submits a form"
          bannedHit={null}
          autoFocus
          title="state"
          titleRight="library · 135 components"
          header={
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[0.9rem]">
              <span className="text-ink-2">Search the library by what you need, not what it&rsquo;s called. Try</span>
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => setText(ex)} className="chip !text-[0.68rem] hover:bg-surface-2">
                  {ex}
                </button>
              ))}
            </div>
          }
          lead="description · I need a component that…"
          status={
            <span className={verdict === "absent" || verdict === "not_a_component" ? "text-red" : verdict === "found" ? "text-green" : "text-ink-2"}>
              <span className="mono mr-2 text-[0.72rem] text-ink-3">jev</span>
              {statusText}
              {pending ? <span className="blink ml-1">▍</span> : null}
              {error ? <span className="ml-3 text-red">{error}</span> : null}
            </span>
          }
          actions={
            text.trim().length >= MIN_DESCRIPTION_CHARS ? (
              <Button ghost arrow={null} onClick={() => setText("")} className="!py-1.5 !text-[0.78rem]">
                Clear
              </Button>
            ) : null
          }
        >
          {copy && verdict !== "not_a_component" ? (
            <div className="fade-in border-t border-line px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className={`h-display text-[1.4rem] ${verdict === "absent" ? "text-red" : "text-ink"}`}>{copy.head}</h2>
                {alternatives.length && verdict !== "absent" ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="label">or</span>
                    {alternatives.map((r) => (
                      <Chip key={r.id} tone="muted" className="!text-[0.66rem]">
                        {getComponent(r.id)?.name} {r.p.toFixed(2)}
                      </Chip>
                    ))}
                  </div>
                ) : null}
              </div>

              {verdict !== "absent" && topEntry ? (
                <div className="mt-3 grid grid-cols-[56px_1fr] gap-3 rounded-[5px] border border-line bg-surface-2 p-3">
                  <div className="holo flex aspect-[3/4] items-center justify-center rounded-[4px]">
                    <span className="h-display text-[1.6rem] text-ink/80">{topEntry.name.charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      <Chip dot={CATEGORY_DOT[topEntry.category]} className="!text-[0.66rem]">{CATEGORY_LABELS[topEntry.category]}</Chip>
                      {top ? <Chip tone="fill" className="!text-[0.66rem]">p {top.p.toFixed(2)}</Chip> : null}
                      {why ? <Chip tone="muted" className="!text-[0.66rem]">matched on {ASPECT_PHRASE[why.aspect]}</Chip> : null}
                    </div>
                    <h3 className="h-display mt-1.5 text-[1.15rem]">{topEntry.name}</h3>
                    <p className="mt-0.5 text-[0.82rem] leading-snug text-ink-2">{topEntry.description}</p>
                    {topEntry.aliases.length ? <p className="mono mt-1 text-[0.7rem] text-ink-3">aka {topEntry.aliases.slice(0, 3).join(", ")}</p> : null}
                  </div>
                </div>
              ) : null}

              {verdict === "absent" ? (
                <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                  <p className="max-w-[46ch] text-[0.85rem] text-ink-2">
                    Nearest neighbour is the {topEntry?.name}
                    {top ? ` at p ${top.p.toFixed(2)}` : ""}, which isn&rsquo;t the same thing. Every design system started with someone noticing a gap.
                  </p>
                  {showCoin ? (
                    <form
                      className="flex items-end gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (draftName.trim()) coin(draftName.trim());
                      }}
                    >
                      <label className="flex flex-col gap-1">
                        <span className="label">christen it</span>
                        <input
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          placeholder="Nudge"
                          className="h-display w-[160px] border-b border-ink bg-transparent px-0 py-0.5 text-[1.2rem] !font-normal text-ink placeholder:text-ink-3/60 focus:outline-none"
                        />
                      </label>
                      <Button type="submit" arrow="+" className="!py-1.5 !text-[0.78rem]">
                        Add
                      </Button>
                    </form>
                  ) : (
                    <div className="fade-in rounded-[5px] border border-green/40 px-3 py-2">
                      <span className="label">newly christened</span>
                      <div className="h-display mt-0.5 text-[1.2rem] text-green">{coined}</div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
        </Describer>

        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3">
          <Card className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] divide-x divide-line">
            <div className="px-4 py-3">
              <Label right={<Chip tone={meterTone} className="!text-[0.62rem] !px-1.5 !py-1">{meterState}</Chip>}>noul · exists_in_library</Label>
              <div className="num mt-2 text-[3rem]">{evaluation ? exists.toFixed(2) : "—"}</div>
              <div className="relative mt-3">
                <div className="dist-track !h-[3px]">
                  <div
                    className="dist-fill"
                    style={{
                      width: `${Math.round(exists * 100)}%`,
                      background: exists >= EXISTS_FOUND ? "var(--green)" : exists >= EXISTS_ABSENT ? "var(--blue)" : "var(--red)",
                    }}
                  />
                </div>
                {[EXISTS_ABSENT, EXISTS_FOUND].map((mark) => (
                  <span key={mark} className="absolute -top-[5px] h-[13px] w-px bg-ink-3" style={{ left: `${mark * 100}%` }} aria-hidden />
                ))}
              </div>
              <div className="relative mt-1.5 h-4">
                <span className="label absolute left-0">lost</span>
                <span className="label absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${((EXISTS_ABSENT + EXISTS_FOUND) / 2) * 100}%` }}>partial</span>
                <span className="label absolute right-0">found</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <Label>instructions</Label>
              <p className="mono mt-2 text-[0.75rem] leading-relaxed text-ink-2">
                &ldquo;Does at least one of the components listed in <span className="text-ink">`library`</span> fit the need described in{" "}
                <span className="text-ink">`description`</span>?&rdquo;
              </p>
              <p className="mt-2 text-[0.8rem] leading-snug text-ink-2">
                The Choice below always puts its mass somewhere, so it can never say &ldquo;none of these&rdquo;. This Noul is the question that can.
              </p>
            </div>
          </Card>
          <OddsBoard
            ranking={evaluation?.ranking ?? []}
            othersMass={evaluation?.othersMass ?? 0}
            notAComponent={evaluation?.notAComponent ?? 0}
            candidates={evaluation?.candidates ?? 135}
            idle={!evaluation}
          />
        </div>
      </section>

      <Marginalia latest={evaluation} requests={requests} spendUsd={spendUsd} />
    </div>
  );
}
