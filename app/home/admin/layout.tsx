"use client";

/**
 * Admin Layout
 *
 * Provides a consistent navigation structure for all admin pages.
 * Features a sidebar with links to different admin sections.
 */

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const navItems: NavItem[] = [
  {
    href: "/home/admin",
    label: "Analytics",
    icon: BarChart3,
    description: "Costs & usage",
  },
  {
    href: "/home/admin/users",
    label: "Users",
    icon: Users,
    description: "Manage users",
  },
  {
    href: "/home/admin/audit",
    label: "Audit Logs",
    icon: FileText,
    description: "Activity logs",
  },
  {
    href: "/home/admin/business",
    label: "Business",
    icon: TrendingUp,
    description: "Projections",
  },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        isActive
          ? "bg-gradient-to-r from-[#B8956F] to-[#A07850] text-white shadow-lg shadow-[#B8956F]/20"
          : "text-[#6B6B6B] hover:bg-[#F5F2EF] hover:text-[#1A1A1A]"
      }`}
    >
      <div
        className={`p-2 rounded-lg ${
          isActive ? "bg-white/20" : "bg-[#F5F2EF]"
        }`}
      >
        <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#B8956F]"}`} />
      </div>
      <div>
        <p className={`text-sm font-medium ${isActive ? "text-white" : ""}`}>
          {item.label}
        </p>
        <p
          className={`text-xs ${
            isActive ? "text-white/70" : "text-[#9A9A9A]"
          }`}
        >
          {item.description}
        </p>
      </div>
    </Link>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Determine active nav item (exact match for /admin, prefix match for others)
  const isActive = (href: string) => {
    if (href === "/home/admin") {
      return pathname === "/home/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <div className="flex">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-72 min-h-screen bg-white border-r border-[#E8E4E0] p-6 flex flex-col"
        >
          {/* Back link */}
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          {/* Admin header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#B8956F] to-[#A07850] shadow-lg shadow-[#B8956F]/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#1A1A1A] tracking-tight">
                Admin Panel
              </h1>
              <p className="text-xs text-[#9A9A9A]">Manage your platform</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
              />
            ))}
          </nav>

          {/* Footer */}
          <div className="pt-6 border-t border-[#F0EBE6]">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#F5F2EF] rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-[#6B6B6B]">
                Admin Access Active
              </span>
            </div>
          </div>
        </motion.aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
