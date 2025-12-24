"use client";

/**
 * Model Selector Component
 *
 * A compact dropdown for selecting AI models.
 * Admin-only feature for choosing between Gemini 3 Pro and Flash.
 */

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Cpu, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ============================================================================
// Types and Constants
// ============================================================================

export const AVAILABLE_MODELS = [
  {
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    shortName: "Pro",
    description: "Best quality",
    icon: Cpu,
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    shortName: "Flash",
    description: "Faster, cheaper",
    icon: Zap,
  },
] as const;

export type ModelId = typeof AVAILABLE_MODELS[number]["id"];

const MODEL_STORAGE_KEY = "opendesign_selected_model";

// ============================================================================
// Helper Functions
// ============================================================================

export function getSelectedModel(): ModelId {
  if (typeof window === "undefined") return "gemini-3-pro-preview";
  const stored = localStorage.getItem(MODEL_STORAGE_KEY);
  if (stored && AVAILABLE_MODELS.some((m) => m.id === stored)) {
    return stored as ModelId;
  }
  return "gemini-3-pro-preview";
}

export function setSelectedModel(model: ModelId): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MODEL_STORAGE_KEY, model);
}

// ============================================================================
// Model Selector Component
// ============================================================================

interface ModelSelectorProps {
  value: ModelId;
  onChange: (model: ModelId) => void;
  compact?: boolean;
}

export function ModelSelector({ value, onChange, compact = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = AVAILABLE_MODELS.find((m) => m.id === value) || AVAILABLE_MODELS[0];
  const Icon = selectedModel.icon;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (modelId: ModelId) => {
    onChange(modelId);
    setSelectedModel(modelId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F2EF] rounded-lg transition-colors ${
          compact ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm"
        }`}
      >
        <Icon className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
        <span className="font-medium">{compact ? selectedModel.shortName : selectedModel.name}</span>
        <ChevronDown
          className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"} transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-xl border border-[#E8E4E0] shadow-lg overflow-hidden z-50"
          >
            <div className="p-1">
              {AVAILABLE_MODELS.map((model) => {
                const ModelIcon = model.icon;
                const isSelected = value === model.id;

                return (
                  <button
                    key={model.id}
                    onClick={() => handleSelect(model.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? "bg-[#F5F2EF]"
                        : "hover:bg-[#FAF8F5]"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? "bg-[#B8956F] text-white"
                          : "bg-[#F5F2EF] text-[#6B6B6B]"
                      }`}
                    >
                      <ModelIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A]">{model.name}</p>
                      <p className="text-xs text-[#9A9A9A]">{model.description}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#B8956F] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
