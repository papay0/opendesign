"use client";

import { Smartphone, Monitor } from "lucide-react";
import { type Platform, PLATFORM_CONFIG } from "@/lib/constants/platforms";

interface PlatformSelectorProps {
  selected: Platform;
  onChange: (platform: Platform) => void;
}

export function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-[#F5F2EE] rounded-lg">
      <button
        type="button"
        onClick={() => onChange("mobile")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          selected === "mobile"
            ? "bg-white text-[#1A1A1A] shadow-sm"
            : "text-[#9A9A9A] hover:text-[#6B6B6B]"
        }`}
        title={PLATFORM_CONFIG.mobile.description}
      >
        <Smartphone className="w-4 h-4" />
        <span>Mobile</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("desktop")}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
          selected === "desktop"
            ? "bg-white text-[#1A1A1A] shadow-sm"
            : "text-[#9A9A9A] hover:text-[#6B6B6B]"
        }`}
        title={PLATFORM_CONFIG.desktop.description}
      >
        <Monitor className="w-4 h-4" />
        <span>Desktop</span>
      </button>
    </div>
  );
}
