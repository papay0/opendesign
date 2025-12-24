"use client";

import { useState, useRef, useEffect } from "react";
import { DollarSign, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { UsageLog } from "@/lib/supabase/types";
import { formatCost, formatTokens } from "@/lib/constants/pricing";

interface CostIndicatorProps {
  usageLogs: UsageLog[];
  totalCost: number;
  isVisible: boolean;
}

export function CostIndicator({ usageLogs, totalCost, isVisible }: CostIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isExpanded]);

  if (!isVisible || usageLogs.length === 0) {
    return null;
  }

  const totalCachedTokens = usageLogs.reduce((sum, log) => sum + (log.cached_tokens || 0), 0);
  const hasCacheHits = totalCachedTokens > 0;

  return (
    <div className="relative" ref={popoverRef}>
      {/* Cost Badge */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors text-sm"
      >
        <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          {formatCost(totalCost)}
        </span>
        {hasCacheHits && (
          <span title="Cache hits detected">
            <Zap className="w-3 h-3 text-amber-500" />
          </span>
        )}
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        )}
      </button>

      {/* Expanded Breakdown Popover */}
      {isExpanded && (
        <div className="absolute bottom-full left-0 mb-2 w-80 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Generation Breakdown
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {usageLogs.length} generation{usageLogs.length !== 1 ? 's' : ''} this session
            </p>
          </div>

          {/* Scrollable list */}
          <div className="max-h-64 overflow-y-auto">
            {usageLogs.map((log, index) => (
              <div
                key={log.id || index}
                className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    #{index + 1}
                  </span>
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    {formatCost(log.total_cost)}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  {/* Input tokens */}
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Input</span>
                    <span>
                      {formatTokens(log.input_tokens)} tokens
                      <span className="text-zinc-400 dark:text-zinc-500 ml-1">
                        ({formatCost(log.input_cost)})
                      </span>
                    </span>
                  </div>

                  {/* Output tokens */}
                  <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Output</span>
                    <span>
                      {formatTokens(log.output_tokens)} tokens
                      <span className="text-zinc-400 dark:text-zinc-500 ml-1">
                        ({formatCost(log.output_cost)})
                      </span>
                    </span>
                  </div>

                  {/* Cached tokens (only show if > 0) */}
                  {log.cached_tokens > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Cached
                      </span>
                      <span>{formatTokens(log.cached_tokens)} tokens</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer with total */}
          <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                Session Total
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatCost(totalCost)}
              </span>
            </div>
            {hasCacheHits && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {formatTokens(totalCachedTokens)} tokens served from cache
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
