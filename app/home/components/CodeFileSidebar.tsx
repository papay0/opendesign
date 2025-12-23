"use client";

import { FileCode2, ChevronDown, Folder } from "lucide-react";
import type { ParsedScreen } from "./StreamingScreenPreview";

interface CodeFileSidebarProps {
  screens: ParsedScreen[];
  selectedFile: string | null;
  onSelectFile: (name: string) => void;
}

// Convert screen name to filename (e.g., "Home Screen" -> "home-screen.html")
export function toFileName(screenName: string): string {
  return (
    screenName
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "") + ".html"
  );
}

export function CodeFileSidebar({
  screens,
  selectedFile,
  onSelectFile,
}: CodeFileSidebarProps) {
  return (
    <div className="w-56 bg-white border-r border-[#E8E4E0] flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 text-xs font-medium text-[#6B6B6B] uppercase tracking-wider flex items-center gap-2 border-b border-[#E8E4E0]">
        <ChevronDown className="w-3 h-3" />
        Explorer
      </div>

      {/* Folder */}
      <div className="px-2 py-2">
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-[#1A1A1A] font-medium">
          <Folder className="w-4 h-4 text-[#B8956F]" />
          <span>screens</span>
        </div>

        {/* Files */}
        <div className="ml-4">
          {screens.map((screen) => {
            const fileName = toFileName(screen.name);
            const isSelected = selectedFile === screen.name;

            return (
              <button
                key={screen.name}
                onClick={() => onSelectFile(screen.name)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-lg transition-colors ${
                  isSelected
                    ? "bg-[#F5F2EF] text-[#1A1A1A] font-medium"
                    : "text-[#6B6B6B] hover:bg-[#FAF8F5] hover:text-[#1A1A1A]"
                }`}
              >
                <FileCode2 className="w-4 h-4 text-[#B8956F] flex-shrink-0" />
                <span className="truncate">{fileName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {screens.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-[#9A9A9A]">No screens generated yet</p>
        </div>
      )}
    </div>
  );
}
