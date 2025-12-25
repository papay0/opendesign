"use client";

/**
 * useBYOK Hook - Centralized BYOK (Bring Your Own Key) State Management
 *
 * Provides reactive state for detecting if a user has configured their own API key.
 * BYOK users get:
 * - All models unlocked (Flash + Pro)
 * - Unlimited messages (no quota consumption)
 * - No upgrade prompts or premium badges
 */

import { useState, useEffect, useCallback } from "react";

// ============================================================================
// Types
// ============================================================================

export type Provider = "openrouter" | "gemini";

export interface ApiConfig {
  key: string;
  provider: Provider;
}

export interface UseBYOKReturn {
  /** True if user has a valid API key configured */
  isBYOKActive: boolean;
  /** The configured provider, or null if not configured */
  provider: Provider | null;
  /** The full API config object, or null if not configured */
  apiConfig: ApiConfig | null;
  /** Clear the stored API config */
  clearApiConfig: () => void;
  /** Save a new API config */
  setApiConfig: (config: ApiConfig) => void;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = "opendesign_api_config";

// ============================================================================
// Helper Functions
// ============================================================================

function getStoredConfig(): ApiConfig | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    // Validate the structure
    if (parsed && typeof parsed.key === "string" && parsed.key.length > 0 && parsed.provider) {
      return parsed as ApiConfig;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useBYOK(): UseBYOKReturn {
  const [apiConfig, setApiConfigState] = useState<ApiConfig | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    setApiConfigState(getStoredConfig());
    setIsInitialized(true);
  }, []);

  // Listen for storage changes (e.g., from other tabs or settings page updates)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setApiConfigState(getStoredConfig());
      }
    };

    // Also listen for custom events (for same-tab updates)
    const handleCustomEvent = () => {
      setApiConfigState(getStoredConfig());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("byok-config-changed", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("byok-config-changed", handleCustomEvent);
    };
  }, []);

  const setApiConfig = useCallback((config: ApiConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setApiConfigState(config);
    // Dispatch custom event for same-tab listeners
    window.dispatchEvent(new CustomEvent("byok-config-changed"));
  }, []);

  const clearApiConfig = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setApiConfigState(null);
    // Dispatch custom event for same-tab listeners
    window.dispatchEvent(new CustomEvent("byok-config-changed"));
  }, []);

  return {
    isBYOKActive: isInitialized && !!apiConfig?.key,
    provider: apiConfig?.provider || null,
    apiConfig,
    clearApiConfig,
    setApiConfig,
  };
}

/**
 * Utility function to check BYOK status without the hook (for non-React contexts)
 * Useful in API calls or utility functions
 */
export function getApiConfig(): ApiConfig | null {
  return getStoredConfig();
}

/**
 * Check if BYOK is active (non-hook version)
 */
export function isBYOKEnabled(): boolean {
  const config = getStoredConfig();
  return !!config?.key;
}
