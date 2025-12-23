"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

// Base skeleton with shimmer animation
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-[#F5F2EF]",
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
}

// Dashboard/Home page skeleton
export function DashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <Skeleton className="h-10 w-72 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Prompt Input */}
      <div className="mb-8">
        <Skeleton className="h-14 w-full rounded-2xl" />
      </div>

      {/* Projects Section */}
      <div>
        <Skeleton className="h-8 w-36 mb-6" />

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white border border-[#E8E4E0] rounded-2xl p-4"
            >
              {/* Icon and title */}
              <div className="flex items-start gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-1" />
                </div>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#F5F2EF]">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Project detail page skeleton
export function ProjectSkeleton() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-[#E8E4E0] bg-white">
        <Skeleton className="w-9 h-9 rounded-lg" />
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="ml-auto">
          <Skeleton className="h-9 w-44 rounded-lg" />
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-1/3 min-w-[320px] max-w-[480px] flex flex-col border-r border-[#E8E4E0] bg-white">
          {/* Messages area */}
          <div className="flex-1 p-4 space-y-4">
            {/* User message */}
            <div className="flex gap-3 flex-row-reverse">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <Skeleton className="h-16 w-3/4 rounded-2xl" />
            </div>
            {/* Assistant message */}
            <div className="flex gap-3">
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
            {/* Another user message */}
            <div className="flex gap-3 flex-row-reverse">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <Skeleton className="h-12 w-2/3 rounded-2xl" />
            </div>
          </div>
          {/* Input area */}
          <div className="p-4 border-t border-[#E8E4E0]">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>

        {/* Right Panel - Canvas */}
        <div className="flex-1 bg-[#FAF8F5] flex items-center justify-center p-8">
          <div className="flex gap-16">
            {/* Phone mockup skeleton */}
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="w-[200px] h-[420px] rounded-[2.5rem]" />
              <Skeleton className="h-5 w-24" />
            </div>
            {/* Another phone mockup skeleton */}
            <div className="flex flex-col items-center gap-3">
              <Skeleton className="w-[200px] h-[420px] rounded-[2.5rem]" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
