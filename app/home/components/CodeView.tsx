"use client";

import { useState, useEffect } from "react";
import type { ParsedScreen } from "./StreamingScreenPreview";
import { CodeFileSidebar } from "./CodeFileSidebar";
import { CodeViewer } from "./CodeViewer";
import { CodeViewToolbar } from "./CodeViewToolbar";

interface CodeViewProps {
  screens: ParsedScreen[];
  projectName: string;
}

export function CodeView({ screens, projectName }: CodeViewProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Auto-select first file when screens change
  useEffect(() => {
    if (screens.length > 0 && !selectedFile) {
      setSelectedFile(screens[0].name);
    }
    // If selected file was removed, select first available
    if (selectedFile && !screens.find((s) => s.name === selectedFile)) {
      setSelectedFile(screens.length > 0 ? screens[0].name : null);
    }
  }, [screens, selectedFile]);

  const selectedScreen = screens.find((s) => s.name === selectedFile);

  return (
    <div className="flex-1 flex flex-col bg-[#FAF8F5] overflow-hidden">
      <CodeViewToolbar screens={screens} projectName={projectName} />
      <div className="flex-1 flex overflow-hidden">
        <CodeFileSidebar
          screens={screens}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
        />
        <CodeViewer screen={selectedScreen} fileName={selectedFile} />
      </div>
    </div>
  );
}
