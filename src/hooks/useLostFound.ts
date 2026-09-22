"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEBOUNCE_MS, MIN_DESCRIPTION_CHARS } from "@/lib/jev/questions";
import type { GuessError, LostFoundGuessResponse } from "@/lib/game/types";

export function useLostFound() {
  const [text, setText] = useState("");
  const [latest, setLatest] = useState<LostFoundGuessResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState(0);
  const [spendUsd, setSpendUsd] = useState(0);
  /** The name the player gives to a component that does not exist yet. */
  const [coined, setCoined] = useState("");
  const [coinedFor, setCoinedFor] = useState<string | null>(null);

  const controller = useRef<AbortController | null>(null);

  const search = useCallback(async (description: string) => {
    controller.current?.abort();
    const ctrl = new AbortController();
    controller.current = ctrl;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description, mode: "lostfound" }),
        signal: ctrl.signal,
      });
      if (ctrl.signal.aborted) return;
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as GuessError | null;
        throw new Error(payload?.error ?? `request failed (${res.status})`);
      }
      const payload = (await res.json()) as LostFoundGuessResponse;
      setRequests((n) => n + 1);
      setSpendUsd((s) => s + payload.evaluation.costUsd);
      setLatest(payload);
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setError(err instanceof Error ? err.message : "something went wrong");
    } finally {
      if (controller.current === ctrl) {
        controller.current = null;
        setPending(false);
      }
    }
  }, []);

  const handleTextChange = useCallback((value: string) => {
    setText(value);
    if (value.trim().length < MIN_DESCRIPTION_CHARS) {
      controller.current?.abort();
      controller.current = null;
      setPending(false);
      setLatest(null);
    }
  }, []);

  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed.length < MIN_DESCRIPTION_CHARS) return;
    const timer = setTimeout(() => void search(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, search]);

  const coin = useCallback(
    (name: string) => {
      setCoined(name);
      setCoinedFor(text.trim());
    },
    [text],
  );

  return {
    text,
    setText: handleTextChange,
    latest,
    pending,
    error,
    requests,
    spendUsd,
    coined,
    coinedFor,
    coin,
  };
}
