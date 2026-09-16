"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Calendar,
  Play,
  Pause,
  BellRing,
  ShieldCheck,
  Loader2,
} from "lucide-react";

interface Stats {
  appointmentsToday: number;
  totalLeads: number;
  pendingReminders: number;
  confirmedTotal: number;
}

interface UpcomingAppointment {
  id: string;
  clientName: string;
  service: string;
  startTime: string;
  status: string;
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60_000);
  const diffH = Math.round(diffMs / 3_600_000);
  const diffD = Math.round(diffMs / 86_400_000);

  if (diffMs < 0) return "Pasada";
  if (diffMin < 60) return `En ${diffMin} min`;
  if (diffH < 24) return `En ${diffH}h`;
  return `En ${diffD}d`;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("es-DO", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OverviewPage() {
  const [isBotActive, setIsBotActive] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch("/api/appointments");
        const data = await res.json();

        const appointments: UpcomingAppointment[] = data.data || [];
        const now = new Date();
        const todayStr = now.toDateString();

        const todayAppts = appointments.filter(
          (a) => new Date(a.startTime).toDateString() === todayStr
        );
        const futureAppts = appointments
          .filter((a) => new Date(a.startTime) >= now)
          .slice(0, 4);

        setUpcoming(futureAppts);
        setStats({
          appointmentsToday: todayAppts.length,
          totalLeads: appointments.length, // approximate
          pendingReminders: appointments.filter((a) => a.status === "CONFIRMED").length,
          confirmedTotal: appointments.filter((a) => a.status === "CONFIRMED").length,
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const kpiCards = [
    {
      title: "Citas Agendadas Hoy",
      value: stats ? String(stats.appointmentsToday) : "—",
      change: "Via WhatsApp interactivo",
      icon: CalendarCheck,
      gradient: "from-emerald-500/20 to-teal-500/5",
      borderColor: "border-emerald-500/30",
      textColor: "text-emerald-400",
    },
    {
      title: "Citas Confirmadas",
      value: stats ? String(stats.confirmedTotal) : "—",
      change: "En agenda activa",
      icon: Calendar,
      gradient: "from-teal-500/20 to-emerald-500/5",
      borderColor: "border-teal-500/30",
      textColor: "text-teal-400",
    },
    {
      title: "Recordatorios Pendientes",
      value: stats ? String(stats.pendingReminders) : "—",
      change: "Enviados por WhatsApp",
      icon: BellRing,
      gradient: "from-blue-500/20 to-emerald-500/5",
      borderColor: "border-blue-500/30",
      textColor: "text-blue-400",
    },
    {
      title: "Bot Interactivo",
      value: isBotActive ? "Activo" : "Pausado",
      change: isBotActive ? "Atendiendo 24/7" : "Modo manual",
      icon: ShieldCheck,
      gradient: "from-purple-500/20 to-emerald-500/5",
      borderColor: "border-purple-500/30",
      textColor: "text-purple-400",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "SCHEDULED": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "RESCHEDULED": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "CANCELLED": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      default: return "bg-gray-800 text-gray-400 border-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      CONFIRMED: "Confirmada",
      SCHEDULED: "Agendada",
      RESCHEDULED: "Reagendada",
      CANCELLED: "Cancelada",
      COMPLETED: "Completada",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-gray-900 via-gray-900/90 to-emerald-950/40 border border-emerald-500/20 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              SmartSchedule v2.0
            </span>
            <span className="text-xs text-gray-400 font-medium">
              Agendador de Citas por WhatsApp
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Panel de Control
          </h1>
          <p className="text-xs text-gray-400">
            Los clientes agendan por WhatsApp en 3 toques — sin llamadas, sin apps.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-gray-950/60 p-2 rounded-xl border border-gray-800">
          <div className="text-right">
            <div className="text-xs font-semibold text-gray-200">
              {isBotActive ? "Bot Interactivo Activo" : "Bot Pausado"}
            </div>
            <div className="text-[10px] text-gray-400">
              {isBotActive ? "Respondiendo mensajes de WhatsApp" : "Modo manual activo"}
            </div>
          </div>
          <button
            onClick={() => setIsBotActive(!isBotActive)}
            className={`p-2.5 rounded-xl font-medium text-xs flex items-center gap-2 transition-all ${
              isBotActive
                ? "bg-emerald-500 text-gray-950 hover:bg-emerald-400 font-bold shadow-md shadow-emerald-950"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {isBotActive ? (
              <><Pause className="w-4 h-4 fill-current" /> Pausar</>
            ) : (
              <><Play className="w-4 h-4 fill-current" /> Activar</>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl bg-gradient-to-b ${card.gradient} border ${card.borderColor} backdrop-blur-md relative overflow-hidden hover:border-emerald-500/50 transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-400">{card.title}</span>
                <div className={`p-2 rounded-xl bg-gray-900/60 ${card.textColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white tracking-tight mb-1">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-500" /> : card.value}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{card.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* How it works — WhatsApp Flow explainer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Flujo de Agendamiento por WhatsApp
            </h2>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {isBotActive ? "Activo" : "Pausado"}
            </span>
          </div>

          <div className="bg-[#0d1322] border border-gray-800/80 rounded-2xl overflow-hidden p-4 space-y-3">
            {[
              {
                step: "1",
                title: "Cliente escribe cualquier mensaje",
                detail: "\"Hola\" · \"Quiero una cita\" · \"Disponibilidad?\"",
                color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
              },
              {
                step: "2",
                title: "Bot envía menú de servicios (Lista interactiva)",
                detail: "El cliente toca el servicio deseado sin escribir nada",
                color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
              },
              {
                step: "3",
                title: "Bot envía los próximos 3 días disponibles (Botones)",
                detail: "Lun 16 · Mar 17 · Mié 18 — un toque para seleccionar",
                color: "text-purple-400 border-purple-500/30 bg-purple-500/10",
              },
              {
                step: "4",
                title: "Bot envía horarios disponibles (Lista interactiva)",
                detail: "Solo horarios sin conflictos basados en el calendario real",
                color: "text-teal-400 border-teal-500/30 bg-teal-500/10",
              },
              {
                step: "✅",
                title: "Cita confirmada + Recordatorio automático programado",
                detail: "El sistema agenda un recordatorio 24h antes por WhatsApp",
                color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-900/40 border border-gray-800/60"
              >
                <span className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold border ${item.color}`}>
                  {item.step}
                </span>
                <div>
                  <div className="text-sm font-semibold text-gray-200">{item.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-teal-400" />
              Próximas Citas
            </h2>
            <a
              href="/dashboard/calendar"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5"
            >
              Ver calendario <ChevronRight className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              </div>
            ) : upcoming.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#0d1322] border border-gray-800/80 text-center text-xs text-gray-400">
                No hay citas próximas agendadas.<br />
                <a href="/dashboard/calendar" className="text-emerald-400 mt-1 inline-block">
                  Ir al calendario →
                </a>
              </div>
            ) : (
              upcoming.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl bg-[#0d1322] border border-gray-800/80 hover:border-emerald-500/30 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-gray-200">{app.clientName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${getStatusColor(app.status)}`}>
                      {getStatusLabel(app.status)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{app.service}</div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800/60 font-mono">
                    <span>{formatDateTime(app.startTime)}</span>
                    <span className="text-emerald-400">{formatRelativeTime(app.startTime)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
