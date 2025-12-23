"use client";

/**
 * Dashboard Page
 *
 * The main authenticated view showing:
 * - Welcome message
 * - Quick action to create new project
 * - List of existing projects
 * - API key setup prompt if not configured
 *
 * Design: Editorial/Magazine aesthetic
 * - Warm white background (#FAF8F5)
 * - Terracotta accent (#B8956F)
 * - Playfair Display serif for headings
 *
 * Projects are fetched from Supabase and filtered by user ID.
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Clock,
  ArrowRight,
  Key,
  Loader2,
  FolderOpen,
  Trash2,
  Smartphone,
  Monitor,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/supabase/types";
import { PlatformSelector } from "./components/PlatformSelector";
import { DashboardSkeleton } from "./components/Skeleton";
import { ImageUploadButton } from "./components/ImageUploadButton";
import { ImageLightbox, ClickableImage } from "./components/ImageLightbox";
import type { Platform } from "@/lib/constants/platforms";
import {
  validateImage,
  uploadImage,
} from "@/lib/upload/image-upload";

// ============================================================================
// Animation Variants
// ============================================================================

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

// ============================================================================
// Helper: Check if API key is configured
// ============================================================================

function getStoredApiKey(): { key: string; provider: string } | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem("opendesign_api_config");
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// ============================================================================
// Component: API Key Banner
// Prompts user to configure their API key if not set
// ============================================================================

function ApiKeyBanner() {
  const router = useRouter();

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="bg-[#FEF3E7] border border-[#F5D5B5] rounded-2xl p-6 mb-8"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#B8956F]/20 flex items-center justify-center flex-shrink-0">
          <Key className="w-5 h-5 text-[#B8956F]" />
        </div>
        <div className="flex-1">
          <h3 className="font-serif text-lg text-[#1A1A1A] mb-1">
            Set up your API key
          </h3>
          <p className="text-sm text-[#6B6B6B] mb-4">
            OpenDesign uses your own API key (BYOK) to generate designs. Configure
            your OpenRouter or Google Gemini key to get started.
          </p>
          <button
            onClick={() => router.push("/home/settings")}
            className="inline-flex items-center gap-2 text-sm bg-[#B8956F] hover:bg-[#A6845F] text-white px-4 py-2 rounded-lg transition-colors"
          >
            Configure API Key
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Component: Project Card
// Displays a single project with preview and actions
// ============================================================================

function ProjectCard({
  project,
  onDelete,
}: {
  project: Project;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project?")) return;

    setIsDeleting(true);
    await onDelete(project.id);
  };

  const formattedDate = new Date(project.updated_at).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year:
        new Date(project.updated_at).getFullYear() !== new Date().getFullYear()
          ? "numeric"
          : undefined,
    }
  );

  return (
    <motion.div
      variants={fadeInUp}
      className="group relative bg-white border border-[#E8E4E0] hover:border-[#D4CFC9] rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-sm"
      onClick={() => router.push(`/home/projects/${project.id}`)}
    >
      {/* Preview area with emoji icon */}
      <div className="aspect-[4/3] bg-[#F5F2EF] flex items-center justify-center border-b border-[#E8E4E0] relative">
        <span className="text-6xl">{project.icon || "📱"}</span>
        {/* Platform indicator */}
        <div className="absolute top-2 right-2">
          {project.platform === "desktop" ? (
            <Monitor className="w-4 h-4 text-[#9A9A9A]" />
          ) : (
            <Smartphone className="w-4 h-4 text-[#9A9A9A]" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-[#1A1A1A] truncate mb-1">{project.name}</h3>
        <p className="text-sm text-[#9A9A9A] truncate mb-3">
          {project.app_idea || "No description"}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#9A9A9A] flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formattedDate}
          </span>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 text-[#9A9A9A] hover:text-red-500 p-1 rounded transition-all"
            title="Delete project"
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Component: Prompt Input
// Inline prompt input for quick project creation with platform selection
// ============================================================================

function PromptInput({
  onSubmit,
  isLoading,
  userId,
}: {
  onSubmit: (prompt: string, platform: Platform, imageUrl: string | null) => Promise<void>;
  isLoading: boolean;
  userId: string;
}) {
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState<Platform>("mobile");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isPasting, setIsPasting] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  // Generate a temporary project ID for uploading before project creation
  const [tempProjectId] = useState(() => crypto.randomUUID());

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;
    const submittedPrompt = prompt.trim();
    const submittedImageUrl = imageUrl;
    setPrompt(""); // Clear input immediately
    setImageUrl(null); // Clear image
    await onSubmit(submittedPrompt, platform, submittedImageUrl);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Find image in clipboard
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault(); // Prevent default paste behavior for images

        const file = item.getAsFile();
        if (!file) return;

        // Validate
        const validationError = validateImage(file);
        if (validationError) {
          alert(validationError.message);
          return;
        }

        // Upload
        setIsPasting(true);
        try {
          const result = await uploadImage(file, userId, tempProjectId);
          setImageUrl(result.url);
        } catch (err) {
          alert(err instanceof Error ? err.message : "Upload failed");
        } finally {
          setIsPasting(false);
        }
        return;
      }
    }
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="group/card relative bg-white rounded-3xl mb-8 shadow-[0_4px_24px_-4px_rgba(184,149,111,0.15)] hover:shadow-[0_8px_32px_-4px_rgba(184,149,111,0.2)] transition-shadow duration-500"
    >
      {/* Subtle gradient border effect */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#E8E4E0] to-[#D4CFC9]/50 p-px">
        <div className="h-full w-full rounded-3xl bg-white" />
      </div>

      {/* Content */}
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif text-2xl text-[#1A1A1A] tracking-tight">
              What would you like to design?
            </h2>
            <p className="text-sm text-[#9A9A9A] mt-0.5">Describe your vision and let AI bring it to life</p>
          </div>
          <PlatformSelector selected={platform} onChange={setPlatform} />
        </div>

        {/* Image preview - elegant card when attached */}
        {imageUrl && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-[#FAF8F5] to-[#F5F2EF] rounded-2xl border border-[#E8E4E0]">
              <div className="relative">
                <ClickableImage
                  src={imageUrl}
                  alt="Reference"
                  className="w-16 h-16 rounded-xl shadow-sm ring-2 ring-white overflow-hidden"
                  onClick={() => setLightboxImage(imageUrl)}
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#B8956F] rounded-full flex items-center justify-center shadow-sm pointer-events-none">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1A1A]">Style reference attached</p>
                <p className="text-xs text-[#9A9A9A]">Click to preview • AI will match this aesthetic</p>
              </div>
              <button
                onClick={() => setImageUrl(null)}
                className="text-xs text-[#9A9A9A] hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-white transition-all border border-transparent hover:border-red-100"
                type="button"
              >
                Remove
              </button>
            </div>
          </motion.div>
        )}

        {/* Input area */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              platform === "mobile"
                ? "A fitness tracking app with workout logs, progress charts, and a motivating design..."
                : "A modern SaaS landing page with bold typography, feature highlights, and social proof..."
            }
            rows={3}
            disabled={isPasting}
            className="w-full bg-[#FAF8F5] rounded-2xl px-5 py-4 text-[#1A1A1A] placeholder-[#B5B0A8] focus:outline-none focus:ring-2 focus:ring-[#B8956F]/20 focus:bg-white resize-none transition-all border border-[#E8E4E0] focus:border-[#B8956F]/30 disabled:opacity-60"
          />
          {/* Paste upload overlay */}
          {isPasting && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <div className="flex items-center gap-2 text-[#B8956F]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Uploading image...</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom toolbar with subtle separator */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E8E4E0]/60">
          <div className="flex items-center gap-3">
            {/* Hide upload button when image is attached (shown in preview card above) */}
            {!imageUrl && (
              <ImageUploadButton
                userId={userId}
                projectId={tempProjectId}
                onImageUploaded={setImageUrl}
                onImageRemoved={() => setImageUrl(null)}
                currentImageUrl={null}
                disabled={isLoading}
              />
            )}
            {!imageUrl && (
              <span className="text-xs text-[#B5B0A8] hidden sm:block">Add a style reference or paste an image</span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isLoading}
            className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#B8956F] to-[#A6845F] text-white font-medium px-6 py-3 rounded-xl hover:from-[#A6845F] hover:to-[#957555] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:shadow-[#B8956F]/20 active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Design it</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      <ImageLightbox
        src={lightboxImage}
        onClose={() => setLightboxImage(null)}
      />
    </motion.div>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Check for API key on mount
  useEffect(() => {
    const apiConfig = getStoredApiKey();
    setHasApiKey(!!apiConfig?.key);
  }, []);

  // Fetch projects on mount
  useEffect(() => {
    if (!isLoaded || !user) return;

    // Capture user.id to avoid closure issues with TypeScript
    const userId = user.id;

    async function fetchProjects() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
      } else {
        setProjects(data || []);
      }

      setIsLoading(false);
    }

    fetchProjects();
  }, [isLoaded, user]);

  // Create new project from prompt
  const handleCreateProject = async (prompt: string, platform: Platform, imageUrl: string | null) => {
    if (!user) return;

    setIsCreating(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: "Untitled Project",
        app_idea: prompt,
        platform: platform,
        initial_image_url: imageUrl,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project. Please try again.");
      setIsCreating(false);
      return;
    }

    // Navigate to the new project
    router.push(`/home/projects/${data.id}`);
  };

  // Delete project
  const handleDeleteProject = async (projectId: string) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      console.error("Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  // Loading state
  if (!isLoaded || isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Welcome Header */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        className="mb-8"
      >
        <h1 className="font-serif text-4xl text-[#1A1A1A] mb-2">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
        </h1>
        <p className="text-[#6B6B6B]">
          Create beautiful designs with AI
        </p>
      </motion.div>

      {/* API Key Banner (if not configured) */}
      {!hasApiKey && <ApiKeyBanner />}

      {/* Prompt Input (only show if API key is configured) */}
      {hasApiKey && user && (
        <PromptInput onSubmit={handleCreateProject} isLoading={isCreating} userId={user.id} />
      )}

      {/* Projects Section */}
      <div>
        <h2 className="font-serif text-2xl text-[#1A1A1A] mb-6">Your Projects</h2>

        {projects.length === 0 ? (
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-[#F5F2EF] flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-[#D4CFC9]" />
            </div>
            <p className="text-[#6B6B6B]">
              No projects yet. Describe your app idea above to get started!
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleteProject}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
