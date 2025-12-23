"use client";

import { useState } from "react";
import { Copy, Check, Download, FolderArchive, Loader2 } from "lucide-react";
import type { ParsedScreen } from "./StreamingScreenPreview";
import { toFileName } from "./CodeFileSidebar";

interface CodeViewToolbarProps {
  screens: ParsedScreen[];
  projectName: string;
}

export function CodeViewToolbar({ screens, projectName }: CodeViewToolbarProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopyAll = async () => {
    const allHtml = screens
      .map((s) => `<!-- ${s.name} (${toFileName(s.name)}) -->\n${s.html}`)
      .join("\n\n" + "=".repeat(80) + "\n\n");
    await navigator.clipboard.writeText(allHtml);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadZip = async () => {
    setDownloading(true);
    try {
      // Dynamic import JSZip to keep bundle small
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Add each screen as a file
      screens.forEach((screen) => {
        zip.file(toFileName(screen.name), screen.html);
      });

      // Generate and download
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")}-screens.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to create ZIP:", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="h-12 bg-white border-b border-[#E8E4E0] flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-2">
        <FolderArchive className="w-4 h-4 text-[#B8956F]" />
        <span className="text-sm text-[#6B6B6B]">
          {screens.length} screen{screens.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleCopyAll}
          disabled={screens.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F5F2EF] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {copiedAll ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          Copy All
        </button>

        <button
          onClick={handleDownloadZip}
          disabled={screens.length === 0 || downloading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#B8956F] text-white hover:bg-[#A6845F] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {downloading ? "Creating ZIP..." : "Download ZIP"}
        </button>
      </div>
    </div>
  );
}
