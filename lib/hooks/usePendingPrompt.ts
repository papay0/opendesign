"use client";

import { useCallback } from "react";

const STORAGE_KEY = "opendesign_pending_prompt";
const EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface PendingPromptData {
  prompt: string;
  platform: "mobile" | "desktop";
  timestamp: number;
}

export function usePendingPrompt() {
  const savePendingPrompt = useCallback(
    (prompt: string, platform: "mobile" | "desktop" = "mobile") => {
      if (typeof window === "undefined") return;

      const data: PendingPromptData = {
        prompt,
        platform,
        timestamp: Date.now(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    },
    []
  );

  const getPendingPrompt = useCallback((): PendingPromptData | null => {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    try {
      const data = JSON.parse(stored) as PendingPromptData;

      // Expire after 24 hours to prevent stale prompts
      const isExpired = Date.now() - data.timestamp > EXPIRATION_MS;
      if (isExpired) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return data;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }, []);

  const clearPendingPrompt = useCallback(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    savePendingPrompt,
    getPendingPrompt,
    clearPendingPrompt,
  };
}
