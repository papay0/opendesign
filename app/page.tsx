"use client";

/**
 * OpenDesign Landing Page
 *
 * Design: Editorial/Magazine Aesthetic
 *
 * A refined, publication-quality landing page inspired by design magazines
 * like Bloomberg Businessweek and Stripe Press. Features elegant serif
 * typography, generous whitespace, and a warm, sophisticated color palette.
 *
 * Key design principles:
 * - Typography as the hero element
 * - Warm white background with terracotta accent
 * - Asymmetric layouts for visual interest
 * - Subtle, refined animations
 * - No gradients, glows, or decorative effects
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Pencil,
  Code2,
  ArrowRight,
  Github,
  Menu,
  X,
  Layers,
  Check,
  Crown,
  Zap,
  MessageSquare,
  Dumbbell,
  ChefHat,
  Plane,
  Music,
  Play,
  MousePointerClick,
  LucideIcon,
} from "lucide-react";
import { PLANS, MESSAGE_PACK } from "@/lib/constants/plans";
import { usePendingPrompt } from "@/lib/hooks/usePendingPrompt";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { PlatformSelector } from "@/app/home/components/PlatformSelector";
import { type Platform } from "@/lib/constants/platforms";

// ============================================================================
// Animation Variants
// Subtle, refined animations that don't distract
// ============================================================================

const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

// ============================================================================
// Data
// ============================================================================

// Supabase public assets URL
const SUPABASE_ASSETS = "https://xqpuvtopszitdtittjao.supabase.co/storage/v1/object/public/public-assets/images";

const features = [
  {
    icon: MousePointerClick,
    title: "Real Navigation, Not Mockups",
    description:
      "Click buttons. Tap links. Navigate between screens. Your prototype works like the real thing.",
  },
  {
    icon: Play,
    title: "Test It in Play Mode",
    description:
      "Enter full-screen Play mode and experience your app. Find UX issues before you write any code.",
  },
  {
    icon: Sparkles,
    title: "Watch It Generate Live",
    description:
      "See your screens appear in real-time as the AI builds them. No waiting, no refreshing.",
  },
];

// ============================================================================
// Example Prompts with Rich Data - Separate Mobile and Desktop versions
// ============================================================================

interface ExamplePrompt {
  label: string;
  styleTag: string;
  description: {
    mobile: string;
    desktop: string;
  };
  icon: LucideIcon;
  fullPrompt: {
    mobile: string;
    desktop: string;
  };
}

const examplePrompts: ExamplePrompt[] = [
  {
    label: "Fitness Tracker",
    styleTag: "Warm Gradients",
    description: {
      mobile: "Activity rings, workout cards, progress charts",
      desktop: "Dashboard analytics, workout calendar, progress graphs",
    },
    icon: Dumbbell,
    fullPrompt: {
      mobile: `Personal fitness app. Daily activity rings showing steps, calories burned, and active minutes. Workout history displayed as cards with exercise type icons, duration, and intensity level. Weekly progress line chart with smooth curves. Achievement badges collection and current streak counter with flame icon.

Also create the workout detail screen and profile screen.

Warm gradient aesthetic. Soft coral (#FF8A80) and peach gradients transitioning to warm orange. Large rounded progress indicators with satisfying fill animations. Friendly rounded sans-serif typography. Organic blob shapes in background, motivational quotes section.`,
      desktop: `Personal fitness dashboard website. Hero section with large activity summary showing steps, calories, and active minutes as animated circular progress rings. Left sidebar navigation with user profile avatar. Main content area with workout calendar view showing completed workouts as colored dots. Detailed analytics section with line charts for weekly/monthly trends. Workout library displayed as a filterable grid of exercise cards with hover effects.

Also create the workout detail page and settings page.

Warm gradient aesthetic. Soft coral (#FF8A80) and peach gradients transitioning to warm orange. Large data visualizations with smooth animations. Clean sans-serif typography with generous spacing. Subtle grid background pattern, motivational banner section with gradient overlay.`,
    },
  },
  {
    label: "Recipe Collection",
    styleTag: "Editorial",
    description: {
      mobile: "Ingredient cards, cooking mode, favorites",
      desktop: "Recipe grid, cooking instructions, meal planning",
    },
    icon: ChefHat,
    fullPrompt: {
      mobile: `Recipe collection app. Featured recipe hero section with beautiful food photography placeholder and cooking time badge. Ingredient list with quantity badges and checkable items. Step-by-step cooking mode with large readable text, timer widget, and progress indicator. Favorites collection organized in category tabs.

Also create the cooking mode screen and shopping list screen.

Editorial magazine aesthetic. Warm cream (#FFF8F0) and terracotta (#C17C60) palette. Elegant serif typography for headings, clean sans-serif for body. Card layouts with generous whitespace and subtle shadows. Sophisticated food photography placeholders with rounded corners.`,
      desktop: `Recipe collection website. Full-width hero with featured recipe of the day, large food photography placeholder, and elegant overlay text. Navigation bar with category dropdown menus. Main content as a Pinterest-style masonry grid of recipe cards with hover zoom effect. Sidebar with popular tags, cooking time filters, and difficulty levels. Recipe detail layout with two-column design: left side for step-by-step instructions with numbered steps, right side for ingredient checklist with serving size adjuster.

Also create the meal planner page and shopping list page.

Editorial magazine aesthetic. Warm cream (#FFF8F0) and terracotta (#C17C60) palette. Elegant serif typography for headings, clean sans-serif for body. Card layouts with generous whitespace and subtle drop shadows. Sophisticated food photography placeholders with rounded corners. Print-friendly recipe view option.`,
    },
  },
  {
    label: "Travel Planner",
    styleTag: "Wanderlust",
    description: {
      mobile: "Trip cards, itinerary timeline, packing lists",
      desktop: "Trip dashboard, interactive map, booking management",
    },
    icon: Plane,
    fullPrompt: {
      mobile: `Trip planning app. Upcoming trips as cards with destination cover photos, countdown timer, and date range. Day-by-day itinerary displayed as vertical timeline with location pins, time slots, and activity icons. Packing checklist with categorized expandable sections. Budget tracker showing expense breakdown in a donut chart with category colors.

Also create the day detail screen and expense logging screen.

Vibrant wanderlust aesthetic. Ocean teal (#0097A7) and sunset coral (#FF7043) as primary colors. Polaroid-style photo frames with slight rotation. Handwritten accent font for headings. Map markers, dotted path lines connecting destinations, adventure-themed iconography.`,
      desktop: `Trip planning website. Dashboard with upcoming trips as large cards with destination cover photos, countdown timers, and quick action buttons. Main trip view with split layout: left panel showing day-by-day itinerary as an interactive timeline, right panel with embedded map showing all locations with connected route lines. Top navigation with trip switcher dropdown. Budget section with expense table, category breakdown charts, and currency converter. Accommodation and flight booking cards with confirmation details.

Also create the explore destinations page and trip sharing page.

Vibrant wanderlust aesthetic. Ocean teal (#0097A7) and sunset coral (#FF7043) as primary colors. Large hero images with parallax scrolling effect. Handwritten accent font for headings. Interactive map with custom styled markers, dotted path animations connecting destinations, adventure-themed iconography throughout.`,
    },
  },
  {
    label: "Music Player",
    styleTag: "Dark Neon",
    description: {
      mobile: "Now playing, visualizer, playlist grid",
      desktop: "Full player, library browser, queue management",
    },
    icon: Music,
    fullPrompt: {
      mobile: `Music streaming app. Now playing screen featuring large album artwork with reflection effect, playback controls with scrubber, and like/shuffle/repeat buttons. Audio waveform visualizer bars animating with the beat. Up next queue as draggable list items. Playlist library displayed as a masonry grid of album art cards.

Also create the library browse screen and search screen.

Dark mode with neon accents. Deep charcoal (#1A1A2E) background with electric purple (#9D4EDD) and hot pink (#FF006E) gradient accents. Glassmorphic player controls with blur backdrop. Subtle glow effects on active elements. Bold geometric sans-serif typography with high contrast.`,
      desktop: `Music streaming website. Three-column layout: left sidebar with navigation and playlists, center main content area, right sidebar with queue and lyrics. Now playing bar fixed at bottom with album art thumbnail, track info, playback controls, progress bar, and volume slider. Main view showing artist page with large header image, bio section, popular tracks table with hover play buttons, albums grid, and related artists. Library view with filterable/sortable table of saved tracks.

Also create the playlist detail page and search results page.

Dark mode with neon accents. Deep charcoal (#1A1A2E) background with electric purple (#9D4EDD) and hot pink (#FF006E) gradient accents. Glassmorphic panels with blur backdrop. Subtle glow effects on interactive elements. Audio waveform visualizer in now playing bar. Bold geometric sans-serif typography with high contrast. Smooth hover transitions throughout.`,
    },
  },
];

const useCases = [
  {
    title: "Startup Founders",
    description:
      "Show investors a working prototype, not slides. Let them click through your app idea in real-time.",
  },
  {
    title: "Indie Developers",
    description:
      "Skip the design phase. Generate a clickable prototype in minutes and start building what matters.",
  },
  {
    title: "Product Managers",
    description:
      "Get stakeholder buy-in with prototypes they can actually test. No more explaining wireframes.",
  },
  {
    title: "Hackathon Teams",
    description:
      "Ship a polished demo on day one. Focus on your backend while AI handles the frontend.",
  },
  {
    title: "Freelancers & Agencies",
    description:
      "Win more clients with interactive prototypes. Show three concepts in the time it takes to make one.",
  },
];

// ============================================================================
// Component: Header
// Clean, minimal navigation
// ============================================================================

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#FAF8F5]/90 backdrop-blur-sm"
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16 border-b border-[#E8E4E0]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-[#B8956F]" />
            <span className="font-medium text-[#1A1A1A] tracking-tight">
              OpenDesign
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/blog"
              className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              Blog
            </Link>
            <a
              href="#pricing"
              className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              Pricing
            </a>
            <span className="text-sm text-[#9A9A9A] flex items-center gap-1.5 cursor-not-allowed">
              Explore
              <span className="text-[10px] bg-[#F5F2EF] text-[#6B6B6B] px-1.5 py-0.5 rounded">
                Soon
              </span>
            </span>
            <a
              href="https://github.com/papay0/opendesign"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-sm bg-[#1A1A1A] text-white px-4 py-2 rounded-lg hover:bg-[#333] transition-colors">
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/home"
                className="text-sm bg-[#1A1A1A] text-white px-4 py-2 rounded-lg hover:bg-[#333] transition-colors"
              >
                My Projects
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-[#6B6B6B] hover:text-[#1A1A1A]"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-b border-[#E8E4E0]"
          >
            <div className="flex flex-col gap-4">
              <Link href="/blog" className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A]">
                Blog
              </Link>
              <a href="#pricing" className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A]">
                Pricing
              </a>
              <span className="text-sm text-[#9A9A9A]">Explore (Coming Soon)</span>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-sm text-[#6B6B6B] text-left">Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="text-sm bg-[#1A1A1A] text-white px-4 py-2 rounded-lg w-fit">
                    Get Started
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/home"
                  className="text-sm bg-[#1A1A1A] text-white px-4 py-2 rounded-lg w-fit"
                >
                  My Projects
                </Link>
              </SignedIn>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}

// ============================================================================
// Component: Hero Section
// Bold typography-driven hero with asymmetric layout
// ============================================================================

// ============================================================================
// Component: Hero Phone Mockups
// Showcase beautiful generated prototypes with staggered reveal animation
// ============================================================================

// Hero showcase images - beautiful generated prototypes
const HERO_PHONES = {
  // Music app - dark mode, vibrant
  phone1: `${SUPABASE_ASSETS}/hero-phone-1`,
  // Fitness app - warm gradients
  phone2: `${SUPABASE_ASSETS}/hero-phone-2`,
  // Recipe app - clean, editorial
  phone3: `${SUPABASE_ASSETS}/hero-phone-3`,
};

function HeroPhoneMockup({
  image,
  delay,
  className,
  rotation = 0,
  onClick,
}: {
  image: string;
  delay: number;
  className?: string;
  rotation?: number;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ scale: 1.02 }}
      className={`relative ${className}`}
      style={{ transform: `rotate(${rotation}deg)` }}
      onClick={onClick}
    >
      {/* Phone Frame */}
      <div className="relative bg-[#1A1A1A] rounded-[2.5rem] p-2 shadow-2xl">
        {/* Screen */}
        <div className="relative bg-[#FAF8F5] rounded-[2rem] overflow-hidden aspect-[390/844]">
          <img
            src={image}
            alt="Generated prototype"
            className="w-full h-full object-cover object-top"
          />
        </div>
      </div>
    </motion.div>
  );
}

