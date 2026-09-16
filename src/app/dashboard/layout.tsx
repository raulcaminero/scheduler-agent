"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  Bot,
  Users,
  Settings,
  Sparkles,
  Wifi,
  WifiOff,
  Bell,
  Search,
  Menu,
  X,
  Clock,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWhatsappOnline, setIsWhatsappOnline] = useState(true);

  const navItems = [
    {
      name: "Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "WhatsApp Hub",
      href: "/dashboard/whatsapp",
      icon: MessageSquare,
      badge: isWhatsappOnline ? "Online" : "Disconnected",
      badgeColor: isWhatsappOnline
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        : "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    {
      name: "Calendar & Availability",
      href: "/dashboard/calendar",
      icon: Calendar,
    },
    {
      name: "Appointment Assistant",
      href: "/dashboard/ai-agent",
      icon: Bot,
    },
    {
      name: "Bookings & Clients",
      href: "/dashboard/leads",
      icon: Users,
    },
    {
      name: "Business Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="flex h-screen bg-[#080c14] overflow-hidden">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-50 flex flex-col w-64 h-full bg-[#0d1322] border-r border-gray-800/80 transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800/60">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight leading-none">
                SmartSchedule
              </h1>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                WhatsApp Scheduler
              </span>
            </div>
          </Link>
          <button
            className="md:hidden text-gray-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
            Main Menu
          </div>

          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-600/20 to-teal-600/10 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-950/40"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-emerald-400" : "text-gray-400"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* WhatsApp Connection Footer Card */}
        <div className="p-4 border-t border-gray-800/60">
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-gray-900 via-gray-900/90 to-emerald-950/30 border border-emerald-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                {isWhatsappOnline ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                )}
                WhatsApp Business
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">v1.2</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">
              {isWhatsappOnline
                ? "Bot is active & scheduling appointments 24/7."
                : "Disconnected. Connect to enable automated booking."}
            </p>
            <button
              onClick={() => setIsWhatsappOnline(!isWhatsappOnline)}
              className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                isWhatsappOnline
                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                  : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-950"
              }`}
            >
              {isWhatsappOnline ? "Active Connection" : "Connect WhatsApp"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#080c14]">
        {/* Top Header */}
        <header className="h-16 px-6 bg-[#0d1322]/80 backdrop-blur-md border-b border-gray-800/80 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Quick Search */}
            <div className="relative hidden sm:block w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search appointments, slots, clients..."
                className="w-full bg-gray-900/80 border border-gray-800 text-xs rounded-xl pl-9 pr-4 py-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live AI Status Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Auto-Scheduling Active
            </div>

            {/* Notification Bell */}
            <button className="relative text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800/60 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3 pl-2 border-l border-gray-800/80">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-semibold text-white text-xs shadow-md">
                RC
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-gray-200">Raul Caminero</div>
                <div className="text-[10px] text-gray-400">Admin Org</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
