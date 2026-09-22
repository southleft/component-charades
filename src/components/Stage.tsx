"use client";

import { useState } from "react";
import { Charades } from "@/components/Charades";
import { LostFound } from "@/components/LostFound";
import type { Mode } from "@/lib/jev/questions";

const MODES: { id: Mode; label: string; glyph: string; blurb: string }[] = [
  { id: "charades", label: "Play Charades", glyph: "◐", blurb: "You're dealt a component. Get Jev to guess it without using its name." },
  { id: "lostfound", label: "Find a component", glyph: "⌕", blurb: "Describe a job. Jev finds the component in the library." },
];

export function Stage() {
  const [mode, setMode] = useState<Mode>("charades");
  const active = MODES.find((m) => m.id === mode)!;

  return (
    <div className="grid min-h-svh grid-cols-1 lg:h-svh lg:grid-cols-[216px_1fr] lg:overflow-hidden">
      {/* Sidebar, like the console's. */}
      <aside className="flex flex-col border-b border-line bg-surface px-3 py-3 lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="holo inline-block h-4 w-4 rounded-[3px]" aria-hidden />
          <span className="mono text-[0.72rem] font-semibold tracking-[0.08em]">CHARADES</span>
          <span className="label ml-auto">v0.1</span>
        </div>
        <nav className="mt-4 flex flex-col gap-0.5" aria-label="Mode">
          {MODES.map((m) => (
            <button key={m.id} type="button" className="nav-item" onClick={() => setMode(m.id)} aria-pressed={mode === m.id}>
              <span className="mono w-4 text-center text-[0.8rem]">{m.glyph}</span>
              {m.label}
            </button>
          ))}
          <a className="nav-item" href="https://docs.typesafe.ai/introduction" target="_blank" rel="noreferrer">
            <span className="mono w-4 text-center text-[0.8rem]">↗</span>
            Jev docs
          </a>
        </nav>

        <div className="mt-6 px-2">
          <span className="label">How it works</span>
          <p className="mt-1.5 text-[0.8rem] leading-relaxed text-ink-2">
            It&rsquo;s Taboo. You see the card; Jev doesn&rsquo;t. Jev only ever receives what you type as{" "}
            <span className="mono">state</span> and answers typed questions with probabilities. When it&rsquo;s sure enough, it buzzes.
          </p>
        </div>

        <div className="mt-auto px-2 pt-6">
          <span className="label">Model</span>
          <p className="mono mt-1 text-[0.75rem] text-ink-2">jev-1.13 · $0.042 / Mtok</p>
          <p className="mono text-[0.75rem] text-ink-2">136 options per choice</p>
        </div>
      </aside>

      <div className="flex min-h-0 flex-col">
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 px-6 pb-3 pt-5">
          <div>
            <span className="label">{mode === "charades" ? "charades · one request per keystroke" : "component finder · one request per keystroke"}</span>
            <h1 className="h-display mt-1 text-[1.75rem]">{active.label}</h1>
          </div>
          <p className="max-w-[52ch] text-[0.85rem] text-ink-2">{active.blurb}</p>
        </header>

        <main className="flex min-h-0 flex-1 flex-col gap-3 px-6 pb-5">
          {mode === "charades" ? <Charades key="charades" /> : <LostFound key="lostfound" />}
        </main>
      </div>
    </div>
  );
}