function HeroPhoneMockups() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const heroImages = [
    { src: HERO_PHONES.phone1, label: "Fitness App" },
    { src: HERO_PHONES.phone2, label: "Travel App" },
    { src: HERO_PHONES.phone3, label: "Finance App" },
  ];

  return (
    <div className="relative w-full">
      {/* Lightbox */}
      {lightboxIndex !== null && (
        <ComparisonLightbox
          images={heroImages}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Ambient glow - centered behind phones */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] blur-3xl opacity-15 bg-gradient-to-br from-[#B8956F] via-[#D4B896] to-[#E8D4C4] rounded-full pointer-events-none" />

      {/* Phone arrangement - stepped cascade, fully visible */}
      {/* Mobile: single centered phone | Tablet: 2 phones | Desktop: 3 phones */}
      <div className="flex items-end justify-center gap-4 md:gap-6 lg:gap-8 px-4">

        {/* Left phone - hidden on mobile, visible on tablet+ */}
        <div className="hidden md:block">
          <HeroPhoneMockup
            image={HERO_PHONES.phone1}
            delay={0.5}
            rotation={-3}
            className="w-36 lg:w-44 mb-8 cursor-pointer"
            onClick={() => setLightboxIndex(0)}
          />
        </div>

        {/* Center phone - hero, always visible, largest */}
        <div className="flex flex-col items-center">
          <HeroPhoneMockup
            image={HERO_PHONES.phone2}
            delay={0.3}
            rotation={0}
            className="w-52 md:w-56 lg:w-64 cursor-pointer"
            onClick={() => setLightboxIndex(1)}
          />
          {/* Badge directly under center phone */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-6 bg-white/90 backdrop-blur-sm border border-[#E8E4E0] rounded-full px-5 py-2 shadow-lg"
          >
            <span className="text-sm font-medium text-[#6B6B6B] flex items-center gap-2">
              <span className="w-2 h-2 bg-[#28C840] rounded-full animate-pulse" />
              Generated in seconds
            </span>
          </motion.div>
        </div>

        {/* Right phone - hidden on mobile, visible on tablet+ */}
        <div className="hidden md:block">
          <HeroPhoneMockup
            image={HERO_PHONES.phone3}
            delay={0.7}
            rotation={3}
            className="w-36 lg:w-44 mb-16 cursor-pointer"
            onClick={() => setLightboxIndex(2)}
          />
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  const [prompt, setPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [platform, setPlatform] = useState<Platform>("mobile");
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { savePendingPrompt } = usePendingPrompt();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const streamingRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  // Stream text character by character - fast, ~1 second total
  const streamText = useCallback(async (text: string) => {
    streamingRef.current.cancelled = false;
    setIsStreaming(true);
    setPrompt("");

    const startTime = Date.now();
    const targetDuration = 1500; // 1.5 seconds total

    for (let i = 0; i < text.length; i++) {
      if (streamingRef.current.cancelled) {
        break;
      }

      setPrompt(text.slice(0, i + 1));

      // Calculate how long we should have taken vs how long we actually took
      const expectedTime = ((i + 1) / text.length) * targetDuration;
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, expectedTime - elapsed);

      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    setIsStreaming(false);
  }, []);

  // Handle clicking an example card - uses platform-specific prompt
  const handleExampleClick = useCallback(
    (example: ExamplePrompt) => {
      // Cancel any ongoing streaming
      streamingRef.current.cancelled = true;

      // Focus textarea and start streaming with platform-specific prompt
      textareaRef.current?.focus();
      streamText(example.fullPrompt[platform]);
    },
    [streamText, platform]
  );

  // Handle user typing - cancels streaming
  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (isStreaming) {
        // User started typing, cancel streaming
        streamingRef.current.cancelled = true;
        setIsStreaming(false);
      }
      setPrompt(e.target.value);
    },
    [isStreaming]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // Cancel any streaming
    streamingRef.current.cancelled = true;
    setIsStreaming(false);

    // Save prompt to localStorage for use after auth
    savePendingPrompt(prompt.trim(), platform);

    if (isSignedIn) {
      // Already logged in - go directly to home
      // Home page will detect pending prompt and create project
      router.push("/home");
    } else {
      // Not logged in - redirect to sign-in
      // After sign-in, Clerk redirects to /home (per env config)
      router.push("/sign-in");
    }
  };

  return (
    <section className="pt-32 pb-24 px-6 overflow-hidden" aria-label="AI App Prototyper Hero">
      <div className="max-w-7xl mx-auto">
        {/* Two-column layout: Content left, Video right (video is larger) */}
        <div className="grid lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-10 items-center">
          {/* Left Column - Content */}
          <div>
            {/* Badges */}
            <motion.div
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="mb-8 flex flex-wrap items-center gap-3"
            >
              <a
                href="https://github.com/papay0/opendesign"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E8E4E0] bg-white/50 text-sm text-[#1A1A1A] hover:bg-white hover:border-[#1A1A1A] hover:shadow-sm transition-all"
              >
                <Github className="w-4 h-4" />
                Open Source
                <ArrowRight className="w-3 h-3 text-[#6B6B6B]" />
              </a>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E8E4E0] bg-white/50 text-sm text-[#6B6B6B]">
                <Sparkles className="w-4 h-4 text-[#B8956F]" />
                1,000+ prototypes created
              </span>
            </motion.div>

            {/* Main headline - Large serif typography with SEO keywords */}
            <motion.h1
              variants={slideUp}
              initial="hidden"
              animate="visible"
              className="font-serif text-5xl md:text-6xl lg:text-7xl text-[#1A1A1A] tracking-tight leading-[1.05] mb-6"
            >
              From Idea to Working Demo.{" "}
              <span className="text-[#B8956F] italic">In 60 Seconds.</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={slideUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.1 }}
              className="text-xl text-[#6B6B6B] mb-10 leading-relaxed"
            >
              Describe your app. AI builds a clickable prototype with real navigation.
              Test the user flow before writing a single line of code.
            </motion.p>

            {/* Main Input Form */}
            <motion.form
              variants={slideUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              onSubmit={handleSubmit}
              className="mb-8"
            >
              <div className="bg-white border border-[#E8E4E0] rounded-2xl p-2 shadow-sm">
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={handlePromptChange}
                  placeholder="A fitness app with workout tracking, a recipe collection with cooking mode..."
                  rows={3}
                  className="w-full bg-transparent text-[#1A1A1A] placeholder-[#9A9A9A] text-lg px-4 py-3 resize-none focus:outline-none"
                />
                <div className="flex items-center justify-between px-2 pb-1">
                  <PlatformSelector selected={platform} onChange={setPlatform} />
                  <button
                    type="submit"
                    disabled={isStreaming}
                    className="flex items-center gap-2 bg-[#B8956F] text-white font-medium px-5 py-2.5 rounded-xl hover:bg-[#A6845F] transition-colors disabled:opacity-50"
                  >
                    Generate it
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.form>
          </div>

          {/* Right Column - Beautiful Phone Mockups showcasing the output */}
          <div className="flex justify-center lg:justify-end">
            <HeroPhoneMockups />
          </div>
        </div>

        {/* Inspiration Cards - Full width below the hero */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-16"
        >
          <p className="text-sm text-[#9A9A9A] mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#B8956F]" />
            Need inspiration?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {examplePrompts.map((example) => {
              const IconComponent = example.icon;
              return (
                <motion.button
                  key={example.label}
                  variants={fadeIn}
                  onClick={() => handleExampleClick(example)}
                  className="text-left bg-white border border-[#E8E4E0] rounded-xl p-4 hover:border-[#B8956F] hover:shadow-md transition-all group"
                >
                  {/* Icon and Title Row */}
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E8E4E0] flex items-center justify-center flex-shrink-0 group-hover:bg-[#FFF8F0] group-hover:border-[#F5E6D3] transition-colors">
                      <IconComponent className="w-5 h-5 text-[#B8956F]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[#1A1A1A] text-sm">
                        {example.label}
                      </h3>
                      <span className="inline-block text-[10px] bg-[#F5F2EF] text-[#6B6B6B] px-2 py-0.5 rounded-full mt-1">
                        {example.styleTag}
                      </span>
                    </div>
                  </div>
                  {/* Description - platform-specific */}
                  <p className="text-xs text-[#6B6B6B] line-clamp-2">
                    {example.description[platform]}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// Component: Comparison Section
// Show OpenDesign vs competitors - Mobile and Desktop
// ============================================================================

const COMPARISON_IMAGES = {
  mobile: {
    opendesign: `${SUPABASE_ASSETS}/comparison-mobile-opendesign`,
    v0: `${SUPABASE_ASSETS}/comparison-mobile-v0`,
    lovable: `${SUPABASE_ASSETS}/comparison-mobile-lovable`,
    prompt: "Music streaming app",
  },
  desktop: {
    opendesign: `${SUPABASE_ASSETS}/comparison-desktop-opendesign`,
    v0: `${SUPABASE_ASSETS}/comparison-desktop-v0`,
    lovable: `${SUPABASE_ASSETS}/comparison-desktop-lovable`,
    prompt: "Recipe collection website",
  },
};

// Phone mockup frame component
function PhoneMockup({
  image,
  label,
  isHero = false,
  onClick,
}: {
  image: string;
  label: string;
  isHero?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`relative cursor-pointer transition-transform hover:scale-[1.02] ${isHero ? "" : "opacity-80 hover:opacity-100"}`}
      onClick={onClick}
    >
      {/* Label */}
      <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-sm font-medium px-4 py-1 rounded-full ${
        isHero
          ? "bg-[#B8956F] text-white"
          : "bg-[#F5F2EF] text-[#6B6B6B] border border-[#E8E4E0]"
      }`}>
        {label}
      </div>

      {/* Phone Frame */}
      <div className={`relative bg-[#1A1A1A] rounded-[2.5rem] p-2 ${isHero ? "shadow-2xl" : "shadow-lg"}`}>
        {/* Screen */}
        <div className="relative bg-[#FAF8F5] rounded-[2rem] overflow-hidden aspect-[390/844]">
          <img
            src={image}
            alt={`${label} mobile app output`}
            className={`w-full h-full object-cover object-top ${isHero ? "" : "grayscale-[20%]"}`}
          />
        </div>
      </div>
    </div>
  );
}

// Browser mockup frame component
function BrowserMockup({
  image,
  label,
  isHero = false,
  compact = false,
  onClick,
}: {
  image: string;
  label: string;
  isHero?: boolean;
  compact?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`relative cursor-pointer transition-transform hover:scale-[1.01] ${isHero ? "" : "opacity-80 hover:opacity-100"}`}
      onClick={onClick}
    >
      {/* Label */}
      <div className={`absolute -top-2.5 left-6 z-10 text-xs font-medium px-3 py-1 rounded-full ${
        isHero
          ? "bg-[#B8956F] text-white"
          : "bg-[#F5F2EF] text-[#6B6B6B] border border-[#E8E4E0]"
      }`}>
        {label}
      </div>

      {/* Browser Frame */}
      <div className={`bg-white rounded-xl overflow-hidden border ${isHero ? "border-[#B8956F] border-2 shadow-xl" : "border-[#E8E4E0] shadow-md"}`}>
        {/* Browser Chrome */}
        <div className={`bg-[#F5F2EF] flex items-center gap-2 border-b border-[#E8E4E0] ${compact ? "px-3 py-1.5" : "px-4 py-2.5"}`}>
          <div className="flex items-center gap-1.5">
            <div className={`rounded-full bg-[#FF5F57] ${compact ? "w-2 h-2" : "w-3 h-3"}`} />
            <div className={`rounded-full bg-[#FEBC2E] ${compact ? "w-2 h-2" : "w-3 h-3"}`} />
            <div className={`rounded-full bg-[#28C840] ${compact ? "w-2 h-2" : "w-3 h-3"}`} />
          </div>
          <div className="flex-1 ml-2">
            <div className={`bg-white rounded-md text-[#9A9A9A] border border-[#E8E4E0] ${compact ? "px-2 py-0.5 text-[10px] max-w-[120px]" : "px-3 py-1.5 text-xs max-w-[180px]"}`}>
              localhost:3000
            </div>
          </div>
        </div>

        {/* Screen with proper aspect ratio */}
        <div className={`bg-[#FAF8F5] overflow-hidden ${compact ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
          <img
            src={image}
            alt={`${label} desktop output`}
            className={`w-full h-full object-cover object-top ${isHero ? "" : "grayscale-[20%]"}`}
          />
        </div>
      </div>
    </div>
  );
}

// Lightbox carousel for comparing screenshots
function ComparisonLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: { src: string; label: string }[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goNext = () => setCurrentIndex((i) => (i + 1) % images.length);
  const goPrev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Navigation arrows */}
      <button
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        className="absolute left-4 md:left-8 text-white/70 hover:text-white transition-colors p-2"
      >
        <ArrowRight className="w-8 h-8 rotate-180" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        className="absolute right-4 md:right-8 text-white/70 hover:text-white transition-colors p-2"
      >
        <ArrowRight className="w-8 h-8" />
      </button>

      {/* Image container - fullscreen image */}
      <div
        className="relative flex flex-col items-center px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Label */}
        <div className={`mb-4 text-lg font-medium px-6 py-2 rounded-full ${
          currentIndex === 0
            ? "bg-[#B8956F] text-white"
            : "bg-white/10 text-white/90"
        }`}>
          {images[currentIndex].label}
        </div>

        {/* Full screenshot - no phone frame */}
        <motion.img
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          src={images[currentIndex].src}
          alt={images[currentIndex].label}
          className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
        />

        {/* Dots indicator */}
        <div className="flex gap-2 mt-6">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Desktop lightbox carousel for comparing screenshots
function DesktopComparisonLightbox({
  images,
  initialIndex,
  onClose,
}: {
  images: { src: string; label: string }[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const goNext = () => setCurrentIndex((i) => (i + 1) % images.length);
  const goPrev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Navigation arrows */}
      <button
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        className="absolute left-4 md:left-8 text-white/70 hover:text-white transition-colors p-2"
      >
        <ArrowRight className="w-8 h-8 rotate-180" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        className="absolute right-4 md:right-8 text-white/70 hover:text-white transition-colors p-2"
      >
        <ArrowRight className="w-8 h-8" />
      </button>

      {/* Image container - fullscreen image */}
      <div
        className="relative flex flex-col items-center px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Label */}
        <div className={`mb-4 text-lg font-medium px-6 py-2 rounded-full ${
          currentIndex === 0
            ? "bg-[#B8956F] text-white"
            : "bg-white/10 text-white/90"
        }`}>
          {images[currentIndex].label}
        </div>

        {/* Full screenshot - no browser frame */}
        <motion.img
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          src={images[currentIndex].src}
          alt={images[currentIndex].label}
          className="max-h-[80vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
        />

        {/* Dots indicator */}
        <div className="flex gap-2 mt-6">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentIndex ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ComparisonSection() {
  const [lightbox, setLightbox] = useState<{ type: "mobile" | "desktop"; index: number } | null>(null);

  const mobileImages = [
    { src: COMPARISON_IMAGES.mobile.opendesign, label: "OpenDesign" },
    { src: COMPARISON_IMAGES.mobile.v0, label: "v0" },
    { src: COMPARISON_IMAGES.mobile.lovable, label: "Lovable" },
  ];

  const desktopImages = [
    { src: COMPARISON_IMAGES.desktop.opendesign, label: "OpenDesign" },
    { src: COMPARISON_IMAGES.desktop.v0, label: "v0" },
    { src: COMPARISON_IMAGES.desktop.lovable, label: "Lovable" },
  ];

  return (
    <section className="py-24 px-6 bg-[#F5F2EF]" aria-label="OpenDesign vs Other AI Tools">
      {/* Mobile Lightbox */}
      {lightbox?.type === "mobile" && (
        <ComparisonLightbox
          images={mobileImages}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Desktop Lightbox */}
      {lightbox?.type === "desktop" && (
        <DesktopComparisonLightbox
          images={desktopImages}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}

      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          {/* Competition badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1A1A] text-white text-sm font-medium mb-6">
            <span>OpenDesign</span>
            <span className="text-white/50">vs</span>
            <span className="text-white/70">v0</span>
            <span className="text-white/50">vs</span>
            <span className="text-white/70">Lovable</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] tracking-tight mb-4">
            Same Prompt. Different Tools.
          </h2>
          <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto">
            We gave the exact same prompt to 3 AI prototyping tools. Here&apos;s what each one generated.
          </p>
        </motion.div>

        {/* Generation Time Comparison - Visual Bar Chart */}
        <motion.div
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mb-16 max-w-3xl mx-auto"
        >
          <p className="text-center text-sm font-medium text-[#6B6B6B] mb-6 uppercase tracking-wide">
            Time to First Result
          </p>

          <div className="space-y-3">
            {/* OpenDesign - 5 seconds = tiny bar */}
            <div className="flex items-center gap-4">
              <div className="w-24 text-right">
                <span className="font-medium text-[#1A1A1A]">OpenDesign</span>
              </div>
              <div className="flex-1 h-10 bg-[#E8E4E0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#B8956F] rounded-full flex items-center justify-end pr-3"
                  style={{ width: '3%' }}
                >
                </div>
              </div>
              <div className="w-28 text-left">
                <span className="text-lg font-bold text-[#B8956F]">5 sec</span>
              </div>
            </div>

            {/* v0 - 2 minutes = 120 seconds = 67% bar */}
            <div className="flex items-center gap-4">
              <div className="w-24 text-right">
                <span className="text-[#6B6B6B]">v0</span>
              </div>
              <div className="flex-1 h-10 bg-[#E8E4E0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#9A9A9A] rounded-full"
                  style={{ width: '67%' }}
                >
                </div>
              </div>
              <div className="w-28 text-left">
                <span className="text-lg font-bold text-[#6B6B6B]">2 min</span>
              </div>
            </div>

            {/* Lovable - 3 minutes = 180 seconds = 100% bar */}
            <div className="flex items-center gap-4">
              <div className="w-24 text-right">
                <span className="text-[#6B6B6B]">Lovable</span>
              </div>
              <div className="flex-1 h-10 bg-[#E8E4E0] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#9A9A9A] rounded-full"
                  style={{ width: '100%' }}
                >
                </div>
              </div>
              <div className="w-28 text-left">
                <span className="text-lg font-bold text-[#6B6B6B]">3 min</span>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-[#9A9A9A] mt-6">
            Results stream in real-time — start iterating while others are still building.
          </p>
        </motion.div>

        {/* ============ MOBILE COMPARISON ============ */}
        <motion.div
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-24"
        >
          {/* Mobile Header */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px flex-1 bg-[#E8E4E0]" />
            <div className="flex items-center gap-3 bg-white border border-[#E8E4E0] rounded-full px-5 py-2">
              <span className="text-sm font-medium text-[#1A1A1A]">Mobile App</span>
              <span className="text-[#9A9A9A]">•</span>
              <code className="text-sm font-mono text-[#6B6B6B]">&quot;{COMPARISON_IMAGES.mobile.prompt}&quot;</code>
            </div>
            <div className="h-px flex-1 bg-[#E8E4E0]" />
          </div>

          {/* Mobile Phones Grid - BIGGER */}
          <div className="flex flex-wrap justify-center items-end gap-6 md:gap-10">
            <div className="w-48 md:w-56 lg:w-64">
              <PhoneMockup
                image={COMPARISON_IMAGES.mobile.opendesign}
                label="OpenDesign"
                isHero
                onClick={() => setLightbox({ type: "mobile", index: 0 })}
              />
            </div>
            <div className="w-48 md:w-56 lg:w-64">
              <PhoneMockup
                image={COMPARISON_IMAGES.mobile.v0}
                label="v0"
                onClick={() => setLightbox({ type: "mobile", index: 1 })}
              />
            </div>
            <div className="w-48 md:w-56 lg:w-64">
              <PhoneMockup
                image={COMPARISON_IMAGES.mobile.lovable}
                label="Lovable"
                onClick={() => setLightbox({ type: "mobile", index: 2 })}
              />
            </div>
          </div>

          {/* Click hint */}
          <p className="text-center text-sm text-[#9A9A9A] mt-6">
            Click any phone to compare full-screen
          </p>
        </motion.div>

        {/* ============ DESKTOP COMPARISON ============ */}
        <motion.div
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {/* Desktop Header */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px flex-1 bg-[#E8E4E0]" />
            <div className="flex items-center gap-3 bg-white border border-[#E8E4E0] rounded-full px-5 py-2">
              <span className="text-sm font-medium text-[#1A1A1A]">Desktop Website</span>
              <span className="text-[#9A9A9A]">•</span>
              <code className="text-sm font-mono text-[#6B6B6B]">&quot;{COMPARISON_IMAGES.desktop.prompt}&quot;</code>
            </div>
            <div className="h-px flex-1 bg-[#E8E4E0]" />
          </div>

          {/* Desktop Layout: OpenDesign (60%) | v0 + Lovable stacked (40%) */}
          <div className="grid md:grid-cols-[3fr_2fr] gap-6 items-center max-w-5xl mx-auto">
            {/* OpenDesign - Hero (left side) */}
            <BrowserMockup
              image={COMPARISON_IMAGES.desktop.opendesign}
              label="OpenDesign"
              isHero
              onClick={() => setLightbox({ type: "desktop", index: 0 })}
            />

            {/* Competitors - Stacked vertically (right side) */}
            <div className="flex flex-col gap-4">
              <BrowserMockup
                image={COMPARISON_IMAGES.desktop.v0}
                label="v0"
                compact
                onClick={() => setLightbox({ type: "desktop", index: 1 })}
              />
              <BrowserMockup
                image={COMPARISON_IMAGES.desktop.lovable}
                label="Lovable"
                compact
                onClick={() => setLightbox({ type: "desktop", index: 2 })}
              />
            </div>
          </div>

          {/* Click hint */}
          <p className="text-center text-sm text-[#9A9A9A] mt-6">
            Click any browser to compare full-screen
          </p>
        </motion.div>

        {/* Caption */}
        <motion.p
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center text-sm text-[#6B6B6B] mt-12"
        >
          All outputs generated with default settings. No manual editing.
        </motion.p>
      </div>
    </section>
  );
}

// ============================================================================
// Component: Use Cases Section
// Who benefits from OpenDesign
// ============================================================================

function UseCasesSection() {
  return (
    <section className="py-24 px-6 bg-[#FAF8F5]" aria-label="Who Uses OpenDesign">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mb-16"
        >
          <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] tracking-tight mb-4">
            Built for Builders
          </h2>
          <p className="text-lg text-[#6B6B6B] max-w-xl">
            From pitch decks to hackathon demos, get a working prototype before lunch.
          </p>
        </motion.div>

        {/* Use Case Cards - 2 column grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-6"
        >
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              variants={slideUp}
              className="bg-white border border-[#E8E4E0] border-l-4 border-l-[#B8956F] rounded-xl p-6 hover:shadow-md transition-all"
            >
              <h3 className="font-serif text-xl text-[#1A1A1A] mb-2">
                {useCase.title}
              </h3>
              <p className="text-[#6B6B6B] leading-relaxed">
                {useCase.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// Component: Pricing Section
// Clean, transparent pricing with the editorial aesthetic
// ============================================================================

function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  // For annual, give 2 months free ($150/year = $12.50/month)
  const annualTotal = PLANS.pro.price * 10; // $150/year
  const annualPrice = annualTotal / 12; // $12.50/month

  return (
    <section id="pricing" className="py-24 px-6 bg-[#F5F2EF]" aria-label="Pricing Plans">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-[#6B6B6B] max-w-xl mx-auto">
            Start for free, upgrade when you need more. No hidden fees.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <span
            className={`text-sm font-medium transition-colors ${
              !isAnnual ? "text-[#1A1A1A]" : "text-[#6B6B6B]"
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isAnnual ? "bg-[#B8956F]" : "bg-[#D4CFC9]"
            }`}
          >
            <motion.div
              animate={{ x: isAnnual ? 24 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
            />
          </button>
          <span
            className={`text-sm font-medium transition-colors ${
              isAnnual ? "text-[#1A1A1A]" : "text-[#6B6B6B]"
            }`}
          >
            Annual
            <span className="ml-1.5 text-xs bg-[#E8F5E9] text-[#2E7D32] px-2 py-0.5 rounded-full">
              2 months free
            </span>
          </span>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto"
        >
          {/* Free Plan */}
          <motion.div
            variants={slideUp}
            className="bg-white border border-[#E8E4E0] rounded-2xl p-8 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E4E0] flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#6B6B6B]" />
              </div>
              <h3 className="font-serif text-2xl text-[#1A1A1A]">Free</h3>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-[#1A1A1A]">$0</span>
              <span className="text-[#6B6B6B] ml-1">/month</span>
            </div>

            <div className="flex items-center gap-2 mb-6 p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E4E0]">
              <MessageSquare className="w-4 h-4 text-[#6B6B6B]" />
              <span className="text-sm text-[#1A1A1A]">
                <strong>{PLANS.free.messagesPerMonth}</strong> AI generations/month
              </span>
            </div>

            <ul className="space-y-3 mb-8">
              {PLANS.free.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-sm text-[#6B6B6B]"
                >
                  <Check className="w-4 h-4 text-[#2E7D32] flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <SignedOut>
              <SignUpButton mode="modal">
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-[#E8E4E0] text-[#1A1A1A] rounded-xl font-medium hover:bg-[#FAF8F5] hover:border-[#D4CFC9] transition-all">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/home"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-[#E8E4E0] text-[#1A1A1A] rounded-xl font-medium hover:bg-[#FAF8F5] hover:border-[#D4CFC9] transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </SignedIn>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            variants={slideUp}
            className="bg-white border-2 border-[#B8956F] rounded-2xl p-8 relative hover:shadow-lg transition-all"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#B8956F] text-white text-xs font-medium px-4 py-1 rounded-full">
              Most Popular
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#B8956F] flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-serif text-2xl text-[#1A1A1A]">Pro</h3>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-[#1A1A1A]">
                ${isAnnual ? annualPrice.toFixed(2) : PLANS.pro.price}
              </span>
              <span className="text-[#6B6B6B] ml-1">/month</span>
              {isAnnual && (
                <span className="ml-2 text-sm text-[#2E7D32]">
                  (${annualTotal}/year)
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-6 p-3 bg-[#FFF8F0] rounded-xl border border-[#F5E6D3]">
              <MessageSquare className="w-4 h-4 text-[#B8956F]" />
              <span className="text-sm text-[#1A1A1A]">
                <strong>{PLANS.pro.messagesPerMonth}</strong> AI generations/month
              </span>
            </div>

            <ul className="space-y-3 mb-8">
              {PLANS.pro.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-sm text-[#1A1A1A]"
                >
                  <Check className="w-4 h-4 text-[#B8956F] flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            <SignedOut>
              <SignUpButton mode="modal">
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#B8956F] text-white rounded-xl font-medium hover:bg-[#A6845F] transition-colors">
                  Upgrade to Pro
                  <Crown className="w-4 h-4" />
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/home"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#B8956F] text-white rounded-xl font-medium hover:bg-[#A6845F] transition-colors"
              >
                Upgrade to Pro
                <Crown className="w-4 h-4" />
              </Link>
            </SignedIn>
          </motion.div>
        </motion.div>

        {/* BYOK and Message Pack Add-ons */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mt-8 space-y-4"
        >
          {/* BYOK Option */}
          <motion.div
            variants={slideUp}
            className="bg-gradient-to-r from-[#1A1A1A] to-[#2D2D2D] rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#B8956F]" />
              </div>
              <div>
                <p className="font-medium text-white">Bring Your Own Key</p>
                <p className="text-sm text-zinc-400">
                  Use your own API key for unlimited generations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-[#B8956F]/20 text-[#B8956F] px-3 py-1 rounded-full font-medium">
                Unlimited
              </span>
              <span className="text-xl font-bold text-white">Free</span>
            </div>
          </motion.div>

          {/* Message Pack Add-on */}
          <motion.div
            variants={slideUp}
            className="bg-white rounded-xl border border-[#E8E4E0] p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E8E4E0] flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#B8956F]" />
              </div>
              <div>
                <p className="font-medium text-[#1A1A1A]">Need more messages?</p>
                <p className="text-sm text-[#6B6B6B]">
                  Pro users can purchase extra message packs anytime
                </p>
              </div>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xl font-bold text-[#1A1A1A]">
                ${MESSAGE_PACK.priceUsd}
              </p>
              <p className="text-sm text-[#6B6B6B]">
                for {MESSAGE_PACK.messages} messages
              </p>
            </div>
          </motion.div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-2xl mx-auto mt-16"
        >
          <h3 className="font-serif text-2xl text-[#1A1A1A] text-center mb-8">
            Frequently Asked Questions
          </h3>

          <div className="space-y-4">
            <motion.details
              variants={fadeIn}
              className="bg-white rounded-xl border border-[#E8E4E0] p-5 group"
            >
              <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex items-center justify-between">
                What counts as a &quot;message&quot;?
                <span className="text-[#6B6B6B] group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-sm text-[#6B6B6B] leading-relaxed">
                Each AI generation request counts as one message. This includes
                creating new screens and editing existing ones. Viewing, exporting,
                or navigating your prototypes does not count.
              </p>
            </motion.details>

            <motion.details
              variants={fadeIn}
              className="bg-white rounded-xl border border-[#E8E4E0] p-5 group"
            >
              <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex items-center justify-between">
                What&apos;s the difference between Flash and Pro models?
                <span className="text-[#6B6B6B] group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-sm text-[#6B6B6B] leading-relaxed">
                Flash is faster and great for quick iterations. Pro produces higher
                quality prototypes with more attention to detail. Free users have access
                to Flash only, while Pro subscribers can use both.
              </p>
            </motion.details>

            <motion.details
              variants={fadeIn}
              className="bg-white rounded-xl border border-[#E8E4E0] p-5 group"
            >
              <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex items-center justify-between">
                Do unused messages roll over?
                <span className="text-[#6B6B6B] group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-sm text-[#6B6B6B] leading-relaxed">
                Monthly message allowances reset at the start of each billing cycle.
                However, any extra message packs you purchase never expire.
              </p>
            </motion.details>

            <motion.details
              variants={fadeIn}
              className="bg-white rounded-xl border border-[#E8E4E0] p-5 group"
            >
              <summary className="font-medium text-[#1A1A1A] cursor-pointer list-none flex items-center justify-between">
                Can I cancel anytime?
                <span className="text-[#6B6B6B] group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </summary>
              <p className="mt-4 text-sm text-[#6B6B6B] leading-relaxed">
                Yes! You can cancel your subscription at any time. You&apos;ll continue
                to have Pro access until the end of your current billing period.
              </p>
            </motion.details>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// Component: CTA Section
// Clean, confident call-to-action
// ============================================================================

function CTASection() {
  return (
    <section className="py-24 px-6 bg-[#1A1A1A]" aria-label="Get Started with OpenDesign">
      <motion.div
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="max-w-4xl mx-auto text-center"
      >
        <h2 className="font-serif text-4xl md:text-5xl text-white tracking-tight mb-6">
          Your Next Prototype is 60 Seconds Away
        </h2>
        <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto">
          Describe it. Generate it. Click through it.
          Open source, no account required with BYOK.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="flex items-center gap-2 bg-[#B8956F] text-white font-medium px-8 py-3.5 rounded-xl hover:bg-[#A6845F] transition-colors text-lg">
                Start Building
                <ArrowRight className="w-5 h-5" />
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/home"
              className="flex items-center gap-2 bg-[#B8956F] text-white font-medium px-8 py-3.5 rounded-xl hover:bg-[#A6845F] transition-colors text-lg"
            >
              My Projects
              <ArrowRight className="w-5 h-5" />
            </Link>
          </SignedIn>
          <a
            href="https://github.com/papay0/opendesign"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-6 py-3.5 rounded-xl transition-colors"
          >
            <Github className="w-5 h-5" />
            View on GitHub
          </a>
        </div>
      </motion.div>
    </section>
  );
}

// ============================================================================
// Component: Footer
// Minimal, elegant footer
// ============================================================================

function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-[#E8E4E0]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#B8956F]" />
            <span className="text-sm font-medium text-[#1A1A1A]">OpenDesign</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-[#6B6B6B]">
            <a
              href="https://github.com/papay0/opendesign"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#1A1A1A] transition-colors"
            >
              GitHub
            </a>
            <span className="text-[#9A9A9A]">MIT License</span>
          </div>

          {/* Built by */}
          <p className="text-sm text-[#6B6B6B]">
            Built by{" "}
            <a
              href="https://x.com/papay0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1A1A1A] hover:text-[#B8956F] transition-colors"
            >
              @papay0
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  // Auto-redirect signed-in users to /home
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/home");
    }
  }, [isLoaded, isSignedIn, router]);

  // Show nothing while checking auth to avoid flash
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B8956F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If signed in, show loading while redirecting
  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B8956F] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header />
      <main>
        <HeroSection />
        <ComparisonSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
