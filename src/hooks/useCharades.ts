"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bannedWordsFor, findBannedWord, getComponent } from "@/lib/catalog";
import { DEBOUNCE_MS, MIN_DESCRIPTION_CHARS } from "@/lib/jev/questions";
import {
  countWords,
  type CharadesGuessResponse,
  type GuessError,
  type RoundInfo,
  type RoundPhase,
  type RoundResult,
} from "@/lib/game/types";

const BEST_KEY = "component-charades:best";

export interface CharadesState {
  round: RoundInfo | null;
  phase: RoundPhase;
  text: string;
  latest: CharadesGuessResponse | null;
  pending: boolean;
  error: string | null;
  bannedHit: string | null;
  requests: number;
  spendUsd: number;
  history: RoundResult[];
  best: number | null;
  startingRound: boolean;
}

export function useCharades() {
  const [round, setRound] = useState<RoundInfo | null>(null);
  const [phase, setPhase] = useState<RoundPhase>("idle");
  const [text, setText] = useState("");
  const [latest, setLatest] = useState<CharadesGuessResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bannedHit, setBannedHit] = useState<string | null>(null);
  const [requests, setRequests] = useState(0);
  const [spendUsd, setSpendUsd] = useState(0);
  const [history, setHistory] = useState<RoundResult[]>([]);
  const [best, setBest] = useState<number | null>(null);
  const [startingRound, setStartingRound] = useState(false);

  const controller = useRef<AbortController | null>(null);
  const roundRequests = useRef(0);
  const roundSpend = useRef(0);

  const abort = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    setPending(false);
  }, []);

  const startRound = useCallback(async () => {
    abort();
    // Personal best lives in localStorage; read it on the first user action so
    // server and client render the same thing before anyone has clicked.
    const stored = window.localStorage.getItem(BEST_KEY);
    if (stored) setBest(Number(stored));
    setStartingRound(true);
    setError(null);
    setBannedHit(null);
    setLatest(null);
    setText("");
    roundRequests.current = 0;
    roundSpend.current = 0;
    try {
      const res = await fetch("/api/round", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ exclude: history.map((h) => h.target.id) }),
      });
      if (!res.ok) throw new Error(`could not start a round (${res.status})`);
      const info = (await res.json()) as RoundInfo;
      setRound(info);
      setPhase("describing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not start a round");
    } finally {
      setStartingRound(false);
    }
  }, [abort, history]);

  const finishRound = useCallback(
    (result: RoundResult) => {
      setHistory((h) => [result, ...h]);
      if (result.correct && !result.gaveUp) {
        setBest((b) => {
          const next = b === null ? result.wordsUsed : Math.min(b, result.wordsUsed);
          window.localStorage.setItem(BEST_KEY, String(next));
          return next;
        });
      }
    },
    [],
  );

  const guess = useCallback(
    async (description: string) => {
      if (!round) return;
      controller.current?.abort();
      const ctrl = new AbortController();
      controller.current = ctrl;
      setPending(true);
      setError(null);
      try {
        const res = await fetch("/api/guess", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ description, mode: "charades", round: round.token }),
          signal: ctrl.signal,
        });
        if (ctrl.signal.aborted) return;
        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as GuessError | null;
          if (payload?.word) {
            setBannedHit(payload.word);
            return;
          }
          throw new Error(payload?.error ?? `request failed (${res.status})`);
        }
        const payload = (await res.json()) as CharadesGuessResponse;
        roundRequests.current += 1;
        roundSpend.current += payload.evaluation.costUsd;
        setRequests((n) => n + 1);
        setSpendUsd((s) => s + payload.evaluation.costUsd);
        setLatest(payload);
        if (payload.verdict.kind === "buzzed") {
          setPhase("buzzed");
          finishRound({
            target: payload.verdict.target,
            correct: payload.verdict.correct,
            wordsUsed: countWords(description),
            requests: roundRequests.current,
            costUsd: roundSpend.current,
            guessed: payload.verdict.top,
            tossUp: payload.verdict.tossUp,
            gaveUp: false,
            description,
          });
        }
      } catch (err) {
        if (ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : "something went wrong");
      } finally {
        if (controller.current === ctrl) {
          controller.current = null;
          setPending(false);
        }
      }
    },
    [round, finishRound],
  );

  // Typing is an event, so the cheap local checks (length, banned words) and
  // the abort of any in-flight request happen here, synchronously, with no
  // round trip. The effect below only owns the debounce timer.
  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);
      if (!round) return;
      const trimmed = value.trim();
      if (trimmed.length < MIN_DESCRIPTION_CHARS) {
        abort();
        setBannedHit(null);
        return;
      }
      const banned = findBannedWord(trimmed, round.banned);
      if (banned) abort();
      setBannedHit(banned);
    },
    [round, abort],
  );

  useEffect(() => {
    if (phase !== "describing" || !round || bannedHit) return;
    const trimmed = text.trim();
    if (trimmed.length < MIN_DESCRIPTION_CHARS) return;
    const timer = setTimeout(() => void guess(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, phase, round, bannedHit, guess]);

  const giveUp = useCallback(async () => {
    if (!round || phase !== "describing") return;
    abort();
    try {
      const res = await fetch(`/api/round?token=${encodeURIComponent(round.token)}`);
      if (!res.ok) throw new Error("could not reveal");
      const { target } = (await res.json()) as {
        target: RoundResult["target"];
      };
      setPhase("revealed");
      finishRound({
        target,
        correct: false,
        wordsUsed: countWords(text),
        requests: roundRequests.current,
        costUsd: roundSpend.current,
        guessed: latest?.evaluation.ranking[0] ?? null,
        tossUp: null,
        gaveUp: true,
        description: text,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "could not reveal");
    }
  }, [round, phase, abort, finishRound, text, latest]);

  const wordsUsed = useMemo(() => countWords(text), [text]);
  const targetBannedPreview = useMemo(() => {
    if (!round) return [];
    // Show the readable phrases; the stemmed word list stays server/local logic.
    // The name itself is shown separately as the card, so start from the aliases.
    return round.phrases.map((p) => p.toLowerCase()).slice(1, 7);
  }, [round]);

  const lastResult = history[0] ?? null;
  const lastTarget = lastResult ? getComponent(lastResult.target.id) : null;
  const lastTargetBanned = lastTarget ? bannedWordsFor(lastTarget) : [];

  return {
    state: {
      round,
      phase,
      text,
      latest,
      pending,
      error,
      bannedHit,
      requests,
      spendUsd,
      history,
      best,
      startingRound,
    } satisfies CharadesState,
    wordsUsed,
    bannedPreview: targetBannedPreview,
    lastResult,
    lastTargetBanned,
    setText: handleTextChange,
    startRound,
    giveUp,
  };
}
